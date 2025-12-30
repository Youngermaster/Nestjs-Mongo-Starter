import { Request } from 'express';
import { UserDocument } from '../../users/schemas/user.schema.js';

export interface UserRequest extends Request {
  user: UserDocument;
}
