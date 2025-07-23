import React, { useState, useEffect } from 'react';
import { Save, Filter, Calendar, RefreshCw, Search, User, Package } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Customer, DailyUpdate as DailyUpdateType } from '../types';
import { useApp } from '../context/AppContext';
import { toast } from 'react-hot-toast';

interface DailyUpdateState {
  delivered: number | string;
  collected: number | string;
  holding_status: number;
  notes: string;
}

const DailyUpdate: React.FC = () => {
  const { getCustomerTypeLabel } = useApp();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dateInputValue, setDateInputValue] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updates, setUpdates] = useState<Record<string, DailyUpdateState>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingCustomerId, setSavingCustomerId] = useState<string | null>(null);
  const [previousDayHoldings, setPreviousDayHoldings] = useState<Record<string, number>>({});

  // Calculate the maximum allowed date (today)
  const maxDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [customersResponse, initialUpdatesResponse, prevDayUpdatesResponse] = await Promise.all([
          fetch('/api/customers'),
          fetch(`/api/daily-updates?date=${selectedDate}`),
          fetch(`/api/daily-updates?date=${getPreviousDay(selectedDate)}`),
        ]);

        if (!customersResponse.ok) {
          const errorData = await customersResponse.json();
          throw new Error(errorData?.error || 'Failed to fetch customers');
        }
        const customersData = await customersResponse.json();
        setCustomers(Array.isArray(customersData) ? customersData : (customersData.data || []));

        // Get previous day's holding status for each customer
        let prevDayHoldings: Record<string, number> = {};
        if (prevDayUpdatesResponse.ok) {
          const prevDayUpdates: DailyUpdateType[] = await prevDayUpdatesResponse.json();
          prevDayUpdates.forEach(update => {
            prevDayHoldings[update.customer_id] = update.holding_status;
          });
        }
        setPreviousDayHoldings(prevDayHoldings);

        // Initialize updates map with default values
        const defaultUpdatesMap: Record<string, DailyUpdateState> = (Array.isArray(customersData) ? customersData : (customersData.data || [])).reduce(
          (acc: Record<string, DailyUpdateState>, customer: Customer) => {
            const prevHolding = prevDayHoldings[customer.customer_id] ?? (customer.can_qty || 0);
            const initialDelivered = customer.can_qty || 0;
            const initialCollected = 0;
            return {
              ...acc,
              [customer.customer_id]: {
                delivered: initialDelivered,
                collected: initialCollected,
                holding_status: prevHolding + initialDelivered - initialCollected,
                notes: '',
              },
            };
          },
          {} as Record<string, DailyUpdateState>
        );

        if (initialUpdatesResponse.ok) {
          const initialUpdatesData: DailyUpdateType[] = await initialUpdatesResponse.json();
          initialUpdatesData.forEach(update => {
            if (defaultUpdatesMap[update.customer_id]) {
              defaultUpdatesMap[update.customer_id] = {
                delivered: update.delivered_qty,
                collected: update.collected_qty,
                holding_status: update.holding_status,
                notes: update.notes || '',
              };
            }
          });
        }
        setUpdates(defaultUpdatesMap);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [selectedDate]);

  useEffect(() => {
    setDateInputValue(selectedDate);
  }, [selectedDate]);

  function getPreviousDay(dateString: string) {
    const date = new Date(dateString);
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }

  const handleUpdateChange = (customerId: string, field: 'delivered' | 'collected' | 'notes', value: string) => {
    setUpdates(prev => {
      const existing = prev[customerId] || { delivered: 0, collected: 0, holding_status: 0, notes: '' };
      const updated = { ...existing, [field]: value };

      if (field === 'delivered' || field === 'collected') {
        const deliveredQty = field === 'delivered' ? (parseInt(value) || 0) : (parseInt(existing.delivered as string) || 0);
        const collectedQty = field === 'collected' ? (parseInt(value) || 0) : (parseInt(existing.collected as string) || 0);
        const baseHolding = previousDayHoldings[customerId] ?? (customers.find(c => c.customer_id === customerId)?.can_qty || 0);
        updated.holding_status = baseHolding + deliveredQty - collectedQty;
      }
      return {
        ...prev,
        [customerId]: updated,
      };
    });
  };

  const handleSaveSingleUpdate = async (customerId: string) => {
    setSavingCustomerId(customerId);
    const updateData = {
      customer_id: customerId,
      date: selectedDate,
      delivered_qty: parseInt(updates[customerId]?.delivered as string) || 0,
      collected_qty: parseInt(updates[customerId]?.collected as string) || 0,
      notes: updates[customerId]?.notes || '',
    };

    try {
      const response = await fetch('/api/daily-updates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || `Failed to save update for customer ${customerId}`);
      }

      const customerName = customers.find(c => c.customer_id === customerId)?.name || 'Customer';
      toast.success(`Update saved for ${customerName}!`);
      
      // Refresh the data to get updated holding status
      const refreshResponse = await fetch(`/api/daily-updates?date=${selectedDate}`);
      if (refreshResponse.ok) {
        const refreshedData: DailyUpdateType[] = await refreshResponse.json();
        const updatedUpdatesMap = { ...updates };
        
        refreshedData.forEach((update: DailyUpdateType) => {
          if (updatedUpdatesMap[update.customer_id]) {
            updatedUpdatesMap[update.customer_id] = {
              delivered: update.delivered_qty,
              collected: update.collected_qty,
              holding_status: update.holding_status,
              notes: update.notes || '',
            };
          }
        });
        
        setUpdates(updatedUpdatesMap);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingCustomerId(null);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesType = filterType === 'all' || customer.customer_type === filterType;
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone_number.includes(searchTerm);
    return matchesType && matchesSearch;
  });

  // Compute cansToCollectToday from previousDayHoldings and customers
  const cansToCollectToday = customers
    .filter((customer) => (previousDayHoldings[customer.customer_id] ?? 0) > 0)
    .map((customer) => ({
      customer_id: customer.customer_id,
      name: customer.name,
      holding_status: previousDayHoldings[customer.customer_id] ?? 0,
    }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-semibold">Error loading daily update data: {error}</div>
        <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Daily Can Management</h1>
        <p className="mt-2 text-sm text-gray-600">Track daily can deliveries and collections with real-time updates</p>
      </div>

      <Card className="shadow-lg border-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-8">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
            <input
              type="date"
              className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
              value={dateInputValue}
              onChange={e => setDateInputValue(e.target.value)}
              onBlur={e => {
                // Only update selectedDate (and trigger reload) if the value is a valid date
                const val = e.target.value;
                if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                  setSelectedDate(val);
                }
              }}
              max={maxDate}
            />
          </div>

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

          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <select
              className="border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="shop">Shop</option>
              <option value="monthly">Monthly</option>
              <option value="order">Order</option>
            </select>
          </div>
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
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    <span className="mr-1">Delivered</span>
                    <RefreshCw className="h-3 w-3 text-blue-500" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    <span className="mr-1">Collected</span>
                    <RefreshCw className="h-3 w-3 text-green-500" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Holding
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Notes
                </th>
                <th scope="col" className="relative px-6 py-4">
                  <span className="sr-only">Save</span>
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
                    <span className="text-sm font-medium text-gray-700">
                      {getCustomerTypeLabel(customer.customer_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="font-medium">{customer.phone_number}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="number"
                      min="0"
                      className="w-20 border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-2 py-1"
                      value={updates[customer.customer_id]?.delivered ?? ''}
                      onChange={(e) => handleUpdateChange(customer.customer_id, 'delivered', e.target.value)}
                      placeholder="0"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="number"
                      min="0"
                      className="w-20 border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-green-500 focus:border-green-500 px-2 py-1"
                      value={updates[customer.customer_id]?.collected ?? ''}
                      onChange={(e) => handleUpdateChange(customer.customer_id, 'collected', e.target.value)}
                      placeholder="0"
                    />
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                      {updates[customer.customer_id]?.holding_status ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      placeholder="Optional notes..."
                      className="w-full border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={updates[customer.customer_id]?.notes || ''}
                      onChange={(e) => handleUpdateChange(customer.customer_id, 'notes', e.target.value)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Save size={14} />}
                      onClick={() => handleSaveSingleUpdate(customer.customer_id)}
                      loading={savingCustomerId === customer.customer_id}
                      disabled={savingCustomerId === customer.customer_id}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      {savingCustomerId === customer.customer_id ? 'Saving...' : 'Save'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && !loading && (
          <div className="text-center py-12">
            <RefreshCw className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No customers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'No customers available for the selected date.'}
            </p>
          </div>
        )}
      </Card>

      {cansToCollectToday.length > 0 && (
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="mr-2 h-6 w-6 text-blue-600" />
              Cans to Collect Today ({new Date(selectedDate).toLocaleDateString()})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cansToCollectToday.map(collection => (
                <div key={collection.customer_id} className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
                  <div className="font-semibold text-gray-900">{collection.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    <span className="font-bold text-blue-600">{collection.holding_status}</span> cans to collect
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DailyUpdate;