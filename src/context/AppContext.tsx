import React, { createContext, useState, useContext, ReactNode } from 'react';
import { CustomerType } from '../types';

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  getCustomerTypeLabel: (type: CustomerType) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const getCustomerTypeLabel = (type: CustomerType): string => {
    switch (type) {
      case 'shop': return 'Shop';
      case 'monthly': return 'Monthly';
      case 'order': return 'Order';
      default: return 'Unknown';
    }
  };

  return (
    <AppContext.Provider value={{ 
      sidebarOpen, 
      toggleSidebar,
      getCustomerTypeLabel
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};