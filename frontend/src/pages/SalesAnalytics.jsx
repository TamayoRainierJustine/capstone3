import React, { useState, useEffect } from 'react';
import apiClient from '../utils/axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  FaDollarSign, 
  FaShoppingCart, 
  FaChartLine, 
  FaArrowUp, 
  FaArrowDown,
  FaCalendarAlt,
  FaFilter,
  FaCreditCard,
  FaQrcode,
  FaMoneyBillWave,
  FaBox,
  FaCheckCircle,
  FaClock,
  FaTimesCircle
} from 'react-icons/fa';

const COLORS = {
  purple: '#8b5cf6',
  blue: '#6366f1',
  green: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
  pink: '#ec4899',
  teal: '#14b8a6',
  indigo: '#4f46e5'
};

const PAYMENT_COLORS = {
  gcash: '#10b981',
  cod: '#f59e0b',
  paypal: '#0070ba',
  card: '#8b5cf6'
};

const SalesAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedPeriod, setSelectedPeriod] = useState('6m'); // 7d, 30d, 3m, 6m, 1y, custom

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const setQuickDateRange = (period) => {
    setSelectedPeriod(period);
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '3m':
        start.setMonth(end.getMonth() - 3);
        break;
      case '6m':
        start.setMonth(end.getMonth() - 6);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'custom':
        return; // Don't change dates for custom
      default:
        start.setMonth(end.getMonth() - 6);
    }
    
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await apiClient.get('/orders/analytics', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return `₱${parseFloat(value || 0).toFixed(2)}`;
  };

  const formatChartData = () => {
    if (!analytics?.monthlySales) return [];
    
    return analytics.monthlySales.map(item => {
      const monthParts = item.month?.split('-');
      let monthLabel = item.month;
      if (monthParts && monthParts.length === 2) {
        const year = monthParts[0];
        const month = parseInt(monthParts[1]);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthLabel = `${monthNames[month - 1]} ${year}`;
      }
      
      return {
        month: item.month,
        monthLabel: monthLabel,
        // Use product sales (subtotal) as the primary revenue metric,
        // fall back to totalSales if older analytics data is still present
        sales: parseFloat((item.productSales ?? item.totalSales) || 0),
        productSales: parseFloat((item.productSales ?? item.totalSales) || 0),
        shippingFees: parseFloat(item.shippingFees || 0),
        orders: parseInt(item.orderCount || 0)
      };
    }).sort((a, b) => a.month.localeCompare(b.month));
  };

  // Calculate payment method breakdown
  const getPaymentMethodData = () => {
    if (!analytics?.recentOrders) return [];
    const methods = {};
    analytics.recentOrders.forEach(order => {
      const method = order.paymentMethod || 'unknown';
      methods[method] = (methods[method] || 0) + 1;
    });
    
    return Object.entries(methods).map(([name, value]) => ({
      name: name.toUpperCase(),
      value
    }));
  };

  // Calculate order status breakdown
  const getOrderStatusData = () => {
    if (!analytics?.recentOrders) return [];
    const statuses = {};
    analytics.recentOrders.forEach(order => {
      const status = order.status || 'pending';
      statuses[status] = (statuses[status] || 0) + 1;
    });
    
    return Object.entries(statuses).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  };

  // Calculate growth percentage (compare with previous period)
  const calculateGrowth = () => {
    if (!chartData || chartData.length < 2) return null;
    const current = chartData[chartData.length - 1]?.sales || 0;
    const previous = chartData[chartData.length - 2]?.sales || 0;
    if (previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const chartData = formatChartData();
  const paymentData = getPaymentMethodData();
  const statusData = getOrderStatusData();
  const growth = calculateGrowth();

  const totalSales = analytics?.totalSales || 0; // products + shipping
  const productRevenue = analytics?.productRevenue ?? totalSales;
  const shippingRevenue = analytics?.shippingRevenue || 0;
  const totalOrders = analytics?.totalOrders || 0;
  // Average order value is based on product revenue only
  const avgOrderValue = totalOrders > 0 ? productRevenue / totalOrders : 0;
  const pendingOrders = analytics?.recentOrders?.filter(o => o.status === 'pending' || o.status === 'processing').length || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sales Analytics</h1>
          <p className="text-gray-600 text-lg">Track your store performance and sales metrics</p>
        </div>

        {/* Quick Date Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FaFilter className="text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">Quick Filters</h3>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { label: 'Last 7 Days', value: '7d' },
              { label: 'Last 30 Days', value: '30d' },
              { label: 'Last 3 Months', value: '3m' },
              { label: 'Last 6 Months', value: '6m' },
              { label: 'Last Year', value: '1y' },
              { label: 'Custom', value: 'custom' }
            ].map((period) => (
              <button
                key={period.value}
                onClick={() => period.value === 'custom' ? setSelectedPeriod('custom') : setQuickDateRange(period.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedPeriod === period.value
                    ? 'bg-purple-600 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          
          {/* Custom Date Range */}
          {(selectedPeriod === 'custom' || selectedPeriod === null) && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaCalendarAlt className="inline mr-2" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => {
                    setDateRange({ ...dateRange, startDate: e.target.value });
                    setSelectedPeriod('custom');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaCalendarAlt className="inline mr-2" />
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => {
                    setDateRange({ ...dateRange, endDate: e.target.value });
                    setSelectedPeriod('custom');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Sales Card */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 rounded-lg p-3">
                <FaDollarSign className="text-2xl" />
              </div>
              {growth !== null && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                  growth >= 0 ? 'bg-green-500/30' : 'bg-red-500/30'
                }`}>
                  {growth >= 0 ? <FaArrowUp /> : <FaArrowDown />}
                  {Math.abs(growth).toFixed(1)}%
                </div>
              )}
            </div>
            <h3 className="text-purple-100 text-sm font-medium mb-1">Total Revenue</h3>
            <p className="text-3xl font-bold">{formatCurrency(totalSales)}</p>
            <p className="mt-2 text-xs text-purple-100/90">
              Products:&nbsp;
              <span className="font-semibold">{formatCurrency(productRevenue)}</span>
              &nbsp;· Shipping:&nbsp;
              <span className="font-semibold">{formatCurrency(shippingRevenue)}</span>
            </p>
          </div>

          {/* Total Orders Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 rounded-lg p-3">
                <FaShoppingCart className="text-2xl" />
              </div>
            </div>
            <h3 className="text-blue-100 text-sm font-medium mb-1">Total Orders</h3>
            <p className="text-3xl font-bold">{totalOrders}</p>
          </div>

          {/* Average Order Value Card */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 rounded-lg p-3">
                <FaChartLine className="text-2xl" />
              </div>
            </div>
            <h3 className="text-green-100 text-sm font-medium mb-1">Average Order Value</h3>
            <p className="text-3xl font-bold">{formatCurrency(avgOrderValue)}</p>
          </div>

          {/* Pending Orders Card */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white/20 rounded-lg p-3">
                <FaClock className="text-2xl" />
              </div>
            </div>
            <h3 className="text-orange-100 text-sm font-medium mb-1">Pending Orders</h3>
            <p className="text-3xl font-bold">{pendingOrders}</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Sales Trend Line Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Sales Trend</h2>
                <p className="text-sm text-gray-600">Monthly sales revenue trend</p>
              </div>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="monthLabel" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tick={{ fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke={COLORS.purple}
                    style={{ fontSize: '12px' }}
                    tick={{ fill: COLORS.purple }}
                    tickFormatter={(value) => {
                      if (value >= 1000) return `₱${(value / 1000).toFixed(1)}k`;
                      return `₱${value.toFixed(0)}`;
                    }}
                    domain={[0, 'auto']}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '10px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="productSales"
                    stroke={COLORS.purple}
                    strokeWidth={3}
                    name="Product Revenue (₱)"
                    dot={{ fill: COLORS.purple, r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FaChartLine className="text-4xl mx-auto mb-2 text-gray-300" />
                <p>No sales data available</p>
              </div>
            )}
          </div>

          {/* Order Volume Bar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Order Volume</h2>
                <p className="text-sm text-gray-600">Number of orders per month</p>
              </div>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="monthLabel" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tick={{ fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke={COLORS.blue}
                    style={{ fontSize: '12px' }}
                    tick={{ fill: COLORS.blue }}
                    domain={[0, 'auto']}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    formatter={(value) => `${value} order(s)`}
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '10px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="orders" 
                    fill={COLORS.blue} 
                    name="Orders" 
                    radius={[8, 8, 0, 0]}
                    opacity={0.8}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FaShoppingCart className="text-4xl mx-auto mb-2 text-gray-300" />
                <p>No order data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods & Order Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Payment Methods Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Payment Methods</h2>
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[entry.name.toLowerCase()] || COLORS.purple} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FaCreditCard className="text-4xl mx-auto mb-2 text-gray-300" />
                <p>No payment data available</p>
              </div>
            )}
          </div>

          {/* Order Status Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Status Breakdown</h2>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.name.toLowerCase() === 'completed' ? COLORS.green :
                          entry.name.toLowerCase() === 'shipped' ? COLORS.purple :
                          entry.name.toLowerCase() === 'processing' ? COLORS.blue :
                          COLORS.orange
                        } 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FaBox className="text-4xl mx-auto mb-2 text-gray-300" />
                <p>No status data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders Table */}
        {analytics?.recentOrders && analytics.recentOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Recent Orders</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customerName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          {order.paymentMethod === 'gcash' && <FaQrcode className="text-green-600" />}
                          {order.paymentMethod === 'cod' && <FaMoneyBillWave className="text-orange-600" />}
                          {order.paymentMethod === 'card' && <FaCreditCard className="text-purple-600" />}
                          {order.paymentMethod?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'shipped'
                            ? 'bg-purple-100 text-purple-800'
                            : order.status === 'processing'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status === 'completed' && <FaCheckCircle />}
                          {order.status === 'pending' && <FaClock />}
                          {order.status === 'cancelled' && <FaTimesCircle />}
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesAnalytics;
