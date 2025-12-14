import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CoursesPage } from './components/CoursesPage';
import { ContactSection } from './components/ContactSection';
import { FeedbackForm } from './components/FeedbackForm';
import { ProfilePage } from './components/ProfilePage';
import { AuthModal } from './components/AuthModal';
import { CourseCard } from './components/CourseCard';
import { PurchaseModal } from './components/PurchaseModal';
import { AdminPanel } from './components/AdminPanel';
import { CourseDetailPage } from './components/CourseDetailPage';
import { MyCoursesPage } from './components/MyCoursesPage';
import { AdminCourseManagement } from './components/AdminCourseManagement';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { getSupabaseClient } from './utils/supabase/client';
import { toast, Toaster } from 'sonner@2.0.3';

export default function App() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentSection, setCurrentSection] = useState('home');
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [purchasedCourseIds, setPurchasedCourseIds] = useState<string[]>([]);

  useEffect(() => {
    checkExistingSession();
    initializeCourses();
  }, []);

  const checkExistingSession = async () => {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.auth.getSession();

      if (data.session?.access_token && !error) {
        setAccessToken(data.session.access_token);
        
        // Get user email
        const { data: userData } = await supabase.auth.getUser(data.session.access_token);
        if (userData?.user?.email) {
          setUserEmail(userData.user.email);
          setIsAdmin(userData.user.email === 'admin@admin.mn');
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const initializeCourses = async () => {
    try {
      // Check if courses already exist
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/courses`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const data = await response.json();

      if (!data.courses || data.courses.length === 0) {
        // Create sample courses
        const sampleCourses = [
          {
            title: 'JavaScript Үндэс',
            description: 'JavaScript програмчлалын үндсийг эхнээс нь суралцаарай. Энэ хичээл танд веб хөгжүүлэлтийн үндсэн мэдлэгийг өгнө.',
            teacher: 'Б.Болд',
            level: 'Анхан',
            duration: '8 долоо хоног',
            students: 245,
            rating: 4.8,
            price: 120000,
            image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFjaGVyJTIwY2xhc3Nyb29tfGVufDF8fHx8MTc2MjM2ODUzM3ww&ixlib=rb-4.1.0&q=80&w=1080',
            videoUrl: 'https://example.com/video1'
          },
          {
            title: 'React Хөгжүүлэлт',
            description: 'React library-г ашиглан орчин үеийн веб апп хөгжүүлэхийг сурцгаая. Hooks, Components болон бусад чухал ойлголтуудыг үзнэ.',
            teacher: 'Д.Дорж',
            level: 'Дунд',
            duration: '10 долоо хоног',
            students: 189,
            rating: 4.9,
            price: 180000,
            image: 'https://images.unsplash.com/photo-1747210044397-9f2d19ccf096?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rcyUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NjIzMjU1MTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
            videoUrl: 'https://example.com/video2'
          },
          {
            title: 'Python Програмчлал',
            description: 'Python хэл дээр програмчлалын үндсийг суралцаж, өгөгдлийн шинжилгээ болон машин суралцах чиглэлд хөл тавиарай.',
            teacher: 'Г.Ганбаатар',
            level: 'Анхан',
            duration: '12 долоо хоног',
            students: 312,
            rating: 4.7,
            price: 150000,
            image: 'https://images.unsplash.com/photo-1758874573116-2bc02232eef1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMGxlYXJuaW5nJTIwb25saW5lfGVufDF8fHx8MTc2MjMxNDgzMHww&ixlib=rb-4.1.0&q=80&w=1080',
            videoUrl: 'https://example.com/video3'
          },
          {
            title: 'UI/UX Дизайн',
            description: 'Хэрэглэгчийн туршлагад суурилсан дизайны ур чадвар эзэмшээрэй. Figma болон бусад хэрэгслүүдийг ашиглан практик хийнэ.',
            teacher: 'Т.Тэмүүлэн',
            level: 'Дунд',
            duration: '6 долоо хоног',
            students: 156,
            rating: 4.9,
            price: 140000,
            image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFjaGVyJTIwY2xhc3Nyb29tfGVufDF8fHx8MTc2MjM2ODUzM3ww&ixlib=rb-4.1.0&q=80&w=1080',
            videoUrl: 'https://example.com/video4'
          },
          {
            title: 'Node.js Backend',
            description: 'Node.js ба Express ашиглан серверийн талын програмчлалыг суралцаарай. Database интеграци, API хөгжүүлэлт зэргийг үзнэ.',
            teacher: 'С.Сүхбаатар',
            level: 'Ахисан',
            duration: '14 долоо хоног',
            students: 98,
            rating: 4.8,
            price: 200000,
            image: 'https://images.unsplash.com/photo-1747210044397-9f2d19ccf096?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rcyUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NjIzMjU1MTZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
            videoUrl: 'https://example.com/video5'
          },
          {
            title: 'Digital Marketing',
            description: 'Дижитал маркетингийн стратеги, SEO, SEM, сошиал медиа маркетинг зэрэг чиглэлээр судлана.',
            teacher: 'Ө.Өнөржаргал',
            level: 'Анхан',
            duration: '8 долоо хоног',
            students: 278,
            rating: 4.6,
            price: 110000,
            image: 'https://images.unsplash.com/photo-1758874573116-2bc02232eef1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50cyUyMGxlYXJuaW5nJTIwb25saW5lfGVufDF8fHx8MTc2MjMxNDgzMHww&ixlib=rb-4.1.0&q=80&w=1080',
            videoUrl: 'https://example.com/video6'
          }
        ];

        // Create courses
        for (const course of sampleCourses) {
          await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/courses`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: JSON.stringify(course)
          });
        }

        // Fetch courses again
        const newResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/courses`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });
        const newData = await newResponse.json();
        setFeaturedCourses(newData.courses?.slice(0, 3) || []);
      } else {
        setFeaturedCourses(data.courses?.slice(0, 3) || []);
      }
    } catch (error) {
      console.error('Error initializing courses:', error);
    } finally {
      setInitialized(true);
    }
  };

  const handleAuthSuccess = async (token: string) => {
    setAccessToken(token);
    
    // Get user email after login
    try {
      const supabase = getSupabaseClient();
      const { data: userData } = await supabase.auth.getUser(token);
      if (userData?.user?.email) {
        setUserEmail(userData.user.email);
        setIsAdmin(userData.user.email === 'admin@admin.mn');
      }
    } catch (error) {
      console.error('Error getting user email:', error);
    }
    
    toast.success('Амжилттай нэвтэрлээ!');
  };

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseClient();

      await supabase.auth.signOut();
      setAccessToken(null);
      setUserEmail(null);
      setIsAdmin(false);
      setCurrentSection('home');
      toast.success('Амжилттай гарлаа');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handlePurchase = (course: any) => {
    if (!accessToken) {
      setIsAuthModalOpen(true);
      toast.error('Худалдаж авахын тулд эхлээд нэвтэрнэ үү');
      return;
    }

    setSelectedCourse(course);
    setIsPurchaseModalOpen(true);
  };

  const handlePurchaseSuccess = async () => {
    // Refresh purchased courses
    if (accessToken) {
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
    }
  };

  const renderContent = () => {
    if (currentSection === 'admin') {
      if (!accessToken || !isAdmin) {
        toast.error('Админ эрх шаардлагатай');
        setCurrentSection('home');
        return null;
      }
      return (
        <AdminPanel 
          accessToken={accessToken} 
          onNavigateToCourseManagement={() => setCurrentSection('admin-courses')}
        />
      );
    }

    if (currentSection === 'admin-courses') {
      if (!accessToken || !isAdmin) {
        toast.error('Админ эрх шаардлагатай');
        setCurrentSection('home');
        return null;
      }
      return <AdminCourseManagement accessToken={accessToken} onBack={() => setCurrentSection('admin')} />;
    }

    if (currentSection === 'course-detail' && selectedCourseId) {
      return (
        <CourseDetailPage
          courseId={selectedCourseId}
          accessToken={accessToken || undefined}
          onBack={() => setCurrentSection('courses')}
          onPurchase={handlePurchase}
        />
      );
    }

    if (currentSection === 'my-courses') {
      if (!accessToken) {
        setIsAuthModalOpen(true);
        setCurrentSection('home');
        return null;
      }
      return (
        <MyCoursesPage
          accessToken={accessToken}
          onBack={() => setCurrentSection('profile')}
          onSelectCourse={(courseId) => {
            setSelectedCourseId(courseId);
            setCurrentSection('course-detail');
          }}
        />
      );
    }

    if (currentSection === 'courses') {
      return (
        <CoursesPage 
          onPurchase={handlePurchase} 
          onSelectCourse={(courseId) => {
            setSelectedCourseId(courseId);
            setCurrentSection('course-detail');
          }}
          accessToken={accessToken || undefined} 
        />
      );
    }

    if (currentSection === 'profile') {
      if (!accessToken) {
        setIsAuthModalOpen(true);
        setCurrentSection('home');
        return null;
      }
      return <ProfilePage accessToken={accessToken} onNavigate={setCurrentSection} />;
    }

    if (currentSection === 'pricing') {
      return <FeedbackForm />;
    }

    if (currentSection === 'contact') {
      return <ContactSection />;
    }

    // Home section
    return (
      <>
        <HeroSection onGetStarted={() => setIsAuthModalOpen(true)} />
        
        {/* Featured Courses Section */}
        <div className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl text-gray-900 mb-4">Онцлох сургалтууд</h2>
              <p className="text-xl text-gray-600">
               Та өөрт тохирсон сургалтаа сонгоорой
              </p>
            </div>

            {!initialized ? (
              <div className="text-center py-12">
                <div className="text-xl text-gray-600">Уншиж байна...</div>
              </div>
            ) : featuredCourses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-xl text-gray-600">Хичээл байхгүй байна</div>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
                {featuredCourses.map((course) => (
                  <div 
                    key={course.id} 
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      setCurrentSection('course-detail');
                    }}
                    className="cursor-pointer"
                  >
                    <CourseCard
                      course={course}
                      onPurchase={handlePurchase}
                      isPurchased={purchasedCourseIds.includes(course.id)}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <button
                onClick={() => setCurrentSection('courses')}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Бүх хичээл үзэх
              </button>
            </div>
          </div>
        </div>

        <ContactSection />
        <FeedbackForm />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Toaster position="top-right" richColors />
      
      <Navbar
        onAuthClick={() => setIsAuthModalOpen(true)}
        onNavigate={setCurrentSection}
        isAuthenticated={!!accessToken}
        isAdmin={isAdmin}
        onLogout={handleLogout}
      />

      {renderContent()}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {selectedCourse && (
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => {
            setIsPurchaseModalOpen(false);
            setSelectedCourse(null);
          }}
          course={selectedCourse}
          accessToken={accessToken || ''}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl mb-4">Mindly</h3>
              <p className="text-gray-400">
                Орчин үеийн онлайн сургалтын платформ
              </p>
            </div>
            <div>
              <h4 className="mb-4">Холбоосууд</h4>
              <div className="space-y-2 text-gray-400">
                <div className="hover:text-white cursor-pointer transition" onClick={() => setCurrentSection('home')}>Нүүр</div>
                <div className="hover:text-white cursor-pointer transition" onClick={() => setCurrentSection('courses')}>Хичээлүүд</div>
                <div className="hover:text-white cursor-pointer transition" onClick={() => setCurrentSection('contact')}>Холбоо барих</div>
              </div>
            </div>
            <div>
              <h4 className="mb-4">Дэмжлэг</h4>
              <div className="space-y-2 text-gray-400">
                <div className="hover:text-white cursor-pointer transition">Тусламж</div>
                <div className="hover:text-white cursor-pointer transition">FAQ</div>
                <div className="hover:text-white cursor-pointer transition">Нөхцөл</div>
                <div className="hover:text-white cursor-pointer transition">Нууцлал</div>
              </div>
            </div>
            <div>
              <h4 className="mb-4">Холбогдох</h4>
              <div className="space-y-2 text-gray-400">
                {/* <div>info@edulearn.mn</div> */}
                <div>+976 94651282</div>
                <div>Улаанбаатар, Монгол Улс</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Mindly. Бүх эрх хуулиар хамгаалагдсан.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}