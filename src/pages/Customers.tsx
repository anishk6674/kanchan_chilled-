import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter, 
  Download,
  User,
  Store,
  Calendar
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Customer, CustomerType } from '../types';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

const Customers: React.FC = () => {
  const navigate = useNavigate();
  const { getCustomerTypeLabel } = useApp();//CUSTOMERTYPE ICON
  const [searchTerm, setSearchTerm] = useState('');//SEARCH BAR
  const [selectedType, setSelectedType] = useState<CustomerType | 'all'>('all');//FILTER BY DEFAULT
  const [customers, setCustomers] = useState<Customer[]>([]);//GET CUSTOMERS
  const [loading, setLoading] = useState(true); // Initially loading
  const [error, setError] = useState<string | null>(null);
  

  // Mock data - would come from API in real app
  useEffect(() => {
    const fetchCustomers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/customers');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData?.error || 'Failed to fetch customers');
            }
            const data = await response.json();
            // Handle both array and object with data property
            setCustomers(Array.isArray(data) ? data : (data.data || []));
        } catch (err: any) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    fetchCustomers();
}, []); // Empty dependency array means this runs once after the initial render

const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.phone_number.includes(searchTerm);
    const matchesType = selectedType === 'all' || customer.customer_type === selectedType;

    return matchesSearch && matchesType;
});

const getCustomerTypeIcon = (type: CustomerType) => {
    switch (type) {
        case 'shop': return <Store className="h-4 w-4 text-blue-500" />;
        case 'monthly': return <Calendar className="h-4 w-4 text-green-500" />;
        case 'order': return <User className="h-4 w-4 text-orange-500" />;
    }
};

if (loading) {
    return <div>Loading customers...</div>; // Or a more sophisticated loader
}

if (error) {
    return <div>Error loading customers: {error}</div>;
}


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your customer database and relationships</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          className="mt-3 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          onClick={() => navigate('/customers/new')}
        >
          Add New Customer
        </Button>
      </div>

      <Card className="shadow-lg border-0">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or phone..."
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
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as CustomerType | 'all')}
              >
                <option value="all">All Types</option>
                <option value="shop">Shop</option>
                <option value="monthly">Monthly</option>
              
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
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Phone
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Advance Amount 
                </th>
               
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
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
                        <div className="text-sm text-gray-500">ID: {customer.customer_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getCustomerTypeIcon(customer.customer_type)}
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {getCustomerTypeLabel(customer.customer_type)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="font-medium">{customer.phone_number}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                    <span className="font-semibold text-green-600">
                      ₹{customer.advance_amount || 0}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Edit size={14} />}
                        onClick={() => navigate(`/customers/edit/${customer.customer_id}`)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedType !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by adding your first customer.'}
            </p>
            {!searchTerm && selectedType === 'all' && (
              <div className="mt-6">
                <Button variant="primary" icon={<Plus size={16} />} onClick={() => navigate('/customers/new')}>
                  Add New Customer
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Customers;