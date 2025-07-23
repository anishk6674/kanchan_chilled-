import React from 'react';
import { Menu, Bell, UserCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Header: React.FC = () => {
  const { toggleSidebar } = useApp();

  return (
    <header className="bg-white border-b border-gray-200 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex">
            <button 
              type="button" 
              className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 md:hidden"
              onClick={toggleSidebar}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="hidden md:flex md:items-center">
              <button 
                type="button" 
                className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={toggleSidebar}
              >
                <span className="sr-only">Toggle sidebar</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
            </button>
            
            <div className="flex items-center">
              <UserCircle className="h-8 w-8 text-gray-400" />
              <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">Admin</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;