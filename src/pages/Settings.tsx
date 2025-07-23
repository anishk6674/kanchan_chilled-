import React, { useState, useEffect,} from 'react';
import { Save } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { CustomerType } from '../types';
import toast from 'react-hot-toast';

interface PriceSettings {
  shop: number;
  monthly: number;
  order: number;
}

const Settings: React.FC = () => {
  const [prices, setPrices] = useState<PriceSettings>({
    shop: 30,
    monthly: 25,
    order: 35
  });
  
  const [deliveryCharges, setDeliveryCharges] = useState<Record<string, number>>({
    'under_5km': 50,
    '5_10km': 75,
    'above_10km': 100
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/settings/prices');
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setPrices({
            shop: data[0].shop_price,
            monthly: data[0].monthly_price,
            order: data[0].order_price
          });
        }
      } else {
        toast.error('Failed to fetch prices');
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
      toast.error('Error loading prices');
    }
  };

  const handlePriceChange = (type: CustomerType, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setPrices(prev => ({
      ...prev,
      [type]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleDeliveryChargeChange = (key: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setDeliveryCharges(prev => ({
      ...prev,
      [key]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/settings/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prices),
      });

      if (response.ok) {
        toast.success('Prices updated successfully');
      } else {
        throw new Error('Failed to update prices');
      }
    } catch (error) {
      console.error('Error updating prices:', error);
      toast.error('Failed to update prices');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-2 text-sm text-gray-600">Configure pricing and system-wide preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-0">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Save className="mr-2 h-6 w-6 text-blue-600" />
              Can Pricing Configuration
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <label className="w-1/2 text-sm font-semibold text-gray-800">Shop Customers</label>
                <div className="w-1/2 flex items-center">
                  <span className="mr-2 text-gray-500">₹</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prices.shop.toString()}
                    onChange={(e) => handlePriceChange('shop', e.target.value)}
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <label className="w-1/2 text-sm font-semibold text-gray-800">Monthly Customers</label>
                <div className="w-1/2 flex items-center">
                  <span className="mr-2 text-gray-500">₹</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prices.monthly.toString()}
                    onChange={(e) => handlePriceChange('monthly', e.target.value)}
                    className="focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                <label className="w-1/2 text-sm font-semibold text-gray-800">Order Customers</label>
                <div className="w-1/2 flex items-center">
                  <span className="mr-2 text-gray-500">₹</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={prices.order.toString()}
                    onChange={(e) => handlePriceChange('order', e.target.value)}
                    className="focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                variant="primary"
                icon={<Save size={16} />}
                loading={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? 'Saving...' : 'Update Pricing'}
              </Button>
            </div>
          </form>
          </div>
        </Card>
        
        <Card className="shadow-lg border-0">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Save className="mr-2 h-6 w-6 text-green-600" />
              Delivery Charges Setup
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <label className="w-1/2 text-sm font-semibold text-gray-800">Under 5 km</label>
                <div className="w-1/2 flex items-center">
                  <span className="mr-2 text-gray-500">₹</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={deliveryCharges.under_5km.toString()}
                    onChange={(e) => handleDeliveryChargeChange('under_5km', e.target.value)}
                    className="focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
                <label className="w-1/2 text-sm font-semibold text-gray-800">5 - 10 km</label>
                <div className="w-1/2 flex items-center">
                  <span className="mr-2 text-gray-500">₹</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={deliveryCharges['5_10km'].toString()}
                    onChange={(e) => handleDeliveryChargeChange('5_10km', e.target.value)}
                    className="focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                <label className="w-1/2 text-sm font-semibold text-gray-800">Above 10 km</label>
                <div className="w-1/2 flex items-center">
                  <span className="mr-2 text-gray-500">₹</span>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={deliveryCharges.above_10km.toString()}
                    onChange={(e) => handleDeliveryChargeChange('above_10km', e.target.value)}
                    className="focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                variant="primary"
                icon={<Save size={16} />}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                Update Charges
              </Button>
            </div>
          </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;