import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { QueryUserDto } from './dto/query-user.dto.js';
import { ResponseUtil } from '../common/utils/response.util.js';
import { FilterQuery } from 'mongoose';
import { UserDocument } from './schemas/user.schema.js';
import { MESSAGES } from '../common/constants/messages.constant.js';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.usersRepository.findByEmail(
      createUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException(MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }

    const user = await this.usersRepository.create(createUserDto);
    return new UserResponseDto(user.toObject());
  }

  async findAll(queryDto: QueryUserDto) {
    const { page, limit, sortBy, sortOrder, email, isActive } = queryDto;

    const filter: FilterQuery<UserDocument> = {};
    if (email) filter.email = email;
    if (isActive !== undefined) filter.isActive = isActive;

    const { data, total } = await this.usersRepository.findWithPagination(
      filter,
      page,
      limit,
      sortBy,
      sortOrder,
    );

    const users = data.map((user) => new UserResponseDto(user.toObject()));

    return ResponseUtil.paginated(users, page, limit, total);
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(MESSAGES.USER.NOT_FOUND);
    }

    return new UserResponseDto(user.toObject());
  }

  async findByEmail(email: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new NotFoundException(MESSAGES.USER.NOT_FOUND);
    }

    return new UserResponseDto(user.toObject());
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.usersRepository.update(id, updateUserDto);

    if (!user) {
      throw new NotFoundException(MESSAGES.USER.NOT_FOUND);
    }

    return new UserResponseDto(user.toObject());
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.delete(id);

    if (!user) {
      throw new NotFoundException(MESSAGES.USER.NOT_FOUND);
    }
  }
}
