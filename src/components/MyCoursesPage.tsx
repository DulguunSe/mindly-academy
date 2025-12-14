import { useState, useEffect } from 'react';
import { BookOpen, Play, ArrowLeft } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface MyCoursesPageProps {
  accessToken: string;
  onBack: () => void;
  onSelectCourse: (courseId: string) => void;
}

export function MyCoursesPage({ accessToken, onBack, onSelectCourse }: MyCoursesPageProps) {
  const [purchasedCourses, setPurchasedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchasedCourses();
  }, []);

  const fetchPurchasedCourses = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/my-purchased-courses`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPurchasedCourses(data.courses || []);
      } else {
        toast.error('Алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error fetching purchased courses:', error);
      toast.error('Алдаа гарлаа');
    } finally {
      setLoading(false);
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
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Буцах
        </button>

        <div className="mb-8">
          <h1 className="text-4xl text-gray-900 mb-2">Миний хичээлүүд</h1>
          <p className="text-xl text-gray-600">
            Та худалдаж авсан {purchasedCourses.length} хичээлтэй байна
          </p>
        </div>

        {purchasedCourses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl text-gray-900 mb-2">Хичээл байхгүй байна</h3>
            <p className="text-gray-600 mb-6">
              Та одоогоор ямар ч хичээл худалдаж аваагүй байна
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Хичээл үзэх
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchasedCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition group cursor-pointer"
                onClick={() => onSelectCourse(course.id)}
              >
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
                  {course.image ? (
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <BookOpen className="w-16 h-16" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition flex items-center justify-center">
                    <Play className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl text-gray-900 mb-2 group-hover:text-blue-600 transition">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-500">
                      {course.lessons?.length || 0} хичээл
                    </div>
                    <div className="text-gray-500">
                      {course.teacher}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Худалдаж авсан огноо
                      </span>
                      <span className="text-xs text-gray-600">
                        {new Date(course.purchaseDate).toLocaleDateString('mn-MN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
