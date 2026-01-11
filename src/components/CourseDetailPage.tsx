import { useState, useEffect } from 'react';
import { Play, BookOpen, Clock, Users, Star, ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import ReactPlayer from 'react-player';
import CustomVimeoPlayer from './CustomVimeoPlayer'


interface CourseDetailPageProps {
  courseId: string;
  accessToken?: string;
  onBack: () => void;
  onPurchase: (course: any) => void;
}

export function CourseDetailPage({ courseId, accessToken, onBack, onPurchase }: CourseDetailPageProps) {
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    fetchCourseDetail();
    if (accessToken) {
      checkAccess();
    }
  }, [courseId, accessToken]);

  const fetchCourseDetail = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCourse(data.course);
        setLessons(data.lessons || []);
        if (data.lessons && data.lessons.length > 0) {
          setSelectedLesson(data.lessons[0]);
        }
      } else {
        toast.error('Хичээл олдсонгүй');
      }
    } catch (error) {
      console.error('Error fetching course detail:', error);
      toast.error('Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const checkAccess = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/my-orders`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const hasPurchased = data.orders?.some((o: any) =>
          o.courseId === courseId && o.status === 'confirmed'
        );
        setHasAccess(hasPurchased);
      }
    } catch (error) {
      console.error('Error checking access:', error);
    }
  };


  const goNextLesson = () => {
  const index = lessons.findIndex(l => l.id === selectedLesson.id);
  if (lessons[index + 1]) {
    setSelectedLesson(lessons[index + 1]);
  }
};


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Уншиж байна...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <div className="text-xl text-gray-600 mb-4">Хичээл олдсонгүй</div>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Буцах
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Буцах
          </button>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h1 className="text-4xl mb-4">{course.title}</h1>
              <p className="text-xl text-white/90 mb-6">{course.description}</p>

              <div className="flex flex-wrap items-center gap-6 text-white/90">
                {/* <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{course.students} суралцагч</span>
                </div> */}
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span>{course.rating}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{lessons.length} хичээл</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  Түвшин: {course.level}
                </div>
                <div className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  Багш: {course.teacher}
                </div>
              </div>
            </div>

            <div className="bg-white text-gray-900 rounded-2xl p-6 h-fit">
              <div className="text-3xl mb-4">{course.price?.toLocaleString()}₮</div>

              {hasAccess ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span>Та энэ хичээлд элссэн байна</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onPurchase(course)}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mb-4"
                >
                  Худалдаж авах
                </button>
              )}

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Насан туршийн хандалт</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Сертификат олгоно</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Дэмжлэг үзүүлнэ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            {selectedLesson ? (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {hasAccess ? (
                  <>
                    {selectedLesson.vimeo_video_id && (
  <CustomVimeoPlayer
  vimeoId={selectedLesson.vimeo_video_id}
  startTime={selectedLesson.last_progress || 0}
  onEnded={() => goNextLesson()}
/>

)}


                    <div className="p-6">
                      <h2 className="text-2xl text-gray-900 mb-2">{selectedLesson.title}</h2>
                      <p className="text-gray-600 mb-4">{selectedLesson.description}</p>

                      {selectedLesson.duration && (
                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{selectedLesson.duration}</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Lock className="w-20 h-20 mx-auto mb-4" />
                      <p className="text-xl mb-4">Энэ хичээлийг үзэхийн тулд худалдаж аваарай</p>
                      <button
                        onClick={() => onPurchase(course)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Худалдаж авах - {course.price?.toLocaleString()}₮
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Хичээл нэмэгдээгүй байна</p>
              </div>
            )}
          </div>

          {/* Lessons List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl text-gray-900 mb-4">
                Хичээлийн агуулга ({lessons.length})
              </h3>

              {lessons.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Хичээл нэмэгдээгүй</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson, index) => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLesson(lesson)}
                      className={`w-full text-left p-4 rounded-lg transition ${selectedLesson?.id === lesson.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${selectedLesson?.id === lesson.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                          }`}>
                          {hasAccess ? (
                            <Play className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 mb-1">
                            Хичээл {index + 1}
                          </div>
                          <div className="text-sm text-gray-900 mb-1">
                            {lesson.title}
                          </div>
                          {lesson.duration && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {lesson.duration}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
