import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { 
  TrendingUp, 
  Users, 
  Package, 
  RefreshCw, 
  ShoppingCart,
  Clock,
  Plus,
  Calendar,
  BarChart3
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';


const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const handleNewCustomerFromDashboard = () => {
    navigate('/customers/new', { state: { fromDashboard: true } });
  };
  const handleOrderClick = () => {
    navigate('/orders/new');
  };
  

  const [stats, setStats] = useState({
    OrdersTotal: 0,
    totalMonthlyCustomers: 0,
    shopCustomersTotal: 0,
    cansDeliveredToday: 0,
    cansCollectedToday: 0,
    pendingCansTotal: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Replace these with your actual API endpoints
    const fetchDashboardData = async () => {
      try {
        const statsResponse = await fetch('/api/dashboard');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          console.error('Failed to fetch dashboard stats');
        }

        const activityResponse = await fetch('/api/dashboard/');
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          setRecentActivity(activityData);
        } else {
          console.error('Failed to fetch recent activity');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: ' Orders',
      value: stats.OrdersTotal,
      icon: <ShoppingCart className="h-8 w-8 text-blue-500" />,
      //change: '+12% from yesterday', // Replace with actual calculation if available in API
      trend: 'up'
    },
    {
      title: 'Monthly Customers',
      value: stats.totalMonthlyCustomers,
      icon: <Users className="h-8 w-8 text-teal-500" />,
      //change: '+2 this week', // Replace with actual calculation if available in API
      trend: 'up'
    },
    {
      title: 'Shop Customers ',
      value: stats.shopCustomersTotal,
      icon: <Users className="h-8 w-8 text-teal-500" />,
     // change: '78% of total', // Replace with actual calculation if available in API
      trend: 'neutral'
    },
    {
      title: 'Cans Delivered Today',
      value: stats.cansDeliveredToday,
      icon: <Package className="h-8 w-8 text-green-500" />,
      change: '+7% from yesterday', // Replace with actual calculation if available in API
      trend: 'up'
    },
    {
      title: 'Cans Collected Today',
      value: stats.cansCollectedToday,
      icon: <RefreshCw className="h-8 w-8 text-orange-500" />,
      change: '+5% from yesterday', // Replace with actual calculation if available in API
      trend: 'up'
    },
    {
      title: 'Pending Cans',
      value: stats.pendingCansTotal,
      icon: <Clock className="h-8 w-8 text-red-500" />,
      //change: '-3% from yesterday', // Replace with actual calculation if available in API
      trend: 'down'
    }
  ];


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">An overview of your RO water business performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} className="transition-all duration-300 hover:shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <div className="flex justify-between items-start p-6">
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{card.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
                <p className={`mt-1 text-sm ${
                  card.trend === 'up' ? 'text-green-600' : 
                  card.trend === 'down' ? 'text-red-600' : 
                  'text-gray-500'
                }`}>
                  {card.change}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                {card.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-lg border-0">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="mr-2 h-6 w-6 text-blue-600" />
              Recent Activity
            </h3>
            <div className="space-y-4">
            <div className="flex items-center pb-4 border-b border-gray-100">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl mr-4">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">10 cans delivered to Sunset Cafe</p>
                <p className="text-sm text-gray-500">Today, 9:45 AM</p>
              </div>
            </div>
            <div className="flex items-center pb-4 border-b border-gray-100">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl mr-4">
                <RefreshCw className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">8 cans collected from Royal Restaurant</p>
                <p className="text-sm text-gray-500">Today, 11:20 AM</p>
              </div>
            </div>
            <div className="flex items-center pb-4 border-b border-gray-100">
              <div className="p-3 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl mr-4">
                <Users className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">New monthly customer added: Ramesh Patil</p>
                <p className="text-sm text-gray-500">Today, 1:30 PM</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl mr-4">
                <ShoppingCart className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">New order from Green Valley Apartments</p>
                <p className="text-sm text-gray-500">Today, 3:15 PM</p>
              </div>
            </div>
            </div>
          </div>
        </Card>
        
        <Card className="shadow-lg border-0">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="mr-2 h-6 w-6 text-purple-600" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button
                variant="secondary"
                className="w-full justify-start bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 transition-all duration-200"
                icon={<Package className="h-5 w-5" />}
              >
                Record Today's Delivery
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start bg-green-50 hover:bg-green-100 text-green-700 border-green-200 transition-all duration-200"
                icon={<RefreshCw className="h-5 w-5" />}
              >
                Update Can Collection
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 transition-all duration-200"
                icon={<ShoppingCart className="h-5 w-5" />}
                onClick={handleOrderClick}
              >
                Add New Order
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200 transition-all duration-200"
                icon={<Users className="h-5 w-5" />}
                onClick={handleNewCustomerFromDashboard}
              >
                Register New Customer
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;