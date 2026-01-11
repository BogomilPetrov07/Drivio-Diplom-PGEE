import React from 'react';
import { useAuth } from '../modules/auth/hooks';
import { Button } from '../components/common/Button';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">Drivio</span>
          </div>
          <nav className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700">Hello, <strong>{user?.username}</strong></span>
                <Button variant="outline" onClick={logout} className="px-3 py-1 text-sm">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <a href="/login" className="text-gray-600 hover:text-blue-600 font-medium">Login</a>
                <a href="/register" className="text-gray-600 hover:text-blue-600 font-medium">Register</a>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Drivio. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
