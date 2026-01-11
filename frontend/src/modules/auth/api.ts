import api from '../../services/api';
import type { LoginDTO, RegisterDTO, AuthResponse } from './types';

export const login = async (credentials: LoginDTO): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/auth/login', credentials);
  return data;
};

export const register = async (userData: RegisterDTO): Promise<{ message: string }> => {
  const { data } = await api.post<{ message: string }>('/auth/register', userData);
  return data;
};

export const logout = async (): Promise<void> => {
  await api.get('/auth/logout');
};

export const sendEmail = async (email: string, username: string): Promise<any> => {
  const { data } = await api.post('/auth/sendEmail', { email, username });
  return data;
};
