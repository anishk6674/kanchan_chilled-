import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, FileText, Eye, X, Receipt, User, Package, Calendar, Clock } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import Select from '../components/ui/Select';
import ReactDOM from 'react-dom';
import Modal from '../components/ui/Modal';
import { calculateReceiptData, generateReceiptHTML } from '../utils/receipt';

interface OrderFormProps {}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

const OrderForm: React.FC<OrderFormProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    order_date: new Date().toISOString().split('T')[0],
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    delivery_amount: 0,
    can_qty: 0,
    collected_qty: 0,
    collected_date: '',
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_time: '10:00',
    order_status: 'pending',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [generatingReceipt, setGeneratingReceipt] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [currentPrices, setCurrentPrices] = useState<any>(null);

  useEffect(() => {
    fetchPrices();
    if (isEditing && id) {
      fetchOrder(id);
    }
    if (!isEditing) {
      setFormData(prev => ({
        ...prev,
        collected_qty: 0,
        collected_date: '',
      }));
    }
  }, [isEditing, id]);

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/settings/prices');
      if (response.ok) {
        const prices = await response.json();
        setCurrentPrices(prices[0]);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const fetchOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          order_date: data.order_date.split('T')[0],
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          customer_address: data.customer_address,
          delivery_amount: data.delivery_amount || 0,
          can_qty: data.can_qty,
          collected_qty: data.collected_qty || 0,
          collected_date: data.collected_date ? data.collected_date.split('T')[0] : '',
          delivery_date: data.delivery_date.split('T')[0],
          delivery_time: data.delivery_time,
          order_status: data.order_status,
          notes: data.notes || '',
        });
      } else {
        toast.error('Failed to fetch order details');
        navigate('/orders');
      }
    } catch (error) {
      toast.error('An unexpected error occurred while fetching order details');
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.customer_name) newErrors.customer_name = 'Customer Name is required';
    if (!formData.customer_phone) newErrors.customer_phone = 'Customer Phone is required';
    if (!formData.customer_address) newErrors.customer_address = 'Delivery Address is required';
    if (!formData.order_date) newErrors.order_date = 'Order Date is required';
    if (formData.can_qty <= 0) newErrors.can_qty = 'Can Quantity must be greater than 0';

    if (isEditing) {
      if (formData.collected_qty < 0) newErrors.collected_qty = 'Collected Quantity cannot be negative';
      if (formData.collected_qty > formData.can_qty) newErrors.collected_qty = 'Collected Quantity cannot exceed delivered quantity';
      if (formData.collected_qty > 0 && !formData.collected_date) {
        newErrors.collected_date = 'Collection Date is required if cans are collected';
      }
    }

    if (!formData.delivery_date) newErrors.delivery_date = 'Delivery Date is required';
    if (!formData.delivery_time) newErrors.delivery_time = 'Delivery Time is required';
    if (!formData.order_status) newErrors.order_status = 'Order Status is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      try {
        const url = isEditing ? `/api/orders/${id}` : '/api/orders';
        const method = isEditing ? 'PUT' : 'POST';

        const payload = {
          ...formData,
          notes: formData.notes === '' ? null : formData.notes,
          collected_date: formData.collected_date === '' ? null : formData.collected_date,
        };

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          toast.success(isEditing ? 'Order updated successfully!' : 'Order created successfully!');
          navigate('/orders');
        } else {
          const errorData = await response.json();
          toast.error(errorData?.error || `Failed to ${isEditing ? 'update' : 'create'} order.`);
        }
      } catch (error: any) {
        toast.error('An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    }
  };

  const generateReceipt = async () => {
    if (!isEditing || !id) {
      toast.error('Please save the order first before generating receipt');
      return;
    }

    setGeneratingReceipt(true);
    try {
      if (!currentPrices) {
        throw new Error('Current pricing data not found');
      }

      const receiptData = calculateReceiptData(formData, currentPrices, id);

      const response = await fetch('/generate-order-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `order-receipt-${formData.customer_name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Receipt generated successfully!');
    } catch (error: any) {
      console.error('Error generating receipt:', error);
      toast.error(`Failed to generate receipt: ${error.message}`);
    } finally {
      setGeneratingReceipt(false);
    }
  };

  const viewReceipt = async () => {
    if (!isEditing || !id) {
      toast.error('Please save the order first before viewing receipt');
      return;
    }

    try {
      if (!currentPrices) {
        throw new Error('Current pricing data not found');
      }

      const receiptData = calculateReceiptData(formData, currentPrices, id);
      const receiptHTML = generateReceiptHTML(formData, receiptData);

      setModalContent(receiptHTML);
      setIsModalOpen(true);
    } catch (error: any) {
      console.error('Error viewing receipt:', error);
      toast.error(`Failed to view receipt: ${error.message}`);
    }
  };

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="secondary"
          icon={<ArrowLeft size={16} />}
          className="mr-4"
          onClick={() => navigate('/orders')}
        >
          Back to Orders
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Order' : 'Create New Order'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {isEditing ? 'Update order details and manage collections' : 'Enter the order details for a new customer'}
          </p>
        </div>
        {isEditing && (
          <div className="flex space-x-3">
            <Button
              variant="info"
              icon={<Eye size={16} />}
              onClick={viewReceipt}
              disabled={isModalOpen}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
            >
              {isModalOpen ? 'Loading...' : 'Preview Receipt'}
            </Button>
            <Button
              variant="success"
              icon={<Receipt size={16} />}
              onClick={generateReceipt}
              disabled={generatingReceipt}
              className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
            >
              {generatingReceipt ? 'Generating...' : 'Download Receipt'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information Section */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="mr-2 h-5 w-5 text-blue-600" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Customer Name"
                    id="customer_name"
                    name="customer_name"
                    value={formData.customer_name}
                    onChange={handleChange}
                    error={errors.customer_name}
                    required
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                  <Input
                    label="Customer Phone"
                    id="customer_phone"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleChange}
                    error={errors.customer_phone}
                    required
                    className="focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="md:col-span-2">
                    <Input
                      label="Delivery Address"
                      id="customer_address"
                      name="customer_address"
                      value={formData.customer_address}
                      onChange={handleChange}
                      error={errors.customer_address}
                      required
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Order Details Section */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="mr-2 h-5 w-5 text-green-600" />
                  Order Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Order Date"
                    id="order_date"
                    name="order_date"
                    type="date"
                    value={formData.order_date}
                    onChange={handleChange}
                    error={errors.order_date}
                    required
                    className="focus:ring-2 focus:ring-green-500"
                  />
                  <Input
                    label="Can Quantity (Delivered)"
                    id="can_qty"
                    name="can_qty"
                    type="number"
                    min="1"
                    value={formData.can_qty}
                    onChange={handleChange}
                    error={errors.can_qty}
                    required
                    className="focus:ring-2 focus:ring-green-500"
                  />
                  <Input
                    label="Delivery Charge (₹)"
                    id="delivery_amount"
                    name="delivery_amount"
                    type="number"
                    min="0"
                    value={formData.delivery_amount}
                    onChange={handleChange}
                    className="focus:ring-2 focus:ring-green-500"
                  />
                  <Select
                    label="Order Status"
                    id="order_status"
                    name="order_status"
                    value={formData.order_status}
                    onChange={handleChange}
                    options={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'processing', label: 'Processing' },
                      { value: 'delivered', label: 'Delivered' },
                      { value: 'cancelled', label: 'Cancelled' },
                    ]}
                    error={errors.order_status}
                    required
                    className="focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Delivery Schedule Section */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-purple-600" />
                  Delivery Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Delivery Date"
                    id="delivery_date"
                    name="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={handleChange}
                    error={errors.delivery_date}
                    required
                    className="focus:ring-2 focus:ring-purple-500"
                  />
                  <Input
                    label="Delivery Time"
                    id="delivery_time"
                    name="delivery_time"
                    type="time"
                    value={formData.delivery_time}
                    onChange={handleChange}
                    error={errors.delivery_time}
                    required
                    className="focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Collection Information Section (Only for editing) */}
              {isEditing && (
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-orange-600" />
                    Collection Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Collected Cans"
                      id="collected_qty"
                      name="collected_qty"
                      type="number"
                      min="0"
                      max={formData.can_qty}
                      value={formData.collected_qty}
                      onChange={handleChange}
                      error={errors.collected_qty}
                      helper={`Maximum: ${formData.can_qty} cans`}
                      className="focus:ring-2 focus:ring-orange-500"
                    />
                    <Input
                      label="Collection Date"
                      id="collected_date"
                      name="collected_date"
                      type="date"
                      value={formData.collected_date}
                      onChange={handleChange}
                      error={errors.collected_date}
                      required={formData.collected_qty > 0}
                      className="focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Add any special instructions or notes about this order..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/orders')}
                  className="px-6"
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
                  {loading ? 'Saving...' : (isEditing ? 'Update Order' : 'Create Order')}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-0 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Receipt className="mr-2 h-5 w-5 text-blue-600" />
              Order Summary
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Water Cans (20L)</span>
                  <span className="font-semibold">{formData.can_qty || 0}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Price per Can</span>
                  <span className="font-semibold">₹{currentPrices?.order_price || 0}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{(formData.can_qty || 0) * (currentPrices?.order_price || 0)}</span>
                </div>
                {Number(formData.delivery_amount) > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Delivery Charges</span>
                    <span className="font-semibold">₹{Number(formData.delivery_amount)}</span>
                  </div>
                )}
                {(() => {
                  const missingCans = Math.max(0, (formData.can_qty || 0) - (formData.collected_qty || 0));
                  const missingCanCharge = missingCans * 500;
                  return missingCanCharge > 0 ? (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-red-600">Missing Can Charges ({missingCans} × ₹500)</span>
                      <span className="font-semibold text-red-600">₹{missingCanCharge}</span>
                    </div>
                  ) : null;
                })()}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Amount</span>
                    <span className="font-bold text-lg text-blue-600">
                      ₹{(() => {
                        const subtotal = (formData.can_qty || 0) * (currentPrices?.order_price || 0);
                        const deliveryAmount = Number(formData.delivery_amount) || 0;
                        const missingCans = Math.max(0, (formData.can_qty || 0) - (formData.collected_qty || 0));
                        const missingCanCharge = missingCans * 500;
                        return subtotal + deliveryAmount + missingCanCharge;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {isEditing && formData.collected_qty > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-green-800 mb-2">Collection Status</h4>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Collected</span>
                    <span className="font-semibold text-green-600">{formData.collected_qty}/{formData.can_qty}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="font-semibold text-orange-600">{formData.can_qty - formData.collected_qty}</span>
                  </div>
                </div>
              )}

              {(() => {
                const missingCans = Math.max(0, (formData.can_qty || 0) - (formData.collected_qty || 0));
                const missingCanCharge = missingCans * 500;
                return isEditing && missingCanCharge > 0 ? (
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg mb-4 border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                      </svg>
                      Missing Can Penalty
                    </h4>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Missing Cans:</span>
                      <span className="font-semibold text-red-600">{missingCans}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Penalty Amount:</span>
                      <span className="font-semibold text-red-600">₹{missingCanCharge}</span>
                    </div>
                  </div>
                ) : null;
              })()}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Order Information</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-semibold capitalize ${
                      formData.order_status === 'delivered' ? 'text-green-600' :
                      formData.order_status === 'processing' ? 'text-blue-600' :
                      formData.order_status === 'cancelled' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {formData.order_status}
                    </span>
                  </div>
                  {formData.delivery_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery:</span>
                      <span className="font-semibold">
                        {new Date(formData.delivery_date).toLocaleDateString()} at {formData.delivery_time}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Receipt Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Order Receipt Preview">
        <div dangerouslySetInnerHTML={{ __html: modalContent }} />
      </Modal>
    </div>
  );
};

export default OrderForm;