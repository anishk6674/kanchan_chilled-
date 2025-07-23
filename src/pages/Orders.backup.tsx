import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  Download,
  Package,
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Eye,
  Receipt
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

interface Order {
  id: number;
  order_date: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  can_qty: number;
  collected_qty?: number;
  delivery_amount?: number;
  delivery_date: string;
  delivery_time: string;
  order_status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  notes?: string;
  collected_date?: string;
}

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'processing' | 'delivered' | 'cancelled'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingReceipt, setGeneratingReceipt] = useState<number | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<number | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptContent, setReceiptContent] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Failed to fetch orders');
      }
      const data: Order[] = await response.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/orders/${orderId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData?.error || 'Failed to delete order');
        }

        setOrders(orders.filter(order => order.id !== orderId));
        toast.success('Order deleted successfully!');
      } catch (err: any) {
        console.error('Error deleting order:', err);
        toast.error(err.message);
      }
    }
  };

  const generateOrderReceipt = async (order: Order) => {
    setGeneratingReceipt(order.id);
    try {
      // Get current prices for calculation
      const pricesResponse = await fetch('/api/settings/prices');
      if (!pricesResponse.ok) {
        throw new Error('Failed to fetch prices');
      }
      const prices = await pricesResponse.json();
      const currentPrice = prices[0];

      if (!currentPrice) {
        throw new Error('Current pricing data not found');
      }

      const pricePerCan = currentPrice.order_price;
      const subtotal = order.can_qty * pricePerCan;
      const deliveryAmount = Number(order.delivery_amount) || 0;
      
      // Calculate missing can charges (500 per missing can)
      const missingCans = Math.max(0, order.can_qty - (order.collected_qty || 0));
      const missingCanCharge = missingCans * 500;
      
      const totalAmount = subtotal + deliveryAmount + missingCanCharge;

      const receiptData = {
        order: {
          ...order,
          total_amount: totalAmount,
          price_per_can: pricePerCan,
        }
      };

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
      a.download = `order-receipt-${order.customer_name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Receipt generated successfully!');
    } catch (error: any) {
      console.error('Error generating receipt:', error);
      toast.error(`Failed to generate receipt: ${error.message}`);
    } finally {
      setGeneratingReceipt(null);
    }
  };

  const viewOrderReceipt = async (order: Order) => {
    setViewingReceipt(order.id);
    try {
      // Get current prices for calculation
      const pricesResponse = await fetch('/api/settings/prices');
      if (!pricesResponse.ok) {
        throw new Error('Failed to fetch prices');
      }
      const prices = await pricesResponse.json();
      const currentPrice = prices[0];

      if (!currentPrice) {
        throw new Error('Current pricing data not found');
      }

      const pricePerCan = currentPrice.order_price;
      const subtotal = order.can_qty * pricePerCan;
      const deliveryAmount = Number(order.delivery_amount) || 0;
      
      // Calculate missing can charges (500 per missing can)
      const missingCans = Math.max(0, order.can_qty - (order.collected_qty || 0));
      const missingCanCharge = missingCans * 500;
      
      const totalAmount = subtotal + deliveryAmount + missingCanCharge;
      const orderDate = new Date(order.order_date).toLocaleDateString('en-IN');
      const deliveryDate = new Date(order.delivery_date).toLocaleDateString('en-IN');

      const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Order Receipt - ${order.customer_name}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; }
            .receipt-container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
              border-radius: 16px;
              overflow: hidden;
            }
            .header-gradient {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .status-badge {
              display: inline-flex;
              align-items: center;
              padding: 4px 12px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .status-pending { background-color: #fef3c7; color: #92400e; }
            .status-processing { background-color: #dbeafe; color: #1e40af; }
            .status-delivered { background-color: #d1fae5; color: #065f46; }
            .status-cancelled { background-color: #fee2e2; color: #991b1b; }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
              margin: 24px 0;
            }
            .info-item {
              padding: 16px;
              background: #f8fafc;
              border-radius: 12px;
              border-left: 4px solid #667eea;
            }
            .info-label {
              font-size: 12px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 16px;
              font-weight: 600;
              color: #1e293b;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 24px 0;
            }
            .items-table th {
              background: #f1f5f9;
              padding: 16px;
              text-align: left;
              font-weight: 600;
              color: #475569;
              font-size: 14px;
              border-bottom: 2px solid #e2e8f0;
            }
            .items-table td {
              padding: 16px;
              border-bottom: 1px solid #e2e8f0;
              color: #334155;
            }
            .total-section {
              background: #f8fafc;
              padding: 24px;
              border-radius: 12px;
              margin: 24px 0;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
            }
            .total-row.final {
              border-top: 2px solid #e2e8f0;
              padding-top: 16px;
              margin-top: 16px;
              font-size: 18px;
              font-weight: 700;
              color: #1e293b;
            }
            .collection-status {
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              border: 1px solid #0ea5e9;
              border-radius: 12px;
              padding: 20px;
              margin: 24px 0;
            }
            .notes-section {
              background: #fffbeb;
              border: 1px solid #f59e0b;
              border-radius: 12px;
              padding: 20px;
              margin: 24px 0;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .receipt-container { box-shadow: none; }
            }
          </style>
        </head>
        <body class="bg-gray-50 p-6">
          <div class="receipt-container">
            <!-- Header -->
            <div class="header-gradient text-white p-8">
              <div class="text-center">
                <h1 class="text-3xl font-bold mb-2">कंचन मिनरल वाटर</h1>
                <p class="text-blue-100 mb-4">5, लेबर कॉलोनी, नई आबादी, मंदसौर</p>
                <p class="text-blue-100 text-sm">Ph.: 07422-408555 | Mob.: 9425033995</p>
                <div class="mt-6 pt-6 border-t border-blue-300">
                  <h2 class="text-xl font-semibold">ORDER RECEIPT</h2>
                  <p class="text-blue-100 text-sm mt-1">Receipt #ORD-${order.id}</p>
                </div>
              </div>
            </div>

            <!-- Content -->
            <div class="p-8">
              <!-- Status and Date -->
              <div class="flex justify-between items-center mb-6">
                <span class="status-badge status-${order.order_status}">${order.order_status}</span>
                <span class="text-sm text-gray-500">Generated on ${new Date().toLocaleDateString('en-IN')}</span>
              </div>

              <!-- Customer Information -->
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Customer Name</div>
                  <div class="info-value">${order.customer_name}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Phone Number</div>
                  <div class="info-value">${order.customer_phone}</div>
                </div>
              </div>

              <div class="info-item mb-6">
                <div class="info-label">Delivery Address</div>
                <div class="info-value">${order.customer_address}</div>
              </div>

              <!-- Order Details -->
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Order Date</div>
                  <div class="info-value">${orderDate}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Delivery Date</div>
                  <div class="info-value">${deliveryDate}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Delivery Time</div>
                  <div class="info-value">${order.delivery_time}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Order Status</div>
                  <div class="info-value" style="text-transform: capitalize;">${order.order_status}</div>
                </div>
              </div>

              <!-- Items Table -->
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style="text-align: center;">Quantity</th>
                    <th style="text-align: center;">Rate (₹)</th>
                    <th style="text-align: right;">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div class="font-semibold">Water Cans (20L)</div>
                      <div class="text-sm text-gray-500">Premium RO Purified Water</div>
                    </td>
                    <td style="text-align: center; font-weight: 600;">${order.can_qty}</td>
                    <td style="text-align: center;">₹${pricePerCan}</td>
                    <td style="text-align: right; font-weight: 600;">₹${subtotal}</td>
                  </tr>
                  ${order.delivery_amount && order.delivery_amount > 0 ? `
                  <tr>
                    <td>
                      <div class="font-semibold">Delivery Charges</div>
                      <div class="text-sm text-gray-500">Home Delivery Service</div>
                    </td>
                    <td style="text-align: center; font-weight: 600;">1</td>
                    <td style="text-align: center;">₹${deliveryAmount}</td>
                    <td style="text-align: right; font-weight: 600;">₹${deliveryAmount}</td>
                  </tr>
                  ` : ''}
                  ${missingCans > 0 ? `
                  <tr style="background-color: #fef2f2;">
                    <td>
                      <div class="font-semibold flex items-center text-red-600">
                        <svg class="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                        </svg>
                        Missing Can Charges
                      </div>
                      <div class="text-sm text-red-500">Penalty for ${missingCans} missing can${missingCans > 1 ? 's' : ''}</div>
                    </td>
                    <td style="text-align: center; font-weight: 600; color: #dc2626;">${missingCans}</td>
                    <td style="text-align: center; color: #dc2626;">₹500</td>
                    <td style="text-align: right; font-weight: 600; color: #dc2626;">₹${missingCanCharge}</td>
                  </tr>
                  ` : ''}
                </tbody>
              </table>

              <!-- Total Section -->
              <div class="total-section">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span class="font-semibold">₹${subtotal}</span>
                </div>
                ${deliveryAmount > 0 ? `
                <div class="total-row">
                  <span>Delivery Charges:</span>
                  <span class="font-semibold">₹${deliveryAmount}</span>
                </div>
                ` : ''}
                ${missingCanCharge > 0 ? `
                <div class="total-row" style="color: #dc2626;">
                  <span>Missing Can Charges (${missingCans} × ₹500):</span>
                  <span class="font-semibold">₹${missingCanCharge}</span>
                </div>
                ` : ''}
                <div class="total-row final">
                  <span>Total Amount:</span>
                  <span>₹${totalAmount}</span>
                </div>
              </div>

              <!-- Collection Status -->
              ${order.collected_qty !== undefined && (order.collected_qty > 0 || missingCans > 0) ? `
              <div class="collection-status">
                <h3 class="font-semibold text-blue-800 mb-3 flex items-center">
                  <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                  </svg>
                  Collection Status
                </h3>
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <div class="text-sm text-blue-600 font-medium">Cans Collected</div>
                    <div class="text-lg font-bold text-blue-800">${order.collected_qty} / ${order.can_qty}</div>
                  </div>
                  <div>
                    <div class="text-sm text-blue-600 font-medium">Pending Collection</div>
                    <div class="text-lg font-bold text-blue-800">${order.can_qty - order.collected_qty} cans</div>
                  </div>
                  <div>
                    <div class="text-sm ${missingCans > 0 ? 'text-red-600' : 'text-green-600'} font-medium">Missing Cans</div>
                    <div class="text-lg font-bold ${missingCans > 0 ? 'text-red-800' : 'text-green-800'}">${missingCans} cans</div>
                    ${missingCans > 0 ? `<div class="text-xs text-red-500">₹${missingCanCharge} penalty</div>` : ''}
                  </div>
                </div>
                ${order.collected_date ? `
                <div class="mt-3 pt-3 border-t border-blue-200">
                  <div class="text-sm text-blue-600 font-medium">Collection Date</div>
                  <div class="font-semibold text-blue-800">${new Date(order.collected_date).toLocaleDateString('en-IN')}</div>
                </div>
                ` : ''}
              </div>
              ` : ''}

              <!-- Notes -->
              ${order.notes ? `
              <div class="notes-section">
                <h3 class="font-semibold text-amber-800 mb-2 flex items-center">
                  <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                  </svg>
                  Additional Notes
                </h3>
                <p class="text-amber-700">${order.notes}</p>
              </div>
              ` : ''}

              <!-- Footer -->
              <div class="text-center mt-8 pt-6 border-t border-gray-200">
                <p class="text-gray-600 mb-2">Thank you for choosing Kanchan Mineral Water!</p>
                <p class="text-sm text-gray-500">For any queries, please contact: 9425033995</p>
                <div class="mt-4 text-xs text-gray-400">
                  <p>This is a computer-generated receipt and does not require a signature.</p>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      setReceiptContent(receiptHTML);
      setIsReceiptModalOpen(true);
    } catch (error: any) {
      console.error('Error viewing receipt:', error);
      toast.error(`Failed to view receipt: ${error.message}`);
    } finally {
      setViewingReceipt(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.customer_phone.includes(searchTerm);
    const matchesStatus = selectedStatus === 'all' || order.order_status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getOrderStatusBadge = (status: Order['order_status']) => {
    const baseClasses = "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full";
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'processing':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'delivered':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getCollectionStatus = (order: Order) => {
    if (order.collected_qty === undefined || order.collected_qty === null) return 'Not set';
    if (order.collected_qty >= order.can_qty) return 'Complete';
    return `${order.collected_qty}/${order.can_qty}`;
  };

  const getCollectionStatusColor = (order: Order) => {
    if (order.collected_qty === undefined || order.collected_qty === null) return 'text-gray-500';
    if (order.collected_qty >= order.can_qty) return 'text-green-600';
    return 'text-orange-600';
  };

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
        <div className="text-red-600 text-lg font-semibold">Error loading orders: {error}</div>
        <Button onClick={fetchOrders} className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your order records and generate receipts</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          className="mt-3 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          onClick={() => navigate('/orders/new')}
        >
          Create New Order
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
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'pending' | 'processing' | 'delivered' | 'cancelled')}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
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
                  Order Info
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Collection Status
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Delivery Schedule
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{order.customer_name}</div>
                        <div className="text-sm text-gray-500">{order.customer_phone}</div>
                        <div className="text-xs text-gray-400">Order #{order.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center mb-1">
                        <Package className="h-4 w-4 text-blue-500 mr-1" />
                        <span className="font-semibold">{order.can_qty} cans</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Ordered: {new Date(order.order_date).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <span className={`font-semibold ${getCollectionStatusColor(order)}`}>
                        {getCollectionStatus(order)}
                      </span>
                      {order.collected_date && (
                        <div className="text-xs text-gray-500 mt-1">
                          Collected: {new Date(order.collected_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center mb-1">
                        <Calendar className="h-4 w-4 text-green-500 mr-1" />
                        <span>{new Date(order.delivery_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-orange-500 mr-1" />
                        <span className="text-xs">{order.delivery_time}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getOrderStatusBadge(order.order_status)}>
                      {order.order_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Eye size={14} />}
                        onClick={() => viewOrderReceipt(order)}
                        disabled={viewingReceipt === order.id}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                      >
                        {viewingReceipt === order.id ? 'Loading...' : 'View'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Receipt size={14} />}
                        onClick={() => generateOrderReceipt(order)}
                        disabled={generatingReceipt === order.id}
                        className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                      >
                        {generatingReceipt === order.id ? 'Generating...' : 'Receipt'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Edit size={14} />}
                        onClick={() => navigate(`/orders/edit/${order.id}`)}
                        className="bg-yellow-50 hover:bg-yellow-100 text-yellow-600 border-yellow-200"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => handleDeleteOrder(order.id)}
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

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by creating your first order.'}
            </p>
            {!searchTerm && selectedStatus === 'all' && (
              <div className="mt-6">
                <Button
                  variant="primary"
                  icon={<Plus size={16} />}
                  onClick={() => navigate('/orders/new')}
                >
                  Create New Order
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Receipt Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Order Receipt Preview</h2>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.print()}
                  icon={<FileText size={16} />}
                >
                  Print
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div dangerouslySetInnerHTML={{ __html: receiptContent }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;