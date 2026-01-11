import React, { useState } from 'react';
import { useAuth } from '../hooks';
import { Input } from '../../../components/common/Input';
import { Button } from '../../../components/common/Button';

export const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'USER', // Default role
  });
  const { register, isLoading, error } = useAuth();
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(formData);
      setSuccess(true);
    } catch (err) {
      // Error handled by hook
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <h3 className="text-xl font-bold text-green-600">Registration Successful!</h3>
        <p>You can now log in with your credentials.</p>
        <a href="/login" className="text-blue-600 hover:underline">Go to Login</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <Input
        label="Username"
        name="username"
        type="text"
        value={formData.username}
        onChange={handleChange}
        placeholder="Enter username"
        required
      />
      <Input
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Enter email"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="Enter password"
        required
      />
      <div className="flex flex-col space-y-1 text-left w-full text-black">
        <label className="text-sm font-medium text-gray-700">Role</label>
        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300"
        >
          <option value="STUDENT">Student</option>
          <option value="INSTRUCTOR">Instructor</option>
          <option value="SCHOOLADMIN">School Admin</option>
        </select>
      </div>
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <Button type="submit" isLoading={isLoading} className="w-full">
        Register
      </Button>
    </form>
  );
};
