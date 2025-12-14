import { useState, useEffect } from 'react';
import { Shield, Package, CheckCircle, XCircle, Clock, User, Mail, CreditCard, Calendar, BookOpen, Tag, MessageSquare, Phone, Star, Trash2, Plus } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface AdminPanelProps {
  accessToken: string;
  onNavigateToCourseManagement?: () => void;
}

export function AdminPanel({ accessToken, onNavigateToCourseManagement }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'promo' | 'feedback' | 'contact' | 'users'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [confirmingOrder, setConfirmingOrder] = useState<string | null>(null);
  
  // Promo code form
  const [newPromo, setNewPromo] = useState({ code: '', discountPercent: '', description: '' });
  const [creatingPromo, setCreatingPromo] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchPromoCodes();
    fetchFeedback();
    fetchContactMessages();
    fetchUsers();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/admin/orders`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Захиалга татах амжилтгүй боллоо');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const fetchPromoCodes = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/admin/promo-codes`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data.promoCodes || []);
      }
    } catch (error) {
      console.error('Error fetching promo codes:', error);
    }
  };

  const fetchFeedback = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/admin/feedback`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data.feedback || []);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const fetchContactMessages = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/admin/contact-messages`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setContactMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching contact messages:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/admin/users`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        const error = await response.json();
        console.error('Error fetching users:', error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const confirmPayment = async (orderId: string) => {
    setConfirmingOrder(orderId);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/admin/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ orderId })
      });

      if (response.ok) {
        toast.success('Төлбөр амжилттай баталгаажлаа!');
        fetchOrders();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Баталгаажуулах амжилтгүй боллоо');
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Алдаа гарлаа');
    } finally {
      setConfirmingOrder(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Энэ захиалгыг цуцлахдаа итгэлтэй байна уу?')) {
      return;
    }

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/admin/cancel-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ orderId })
      });

      if (response.ok) {
        toast.success('Захиалга цуцлагдлаа');
        fetchOrders();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Цуцлах амжилтгүй боллоо');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('Алдаа гарлаа');
    }
  };

  const createPromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPromo(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/admin/promo-codes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(newPromo)
      });

      if (response.ok) {
        toast.success('Promo code амжилттай үүслээ!');
        setNewPromo({ code: '', discountPercent: '', description: '' });
        fetchPromoCodes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Promo code үүсгэх амжилтгүй боллоо');
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
      toast.error('Алдаа гарлаа');
    } finally {
      setCreatingPromo(false);
    }
  };

  const togglePromoCode = async (code: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/admin/promo-codes/${code}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        toast.success('Promo code төлөв өөрчлөгдлөө');
        fetchPromoCodes();
      } else {
        toast.error('Төлөв өөрчлөхөд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error toggling promo code:', error);
      toast.error('Алдаа гарлаа');
    }
  };

  const deletePromoCode = async (code: string) => {
    if (!confirm('Энэ promo code-г устгахдаа итгэлтэй байна уу?')) {
      return;
    }

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/admin/promo-codes/${code}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        toast.success('Promo code устгагдлаа');
        fetchPromoCodes();
      } else {
        toast.error('Устгахад алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error deleting promo code:', error);
      toast.error('Алдаа гарлаа');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders
      .filter(o => o.status === 'confirmed')
      .reduce((sum, o) => sum + (o.finalPrice || o.coursePrice || 0), 0)
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
            <Clock className="w-4 h-4" />
            Хүлээгдэж байна
          </div>
        );
      case 'confirmed':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            Баталгаажсан
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
            <XCircle className="w-4 h-4" />
            Цуцлагдсан
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Уншиж байна...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-8 h-8 text-blue-600" />
                <h1 className="text-4xl text-gray-900">Админ панел</h1>
              </div>
              <p className="text-xl text-gray-600">Захиалга болон төлбөрийн удирдлага</p>
            </div>
            {onNavigateToCourseManagement && (
              <button
                onClick={onNavigateToCourseManagement}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Хичээл удирдлага
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-6 h-6 text-blue-600" />
              <div className="text-sm text-gray-600">Нийт захиалга</div>
            </div>
            <div className="text-3xl text-gray-900">{stats.total}</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-yellow-600" />
              <div className="text-sm text-gray-600">Хүлээгдэж буй</div>
            </div>
            <div className="text-3xl text-gray-900">{stats.pending}</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div className="text-sm text-gray-600">Баталгаажсан</div>
            </div>
            <div className="text-3xl text-gray-900">{stats.confirmed}</div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-6 h-6 text-red-600" />
              <div className="text-sm text-gray-600">Цуцлагдсан</div>
            </div>
            <div className="text-3xl text-gray-900">{stats.cancelled}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="w-6 h-6" />
              <div className="text-sm">Нийт орлого</div>
            </div>
            <div className="text-3xl">{stats.revenue.toLocaleString()}₮</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-4 transition flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-5 h-5" />
              Захиалгууд ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('promo')}
              className={`px-6 py-4 transition flex items-center gap-2 ${
                activeTab === 'promo'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Tag className="w-5 h-5" />
              Promo код ({promoCodes.length})
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-6 py-4 transition flex items-center gap-2 ${
                activeTab === 'feedback'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Star className="w-5 h-5" />
              Сэтгэгдэл ({feedback.length})
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`px-6 py-4 transition flex items-center gap-2 ${
                activeTab === 'contact'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              Холбоо барих ({contactMessages.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-4 transition flex items-center gap-2 ${
                activeTab === 'users'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-5 h-5" />
              Хэрэглэгчид ({users.length})
            </button>
          </div>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-center gap-4">
                <span className="text-gray-700">Шүүлтүүр:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Бүгд ({stats.total})
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter === 'pending'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Хүлээгдэж буй ({stats.pending})
                  </button>
                  <button
                    onClick={() => setFilter('confirmed')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter === 'confirmed'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Баталгаажсан ({stats.confirmed})
                  </button>
                  <button
                    onClick={() => setFilter('cancelled')}
                    className={`px-4 py-2 rounded-lg transition ${
                      filter === 'cancelled'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Цуцлагдсан ({stats.cancelled})
                  </button>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Захиалга байхгүй байна</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm text-gray-700">Захиалгын ID</th>
                        <th className="px-6 py-4 text-left text-sm text-gray-700">Хэрэглэгч</th>
                        <th className="px-6 py-4 text-left text-sm text-gray-700">Хичээл</th>
                        <th className="px-6 py-4 text-left text-sm text-gray-700">Үнэ</th>
                        <th className="px-6 py-4 text-left text-sm text-gray-700">Төлбөрийн хэлбэр</th>
                        <th className="px-6 py-4 text-left text-sm text-gray-700">Огноо</th>
                        <th className="px-6 py-4 text-left text-sm text-gray-700">Статус</th>
                        <th className="px-6 py-4 text-left text-sm text-gray-700">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 font-mono">
                              {order.id.split(':')[1]}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <User className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-sm text-gray-900">{order.userName}</div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {order.userEmail}
                                </div>
                                {order.userPhone && (
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {order.userPhone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{order.courseTitle}</div>
                            {order.promoCode && (
                              <div className="text-xs text-green-600 mt-1">
                                Promo: {order.promoCode}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {order.discount > 0 ? (
                              <div>
                                <div className="text-sm text-gray-400 line-through">{order.coursePrice?.toLocaleString()}₮</div>
                                <div className="text-sm text-green-600">{order.finalPrice?.toLocaleString()}₮</div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-900">{(order.finalPrice || order.coursePrice)?.toLocaleString()}₮</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700 capitalize">
                              {order.paymentMethod === 'bank_transfer' ? 'Шилжүүлэг' : order.paymentMethod}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700 flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(order.createdAt).toLocaleDateString('mn-MN')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleTimeString('mn-MN')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-6 py-4">
                            {order.status === 'pending' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => confirmPayment(order.id)}
                                  disabled={confirmingOrder === order.id}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  {confirmingOrder === order.id ? 'Уншиж байна...' : 'Баталгаажуулах'}
                                </button>
                                <button
                                  onClick={() => cancelOrder(order.id)}
                                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                                >
                                  Цуцлах
                                </button>
                              </div>
                            )}
                            {order.status === 'confirmed' && (
                              <div className="text-sm text-gray-500">
                                Баталгаажсан
                              </div>
                            )}
                            {order.status === 'cancelled' && (
                              <div className="text-sm text-gray-500">
                                Цуцлагдсан
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Promo Codes Tab */}
        {activeTab === 'promo' && (
          <>
            {/* Create Promo Form */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-xl text-gray-900 mb-4">Шинэ Promo код үүсгэх</h3>
              <form onSubmit={createPromoCode} className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Код</label>
                  <input
                    type="text"
                    value={newPromo.code}
                    onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="PROMO2024"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Хөнгөлөлт (%)</label>
                  <input
                    type="number"
                    value={newPromo.discountPercent}
                    onChange={(e) => setNewPromo({ ...newPromo, discountPercent: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10"
                    min="1"
                    max="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Тайлбар</label>
                  <input
                    type="text"
                    value={newPromo.description}
                    onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Шинэ жилийн хөнгөлөлт"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={creatingPromo}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    {creatingPromo ? 'Үүсгэж байна...' : 'Үүсгэх'}
                  </button>
                </div>
              </form>
            </div>

            {/* Promo Codes List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              {promoCodes.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Promo код байхгүй байна</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm text-gray-700">Код</th>
                        <th className="px-6 py-4 text-left text-sm text-gray-700">Хөнгөлөлт</th>
                        <th className="px-6 py-4 text-left text-sm text-gray-700">Тайлбар</th>
                        <th className="px-6 py-4 text-left text-sm text-gray-700">Үүссэн огноо</th>
                        <th className="px-6 py-4 text-left text-sm text-gray-700">Төлөв</th>
                        <th className="px-6 py-4 text-left text-sm text-gray-700">Үйлдэл</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {promoCodes.map((promo) => (
                        <tr key={promo.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 font-mono">{promo.code}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{promo.discountPercent}%</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700">{promo.description || '-'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-700">
                              {new Date(promo.createdAt).toLocaleDateString('mn-MN')}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {promo.active ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                Идэвхтэй
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                Идэвхгүй
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => togglePromoCode(promo.code)}
                                className={`px-4 py-2 rounded-lg transition text-sm ${
                                  promo.active
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {promo.active ? 'Идэвхгүй болгох' : 'Идэвхжүүлэх'}
                              </button>
                              <button
                                onClick={() => deletePromoCode(promo.code)}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm flex items-center gap-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                Устгах
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {feedback.length === 0 ? (
              <div className="text-center py-12">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Сэтгэгдэл байхгүй байна</p>
              </div>
            ) : (
              <div className="divide-y">
                {feedback.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-5 h-5 ${
                                star <= item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-600">({item.rating}/5)</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString('mn-MN')}
                      </div>
                    </div>
                    <p className="text-gray-700">{item.feedback}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Contact Messages Tab */}
        {activeTab === 'contact' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {contactMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Мессеж байхгүй байна</p>
              </div>
            ) : (
              <div className="divide-y">
                {contactMessages.map((msg) => (
                  <div key={msg.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-gray-900">{msg.name}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            {msg.email}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(msg.createdAt).toLocaleDateString('mn-MN')}
                      </div>
                    </div>
                    <p className="text-gray-700">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Хэрэглэгч байхгүй байна</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm text-gray-700">Хэрэглэгч</th>
                      <th className="px-6 py-4 text-left text-sm text-gray-700">Холбоо барих</th>
                      <th className="px-6 py-4 text-left text-sm text-gray-700">Бүртгүүлсэн</th>
                      <th className="px-6 py-4 text-left text-sm text-gray-700">Хичээлүүд</th>
                      <th className="px-6 py-4 text-left text-sm text-gray-700">Явц</th>
                      <th className="px-6 py-4 text-left text-sm text-gray-700">Дэлгэрэнгүй</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                              <User className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 flex items-center gap-1">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {user.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700">
                            {new Date(user.createdAt).toLocaleDateString('mn-MN')}
                          </div>
                          {user.lastSignIn && (
                            <div className="text-xs text-gray-500">
                              Сүүлд: {new Date(user.lastSignIn).toLocaleDateString('mn-MN')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{user.enrolledCourses} хичээл</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                                style={{ width: `${user.totalProgress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{user.totalProgress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.courseProgress && user.courseProgress.length > 0 && (
                            <details className="cursor-pointer">
                              <summary className="text-sm text-blue-600 hover:text-blue-700">
                                Үзэх
                              </summary>
                              <div className="mt-3 space-y-2">
                                {user.courseProgress.map((course: any, idx: number) => (
                                  <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="text-sm text-gray-900 mb-1">{course.courseTitle}</div>
                                    <div className="text-xs text-gray-600 mb-2">
                                      {course.completedLessons}/{course.totalLessons} хичээл дууссан
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-green-500"
                                          style={{ width: `${course.progress}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-gray-600">{course.progress}%</span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      Элссэн: {new Date(course.enrolledAt).toLocaleDateString('mn-MN')}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}