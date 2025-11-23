// Common types
export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  message?: string;
  data?: T;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth related types
export interface Theme {
  floorColor: string;
  wallColor: string;
  weather: "sunny" | "raining" | "cloudy" | "snowing" | "night" | "sunset";
}

export interface JWTPayload {
  id: string;
  email: string;
  name?: string;
}

// Extend Express namespace
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface User extends JWTPayload {}
    interface Request {
      user?: User;
      files?:
        | Express.Multer.File[]
        | { [fieldname: string]: Express.Multer.File[] };
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */
