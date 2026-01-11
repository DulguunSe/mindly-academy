import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, BookOpen, Video, ArrowLeft } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface AdminCourseManagementProps {
  accessToken: string;
  onBack: () => void;
}

export function AdminCourseManagement({ accessToken, onBack }: AdminCourseManagementProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [loading, setLoading] = useState(true);

  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    teacher: '',
    level: 'Анхан',
    duration: '',
    price: 0,
    image: '',
    students: 0,
    rating: 5.0
  });

  const [lessonForm, setLessonForm] = useState({
    id: '',
    title: '',
    description: '',
    vimeo_video_id: '',
    duration: '',
    order: 0
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchLessons(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/courses`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async (courseId: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLessons(data.lessons || []);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const handleSaveCourse = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/admin/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(courseForm.id ? courseForm : { ...courseForm, id: undefined })
      });

      if (response.ok) {
        toast.success(courseForm.id ? 'Хичээл шинэчлэгдлээ' : 'Хичээл нэмэгдлээ');
        fetchCourses();
        setIsEditingCourse(false);
        resetCourseForm();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error('Алдаа гарлаа');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Энэ хичээлийг устгахдаа итгэлтэй байна уу? Хичээлийн бүх video-г устгах болно.')) {
      return;
    }

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/admin/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        toast.success('Хичээл устгагдлаа');
        fetchCourses();
        if (selectedCourse?.id === courseId) {
          setSelectedCourse(null);
        }
      } else {
        toast.error('Алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Алдаа гарлаа');
    }
  };

  const handleSaveLesson = async () => {
    if (!selectedCourse) {
      toast.error('Эхлээд хичээл сонгоно уу');
      return;
    }

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/admin/lessons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          ...lessonForm,
          courseId: selectedCourse.id,
          id: lessonForm.id || undefined
        })
      });

      if (response.ok) {
        toast.success(lessonForm.id ? 'Video хичээл шинэчлэгдлээ' : 'Video хичээл нэмэгдлээ');
        fetchLessons(selectedCourse.id);
        setIsEditingLesson(false);
        resetLessonForm();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('Алдаа гарлаа');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Энэ video хичээлийг устгахдаа итгэлтэй байна уу?')) {
      return;
    }

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/admin/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        toast.success('Video хичээл устгагдлаа');
        if (selectedCourse) {
          fetchLessons(selectedCourse.id);
        }
      } else {
        toast.error('Алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Алдаа гарлаа');
    }
  };

  const resetCourseForm = () => {
    setCourseForm({
      title: '',
      description: '',
      teacher: '',
      level: 'Анхан',
      duration: '',
      price: 0,
      image: '',
      students: 0,
      rating: 5.0
    });
  };

  const resetLessonForm = () => {
    setLessonForm({
      id: '',
      title: '',
      description: '',
      vimeo_video_id: '',
      duration: '',
      order: lessons.length
    });
  };

  const startEditCourse = (course: any) => {
    setCourseForm(course);
    setIsEditingCourse(true);
  };

  const startEditLesson = (lesson: any) => {
    setLessonForm(lesson);
    setIsEditingLesson(true);
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
          <h1 className="text-4xl text-gray-900 mb-2">Хичээл удирдлага</h1>
          <p className="text-xl text-gray-600">Хичээл болон video хичээлүүдийг нэмэх, засах</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Courses Section */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl text-gray-900">Хичээлүүд ({courses.length})</h2>
                <button
                  onClick={() => {
                    resetCourseForm();
                    setIsEditingCourse(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-5 h-5" />
                  Хичээл нэмэх
                </button>
              </div>

              {/* Course Form */}
              {isEditingCourse && (
                <div className="mb-6 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg text-gray-900">
                      {courseForm.id ? 'Хичээл засах' : 'Шинэ хичээл'}
                    </h3>
                    <button
                      onClick={() => {
                        setIsEditingCourse(false);
                        resetCourseForm();
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Нэр *</label>
                      <input
                        type="text"
                        value={courseForm.title}
                        onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="JavaScript Үндэс"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Тайлбар *</label>
                      <textarea
                        value={courseForm.description}
                        onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                        placeholder="Хичээлийн тайлбар..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Багш *</label>
                        <input
                          type="text"
                          value={courseForm.teacher}
                          onChange={(e) => setCourseForm({ ...courseForm, teacher: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Б.Болд"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Түвшин *</label>
                        <select
                          value={courseForm.level}
                          onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Анхан">Анхан</option>
                          <option value="Дунд">Дунд</option>
                          <option value="Ахисан">Ахисан</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Үргэлжлэх хугацаа</label>
                        <input
                          type="text"
                          value={courseForm.duration}
                          onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="8 долоо хоног"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 mb-2">Үнэ (₮) *</label>
                        <input
                          type="number"
                          value={courseForm.price}
                          onChange={(e) => setCourseForm({ ...courseForm, price: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="120000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Зургийн URL</label>
                      <input
                        type="text"
                        value={courseForm.image}
                        onChange={(e) => setCourseForm({ ...courseForm, image: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>

                    <button
                      onClick={handleSaveCourse}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      Хадгалах
                    </button>
                  </div>
                </div>
              )}

              {/* Courses List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${selectedCourse?.id === course.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                    onClick={() => setSelectedCourse(course)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-gray-900 mb-1">{course.title}</h4>
                        <div className="text-sm text-gray-600 mb-2">{course.teacher}</div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{course.level}</span>
                          <span>•</span>
                          <span>{course.price?.toLocaleString()}₮</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditCourse(course);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.id);
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lessons Section */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl text-gray-900">
                  Video хичээлүүд {selectedCourse && `(${lessons.length})`}
                </h2>
                {selectedCourse && (
                  <button
                    onClick={() => {
                      resetLessonForm();
                      setIsEditingLesson(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Plus className="w-5 h-5" />
                    Video нэмэх
                  </button>
                )}
              </div>

              {!selectedCourse ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Хичээл сонгоно уу</p>
                </div>
              ) : (
                <>
                  {/* Lesson Form */}
                  {isEditingLesson && (
                    <div className="mb-6 p-6 bg-green-50 rounded-xl border-2 border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg text-gray-900">
                          {lessonForm.id ? 'Video хичээл засах' : 'Шинэ video хичээл'}
                        </h3>
                        <button
                          onClick={() => {
                            setIsEditingLesson(false);
                            resetLessonForm();
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-gray-700 mb-2">Нэр *</label>
                          <input
                            type="text"
                            value={lessonForm.title}
                            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="1-р хичээл: Танилцуулга"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-700 mb-2">Тайлбар</label>
                          <textarea
                            value={lessonForm.description}
                            onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent h-20 resize-none"
                            placeholder="Video-н тайлбар..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-700 mb-2">
                            Vimeo Video ID *
                          </label>

                          <input
                            type="text"
                            value={lessonForm.vimeo_video_id}
                            onChange={(e) =>
                              setLessonForm({ ...lessonForm, vimeo_video_id: e.target.value })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            placeholder="1146206818"
                          />

                          <p className="text-xs text-gray-500 mt-1">
                            Vimeo URL-н тоо хэсэг (https://vimeo.com/1146206818)
                          </p>

                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-700 mb-2">Үргэлжлэх хугацаа</label>
                            <input
                              type="text"
                              value={lessonForm.duration}
                              onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="15 минут"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-700 mb-2">Дараалал</label>
                            <input
                              type="number"
                              value={lessonForm.order}
                              onChange={(e) => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) || 0 })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleSaveLesson}
                          className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                        >
                          <Save className="w-5 h-5" />
                          Хадгалах
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lessons List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {lessons.length === 0 ? (
                      <div className="text-center py-8">
                        <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">Video хичээл нэмэгдээгүй</p>
                      </div>
                    ) : (
                      lessons.map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">
                                  {index + 1}
                                </div>
                                <h4 className="text-gray-900">{lesson.title}</h4>
                              </div>
                              {lesson.description && (
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{lesson.description}</p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                {lesson.duration && <span>{lesson.duration}</span>}
                                {lesson.vimeo_video_id && (
                                  <>
                                    <span>•</span>
                                    <span className="text-green-600">Video байна</span>
                                  </>
                                )}

                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEditLesson(lesson)}
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteLesson(lesson.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
