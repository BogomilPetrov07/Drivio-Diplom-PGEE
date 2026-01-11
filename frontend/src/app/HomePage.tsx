import React from 'react';
import { useAuth } from '../modules/auth/hooks';

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="text-center space-y-6 py-12">
      <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
        Welcome to <span className="text-blue-600">Drivio</span>
      </h1>
      <p className="text-xl text-gray-600 max-w-2xl mx-auto">
        The ultimate platform for managing your driving school experience.
      </p>
      
      {isAuthenticated ? (
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-lg max-w-md mx-auto">
          <h2 className="text-2xl font-semibold text-blue-800">Hello, {user?.username}!</h2>
          <p className="mt-2 text-blue-600">You are successfully logged in.</p>
        </div>
      ) : (
        <div className="flex justify-center space-x-4">
          <a
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition"
          >
            Get Started
          </a>
          <a
            href="/register"
            className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-md font-semibold hover:bg-blue-50 transition"
          >
            Register Now
          </a>
        </div>
      )}
    </div>
  );
};
