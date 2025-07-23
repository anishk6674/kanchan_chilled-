import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Customer, CustomerType } from '../types';
import toast from 'react-hot-toast';

interface CustomerFormProps {}

const CustomerForm: React.FC<CustomerFormProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isEditing = !!id;

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone_number: '',
    alternate_number: '',
    address: '',
    customer_type: 'shop',
    advance_amount: 0,
    can_qty: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCustomer = async (customerId: string) => {
      setLoading(true);
      try {
        const response = await fetch(`/api/customers/${customerId}`);
        if (response.ok) {
          const data: Customer = await response.json();
          setFormData(data);
        } else {
          toast.error('Failed to fetch customer details for editing.');
          navigate('/customers'); // Redirect back if fetch fails
        }
      } catch (error: any) {
        toast.error('An unexpected error occurred while fetching customer details.');
        navigate('/customers');
      } finally {
        setLoading(false);
      }
    };

    if (isEditing && id) {
      fetchCustomer(id);
    }
  }, [isEditing, id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === 'number') {
      setFormData({ ...formData, [name]: value ? parseFloat(value) : undefined });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.phone_number) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Phone number must be 10 digits';
    }

    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.customer_type) newErrors.customer_type = 'Customer type is required';

    if ((formData.customer_type === 'monthly' || formData.customer_type === 'shop') && (formData.can_qty === undefined || formData.can_qty < 0)) {
      newErrors.can_qty = 'Initial can quantity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleBackButtonClick = () => {
    if (location.state?.fromDashboard) {
      navigate('/dashboard');
    } else {
      navigate('/customers');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      setLoading(true);
      try {
        const url = isEditing ? `/api/customers/${id}` : '/api/customers';
        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const data = await response.json();
          toast.success(isEditing ? 'Customer updated successfully!' : 'Customer added successfully!');
          navigate('/customers'); // Redirect to the customer list
        } else {
          const errorData = await response.json();
          toast.error(errorData?.error || `Failed to ${isEditing ? 'update' : 'save'} customer.`);
          console.error(`Failed to ${isEditing ? 'update' : 'save'} customer:`, errorData);
        }
      } catch (error: any) {
        toast.error('An unexpected error occurred.');
        console.error('Error saving/updating customer:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && isEditing) {
    return <div>Loading customer details...</div>; // Or a more visually appealing loader
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="secondary"
          icon={<ArrowLeft size={16} />}
          className="mr-4"
          onClick={() => navigate('/customers')}
          
        >
          Back to Customers
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Customer' : 'Add New Customer'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isEditing
              ? 'Update customer information and preferences'
              : 'Create a new customer record with complete details'
            }
          </p>
        </div>
      </div>

      <Card className="shadow-lg border-0">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Information Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Save className="mr-2 h-5 w-5 text-blue-600" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Customer Name"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
              className="focus:ring-2 focus:ring-blue-500"
            />
            <Select
              label="Customer Type"
              id="customer_type"
              name="customer_type"
              value={formData.customer_type}
              onChange={handleChange}
              options={[
                { value: 'shop', label: 'Shop' },
                { value: 'monthly', label: 'Monthly' },
              ]}
              error={errors.customer_type}
              required
              className="focus:ring-2 focus:ring-blue-500"
            />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Save className="mr-2 h-5 w-5 text-green-600" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Phone Number"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              error={errors.phone_number}
              helper="10-digit mobile number"
              required
              className="focus:ring-2 focus:ring-green-500"
            />
            <Input
              label="Alternate Number (Optional)"
              id="alternate_number"
              name="alternate_number"
              value={formData.alternate_number}
              onChange={handleChange}
              helper="Secondary contact number"
              className="focus:ring-2 focus:ring-green-500"
            />
            <div className="md:col-span-2">
              <Input
                label="Address"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                error={errors.address}
                required
                className="focus:ring-2 focus:ring-green-500"
              />
            </div>
            </div>
          </div>

          {/* Business Details Section */}
          {(formData.customer_type === 'monthly' || formData.customer_type === 'shop') && (
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Save className="mr-2 h-5 w-5 text-purple-600" />
                Business Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Initial Can Quantity"
                  id="can_qty"
                  name="can_qty"
                  type="number"
                  min="0"
                  value={formData.can_qty?.toString() || ''}
                  onChange={handleChange}
                  error={errors.can_qty}
                  required
                  className="focus:ring-2 focus:ring-purple-500"
                />
                <Input
                  label="Advance Amount (₹)"
                  id="advance_amount"
                  name="advance_amount"
                  type="number"
                  min="0"
                  value={formData.advance_amount?.toString() || ''}
                  onChange={handleChange}
                  error={errors.advance_amount}
                  className="focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6">
            <Button
              type="button"
              variant="secondary"
              className="px-6"
              onClick={() => navigate('/customers')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              icon={<Save size={16} />}
              disabled={loading}
              className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Customer' : 'Create Customer')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CustomerForm;