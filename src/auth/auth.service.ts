import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersRepository } from '../users/users.repository.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { UserResponseDto } from '../users/dto/user-response.dto.js';
import { BcryptUtil } from '../common/utils/bcrypt.util.js';
import {
  JwtPayload,
  RefreshTokenPayload,
} from '../common/interfaces/jwt-payload.interface.js';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema.js';
import { MESSAGES } from '../common/constants/messages.constant.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async register(
    registerDto: RegisterDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const existingUser = await this.usersRepository.findByEmail(
      registerDto.email,
    );

    if (existingUser) {
      throw new ConflictException(MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }

    const saltRounds = this.configService.get<number>('bcrypt.saltRounds')!;
    const hashedPassword = await BcryptUtil.hash(
      registerDto.password,
      saltRounds,
    );

    const user = await this.usersRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
      user.roles,
      userAgent,
      ipAddress,
    );

    const userObj = user.toObject();

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: new UserResponseDto({
        ...userObj,
        _id: userObj._id.toString(),
      }),
      tokenType: 'Bearer',
      expiresIn: this.getAccessTokenExpiresIn(),
    };
  }

  async login(
    loginDto: LoginDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findByEmail(loginDto.email, true);

    if (!user) {
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await BcryptUtil.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    await this.usersRepository.updateLastLogin(user._id.toString());

    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
      user.roles,
      userAgent,
      ipAddress,
    );

    const userObject = user.toObject();

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: new UserResponseDto({
        _id: userObject._id.toString(),
        email: userObject.email,
        firstName: userObject.firstName,
        lastName: userObject.lastName,
        roles: userObject.roles,
        isActive: userObject.isActive,
        createdAt: userObject.createdAt,
        updatedAt: userObject.updatedAt,
      }),
      tokenType: 'Bearer',
      expiresIn: this.getAccessTokenExpiresIn(),
    };
  }

  async refreshToken(
    refreshTokenString: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify<RefreshTokenPayload>(
        refreshTokenString,
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
        },
      );

      const storedToken = await this.refreshTokenModel
        .findOne({
          token: refreshTokenString,
          userId: new Types.ObjectId(payload.sub),
        })
        .exec();

      if (!storedToken) {
        throw new UnauthorizedException(MESSAGES.AUTH.INVALID_TOKEN);
      }

      if (storedToken.isRevoked) {
        throw new UnauthorizedException(MESSAGES.AUTH.TOKEN_REVOKED);
      }

      if (storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException(MESSAGES.AUTH.TOKEN_EXPIRED);
      }

      const user = await this.usersRepository.findById(payload.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const newAccessToken = this.generateAccessToken(
        payload.sub,
        user.email,
        user.roles,
      );

      const newRefreshToken = await this.rotateRefreshToken(storedToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException(MESSAGES.AUTH.INVALID_TOKEN);
    }
  }

  async logout(userId: string, refreshTokenString: string): Promise<void> {
    await this.refreshTokenModel
      .updateOne(
        { token: refreshTokenString, userId: new Types.ObjectId(userId) },
        { isRevoked: true, revokedAt: new Date() },
      )
      .exec();
  }

  private async generateTokens(
    userId: string,
    email: string,
    roles: string[],
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.generateAccessToken(userId, email, roles);
    const refreshToken = await this.createRefreshToken(
      userId,
      userAgent,
      ipAddress,
    );

    return { accessToken, refreshToken };
  }

  private generateAccessToken(
    userId: string,
    email: string,
    roles: string[],
  ): string {
    const payload: JwtPayload = {
      sub: userId,
      email,
      roles,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.accessSecret')!,
      expiresIn: this.configService.get<string>('jwt.accessExpiresIn')!,
    });
  }

  private async createRefreshToken(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string> {
    const tokenId = new Types.ObjectId().toString();
    const payload: RefreshTokenPayload = {
      sub: userId,
      tokenId,
      type: 'refresh',
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret')!,
      expiresIn: this.configService.get<string>('jwt.refreshExpiresIn')!,
    });

    const expiresIn = this.configService.get<string>('jwt.refreshExpiresIn')!;
    const expiresAt = this.calculateExpirationDate(expiresIn);

    await this.refreshTokenModel.create({
      userId: new Types.ObjectId(userId),
      token,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return token;
  }

  private async rotateRefreshToken(
    oldToken: RefreshTokenDocument,
  ): Promise<string> {
    await this.refreshTokenModel
      .updateOne(
        { _id: oldToken._id },
        { isRevoked: true, revokedAt: new Date() },
      )
      .exec();

    return this.createRefreshToken(
      oldToken.userId.toString(),
      oldToken.userAgent,
      oldToken.ipAddress,
    );
  }

  private calculateExpirationDate(expiresIn: string): Date {
    const now = new Date();
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      throw new Error('Invalid expiration format');
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        throw new Error('Invalid time unit');
    }
  }

  private getAccessTokenExpiresIn(): number {
    const expiresIn = this.configService.get<string>('jwt.accessExpiresIn')!;
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      return 900;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900;
    }
  }
}
