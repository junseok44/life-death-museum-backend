// Common types
export interface ApiResponse<T = any> {
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

export interface UserPayload {
    id: string;
    name?: string;
    email: string;
    theme: Theme;
    invitation?: string;
    objectIds: any[];
    modifiedObjectIds: any[];
    createdAt: Date;
}

export interface JWTPayload {
    id: string;
    email: string;
    name?: string;
}

// Extend Express namespace
declare global {
    namespace Express {
        interface User extends UserPayload {}
    }
}
