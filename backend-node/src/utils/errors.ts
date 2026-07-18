export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const BadRequest = (m: string, code?: string) => new ApiError(400, m, code);
export const Unauthorized = (m = 'Unauthorized') => new ApiError(401, m, 'UNAUTHORIZED');
export const Forbidden = (m = 'Forbidden') => new ApiError(403, m, 'FORBIDDEN');
export const NotFound = (m = 'Not Found') => new ApiError(404, m, 'NOT_FOUND');
export const Conflict = (m: string) => new ApiError(409, m, 'CONFLICT');
