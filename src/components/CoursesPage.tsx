import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { CourseCard } from './CourseCard';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface CoursesPageProps {
  onPurchase: (course: any) => void;
  onSelectCourse?: (courseId: string) => void;
  accessToken?: string;
}

export function CoursesPage({ onPurchase, onSelectCourse, accessToken }: CoursesPageProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [purchasedCourseIds, setPurchasedCourseIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('Бүгд');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
    if (accessToken) {
      fetchEnrollments();
      fetchOrders();
    }
  }, [accessToken]);

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
        const ids = data.enrollments?.map((e: any) => e.courseId) || [];
        setEnrolledCourseIds(ids);
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
        const ids = data.orders
          ?.filter((o: any) => o.status === 'confirmed')
          ?.map((o: any) => o.courseId) || [];
        setPurchasedCourseIds(ids);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'Бүгд' || course.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  const levels = ['Бүгд', 'Анхан', 'Дунд', 'Ахисан'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Уншиж байна...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* <div className="text-center mb-12">
          <h1 className="text-4xl text-gray-900 mb-4"></h1>
          <p className="text-xl text-gray-600">
            Өөрт тохирсон хичээлээ сонгож, суралцаж эхлээрэй
          </p>
        </div> */}

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Хичээл хайх..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-4">
              <Filter className="text-gray-400 w-5 h-5" />
              <div className="flex gap-2 flex-wrap">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSelectedLevel(level)}
                    className={`px-4 py-2 rounded-lg transition ${
                      selectedLevel === level
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredCourses.length} хичээл олдлоо
          </p>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-md">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-xl text-gray-600">Хайлтад тохирох хичээл олдсонгүй</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div 
                key={course.id}
                onClick={() => onSelectCourse && onSelectCourse(course.id)}
                className="cursor-pointer"
              >
                <CourseCard
                  course={course}
                  onPurchase={onPurchase}
                  isEnrolled={enrolledCourseIds.includes(course.id)}
                  isPurchased={purchasedCourseIds.includes(course.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
