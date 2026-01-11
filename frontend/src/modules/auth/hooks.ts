import {useState} from 'react';
import {useAuthStore} from './store';
import * as authApi from './api';
import type {LoginDTO, RegisterDTO} from './types';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth, clearAuth, user } = useAuthStore();

  const login = async (credentials: LoginDTO) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authApi.login(credentials);
      setAuth({
        accessToken: data.accessToken,
        user: { username: data.username }
      });
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterDTO) => {
    setIsLoading(true);
    setError(null);
    try {
        return await authApi.register(userData);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      clearAuth();
      setIsLoading(false);
    }
  };

  const sendEmail = async (email: string, username: string) => {
    setIsLoading(true);
    setError(null);
    try {
      return await authApi.sendEmail(email, username);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to send email';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    sendEmail,
    isAuthenticated: !!user
  };
};
