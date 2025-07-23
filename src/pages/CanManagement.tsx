import React, { useState } from 'react';
import { Package, Search, Filter, Download } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Customer } from '../types';
import { useApp } from '../context/AppContext';

const CanManagement: React.FC = () => {
  const { getCustomerTypeLabel } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'overdue'>('all');

  // Mock data - would come from API in real app
  const mockCustomers: Customer[] = [
    {
      customer_id: '1',
      name: 'Rajesh Kumar',
      phone_number: '9876543210',
      address: '123 Main Street, Mumbai',
      customer_type: 'shop',
      can_qty: 15,
      created_at: '2023-05-15T10:30:00Z'
    },
    {
      customer_id: '2',
      name: 'Ananya Singh',
      phone_number: '8765432109',
      address: '456 Park Avenue, Delhi',
      customer_type: 'monthly',
      advance_amount: 1000,
      can_qty: 5,
      created_at: '2023-06-20T09:15:00Z'
    }
  ];

  const canStatuses = {
    '1': { issued: 45, returned: 30, pending: 15 },
    '2': { issued: 20, returned: 15, pending: 5 }
  };

  const filteredCustomers = mockCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         customer.phone_number.includes(searchTerm);
    const status = canStatuses[customer.customer_id as keyof typeof canStatuses];
    
    if (filterType === 'pending' && (!status || status.pending === 0)) {
      return false;
    }
    if (filterType === 'overdue' && (!status || status.pending < 10)) {
      return false;
    }
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Can Inventory Management</h1>
        <p className="mt-2 text-sm text-gray-600">Track and manage your water can inventory and circulation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center p-6">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Total Cans</h3>
              <p className="text-3xl font-bold text-blue-600">250</p>
              <p className="text-sm text-gray-600">Complete inventory</p>
            </div>
          </div>
        </Card>
        
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center p-6">
            <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">In Circulation</h3>
              <p className="text-3xl font-bold text-green-600">180</p>
              <p className="text-sm text-gray-600">Currently with customers</p>
            </div>
          </div>
        </Card>
        
        <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center p-6">
            <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
              <Package className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Pending Return</h3>
              <p className="text-3xl font-bold text-red-600">70</p>
              <p className="text-sm text-gray-600">Awaiting collection</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="shadow-lg border-0">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              className="pl-10 pr-3 py-3 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="sm:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                className="pl-10 pr-3 py-3 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'pending' | 'overdue')}
              >
                <option value="all">All Customers</option>
                <option value="pending">With Pending Cans</option>
                <option value="overdue">Overdue (10+ Cans)</option>
              </select>
            </div>
          </div>
          
          <Button
            variant="secondary"
            icon={<Download size={16} />}
            className="sm:w-auto"
          >
            Export Data
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer Details
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total Issued
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Returned
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Pending
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Last Update
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => {
                const status = canStatuses[customer.customer_id as keyof typeof canStatuses];
                return (
                  <tr key={customer.customer_id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.phone_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-700">
                        {getCustomerTypeLabel(customer.customer_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full">{status.issued}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full">{status.returned}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                        status.pending >= 10 ? 'text-red-600 bg-red-50' : 'text-orange-600 bg-orange-50'
                      }`}>
                        {status.pending}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-medium">2 days ago</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No customers found matching your search criteria.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CanManagement;