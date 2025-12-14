import { useState, useEffect } from 'react';
import { User, BookOpen, Award, Settings, TrendingUp, ShoppingBag, Clock, CheckCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ProfilePageProps {
  accessToken: string;
  onNavigate: (section: string) => void;
}

export function ProfilePage({ accessToken, onNavigate }: ProfilePageProps) {
  const [profile, setProfile] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'courses' | 'orders'>('courses');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchEnrollments();
    fetchOrders();
    fetchCourses();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setFormData({
          name: data.profile.name || '',
          phone: data.profile.phone || '',
          bio: data.profile.bio || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/my-courses`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEnrollments(data.enrollments || []);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/my-orders`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/courses`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setProfile({ ...profile, ...formData });
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Уншиж байна...</div>
      </div>
    );
  }

  const enrolledCourses = courses.filter(course => 
    enrollments.some(enrollment => enrollment.courseId === course.id)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl">
                  {profile?.name?.charAt(0) || 'U'}
                </div>
                <h2 className="text-2xl text-gray-900">{profile?.name}</h2>
                <p className="text-gray-600">{profile?.email}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-600">Элссэн хичээл</div>
                    <div className="text-gray-900">{enrolledCourses.length}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Award className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-sm text-gray-600">Сертификат</div>
                    <div className="text-gray-900">{enrolledCourses.filter(c => c.completed).length}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-sm text-gray-600">Түвшин</div>
                    <div className="text-gray-900">Дунд</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <Settings className="w-5 h-5" />
                Мэдээлэл засах
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Edit Profile Form */}
            {isEditing && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl text-gray-900 mb-6">Профайл засах</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Нэр</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Утас</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+976 ..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Танилцуулга</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                      placeholder="Өөрийнхөө тухай товч..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Хадгалах
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Цуцлах
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex gap-4 mb-6 border-b">
                <button
                  onClick={() => setActiveTab('courses')}
                  className={`pb-4 px-4 transition ${
                    activeTab === 'courses'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Миний хичээлүүд ({enrolledCourses.length})
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`pb-4 px-4 transition ${
                    activeTab === 'orders'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Миний захиалга ({orders.length})
                </button>
              </div>

              {activeTab === 'courses' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl text-gray-900">Элссэн хичээлүүд</h3>
                    <button
                      onClick={() => onNavigate('courses')}
                      className="text-blue-600 hover:underline"
                    >
                      Бүх хичээл үзэх
                    </button>
                  </div>

              {enrolledCourses.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Та одоогоор ямар ч хичээлд элсээгүй байна</p>
                  <button
                    onClick={() => onNavigate('courses')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Хичээл сонгох
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrolledCourses.map((course) => {
                    const enrollment = enrollments.find(e => e.courseId === course.id);
                    const progress = enrollment?.progress || 0;

                    return (
                      <div key={course.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg text-gray-900 mb-2">{course.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{course.teacher}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>{course.level}</span>
                              <span>•</span>
                              <span>{course.duration}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600 mb-1">Явц</div>
                            <div className="text-2xl text-blue-600">{progress}%</div>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <button className="text-blue-600 hover:underline text-sm">
                          Үргэлжлүүлэх →
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Захиалга байхгүй байна</p>
                      <button
                        onClick={() => onNavigate('courses')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Хичээл худалдаж авах
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const course = courses.find(c => c.id === order.courseId);
                        
                        return (
                          <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h4 className="text-lg text-gray-900 mb-2">{order.courseTitle}</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Захиалгын дугаар:</span>
                                    <div className="text-gray-900 font-mono text-xs mt-1">
                                      {order.id.split(':').slice(-1)[0]}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Огноо:</span>
                                    <div className="text-gray-900 mt-1">
                                      {new Date(order.createdAt).toLocaleDateString('mn-MN')}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Төлбөрийн хэлбэр:</span>
                                    <div className="text-gray-900 mt-1">
                                      {order.paymentMethod === 'bank_transfer' ? 'Шилжүүлэг' : order.paymentMethod}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Үнэ:</span>
                                    <div className="text-gray-900 mt-1">
                                      {order.coursePrice?.toLocaleString()}₮
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div>
                                {order.status === 'pending' && (
                                  <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                                    <Clock className="w-4 h-4" />
                                    Хүлээгдэж байна
                                  </div>
                                )}
                                {order.status === 'confirmed' && (
                                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    Баталгаажсан
                                  </div>
                                )}
                                {order.status === 'cancelled' && (
                                  <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                                    ✕ Цуцлагдсан
                                  </div>
                                )}
                              </div>
                            </div>

                            {order.status === 'pending' && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                                💡 Төлбөр шилжүүлсний дараа админ баталгаажуулна. Баталгаажсаны дараа хичээлд нэвтрэх боломжтой болно.
                              </div>
                            )}

                            {order.status === 'confirmed' && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                                ✓ Төлбөр баталгаажлаа. Та одоо хичээлд нэвтрэх боломжтой.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
