import { ApiResponse, PaginatedResponse } from '../interfaces/api-response.interface.js';

export class ResponseUtil {
  static success<T>(data: T, message?: string): Omit<ApiResponse<T>, 'timestamp' | 'path'> {
    return {
      success: true,
      data,
      message,
    };
  }

  static error(message: string): Omit<ApiResponse, 'timestamp' | 'path'> {
    return {
      success: false,
      message,
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
  ): PaginatedResponse<T> {
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
