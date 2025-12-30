import { Role } from '../constants/role.enum.js';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  type: 'refresh';
}
