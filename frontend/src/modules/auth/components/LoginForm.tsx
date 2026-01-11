import React, { useState } from 'react';
import { useAuth } from '../hooks';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';

export const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
      // Redirect or handle success (usually handled by store/router)
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <Input
        label="Username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Enter your username"
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
        required
      />
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <Button type="submit" isLoading={isLoading} className="w-full">
        Login
      </Button>
    </form>
  );
};
