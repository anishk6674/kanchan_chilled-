import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Droplets, 
  CreditCard,
  BarChart3,
  Package,
  Settings,
  Droplet,
  ShoppingBag,
  ShoppingCart
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const Sidebar: React.FC = () => {
  const { sidebarOpen } = useApp();

  const navItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/customers', icon: <Users size={20} />, label: 'Customers' },
    { path: '/orders', icon: <ShoppingCart size={20} />, label: 'Orders' },
    { path: '/daily-update', icon: <Droplets size={20} />, label: 'Daily Update' },
    { path: '/billing', icon: <CreditCard size={20} />, label: 'Billing' },
    { path: '/reports', icon: <BarChart3 size={20} />, label: 'Reports' },
    { path: '/can-management', icon: <Package size={20} />, label: 'Can Management' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
      //{ path: '/modal', icon: <ShoppingBag size={20} />, label: 'Modal Test' },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 bg-blue-700 text-white transition-all duration-300 ease-in-out ${
      sidebarOpen ? 'w-64' : 'w-20'
    } flex flex-col`}>
      <div className="flex items-center justify-center h-16 border-b border-blue-600">
        <div className={`flex items-center ${sidebarOpen ? 'justify-start pl-4' : 'justify-center'}`}>
          <Droplet className="h-8 w-8 text-white" />
          {sidebarOpen && (
            <span className="ml-2 text-xl font-semibold text-white">New Kanchan</span>
          )}
        </div>
      </div>  
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center px-2 py-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-blue-800 text-white' 
                    : 'text-blue-100 hover:bg-blue-600'
                } ${sidebarOpen ? 'justify-start' : 'justify-center'}`
              }
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="ml-3">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;