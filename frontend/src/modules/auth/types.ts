export interface User {
  id?: string;
  username: string;
  email?: string;
  role?: string;
}

export interface LoginDTO {
  username: string;
  password: string;
}

export interface RegisterDTO extends LoginDTO {
  email: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  username: string;
}