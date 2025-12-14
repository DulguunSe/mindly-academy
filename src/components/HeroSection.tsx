import { useState, useEffect } from 'react';
import { ArrowRight, PlayCircle, Star, TrendingUp, Globe, Clock, CheckCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface HeroSectionProps {
  onGetStarted: () => void;
}

interface Stats {
  totalCourses: number;
  totalInstructors: number;
  totalStudents: number;
  enrolledStudents: number;
  activeStudents: number;
  averageRating: number;
  satisfactionRate: number;
  partnerCompanies: number;
}

export function HeroSection({ onGetStarted }: HeroSectionProps) {
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    totalInstructors: 0,
    totalStudents: 0,
    enrolledStudents: 0,
    activeStudents: 0,
    averageRating: 5.0,
    satisfactionRate: 98,
    partnerCompanies: 15
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/stats`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 min-h-[90vh] flex items-center">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-200 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              <span className="text-white text-sm">Монголын шилдэг онлайн сургалтын платформ</span>
            </div>

            <h1 className="text-5xl lg:text-6xl text-white leading-tight">

              Ирээдүйгээ эндээс {' '}
              {/* Амжилт руу хүрэх */}
              <span className="bg-gradient-to-r from-yellow-300 to-pink-300 text-transparent bg-clip-text">
                эхлүүл
              </span>
            </h1>

            <p className="text-xl text-white/90 leading-relaxed">
              Мэргэжлийн багш нараас суралцаж, ирээдүйн хамгийн эрэлттэй ур чадваруудаа эзэмшээрэй. Та өөрийн хүссэн цагт, хүссэн газраасаа суралцах боломжтой.
            </p>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={onGetStarted}
                className="px-8 py-4 bg-white text-purple-600 rounded-xl hover:shadow-2xl transition-all transform hover:scale-105 flex items-center gap-2 group"
              >
                <span>Эхлэх</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              {/* <button className="px-8 py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition backdrop-blur-sm border border-white/30 flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Танилцуулга үзэх
              </button> */}
            </div>

            {/* Features Grid */}
            {/* <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-3 border border-white/30">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <div className="text-2xl text-white">
                  {loading ? '...' : `${stats.totalCourses}+`}
                </div>
                <div className="text-sm text-white/80">Хичээл</div>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-3 border border-white/30">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <div className="text-2xl text-white">
                  {loading ? '...' : `${stats.totalStudents.toLocaleString()}+`}
                </div>
                <div className="text-sm text-white/80">Суралцагч</div>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-3 border border-white/30">
                  <Star className="w-7 h-7 text-white" />
                </div>
                <div className="text-2xl text-white">
                  {loading ? '...' : `${stats.averageRating}/5`}
                </div>
                <div className="text-sm text-white/80">Үнэлгээ</div>
              </div>
            </div> */}
          </div>

          {/* Right Content */}
          <div className="relative lg:pl-8">
            {/* Main Image Card */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
              <img
                src="https://i.pinimg.com/1200x/41/2e/a7/412ea792b6963690a4a9dce67b73f216.jpg"
                alt="Online Learning"
                className="w-full h-auto"
              />
              
              {/* Floating Stats Cards */}
              <div className="absolute top-6 -left-6 bg-white p-4 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Идэвхтэй суралцагч</div>
                    <div className="text-xl text-gray-900">210
                      {/* {loading ? '...' : stats.activeStudents.toLocaleString()} */}
                    </div>
                  </div>
                </div>
              </div>
{/* 
              <div className="absolute bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Дундаж хугацаа</div>
                    <div className="text-xl text-gray-900">8 долоо хоног</div>
                  </div>
                </div>
              </div> */}
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-300 rounded-full opacity-50 blur-2xl"></div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-pink-300 rounded-full opacity-50 blur-2xl"></div>
          </div>
        </div>

        {/* Bottom Trust Badges */}
        {/* <div className="mt-20 pt-12 border-t border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl text-white mb-2">
                {loading ? '...' : `${stats.satisfactionRate}%`}
              </div>
              <div className="text-sm text-white/80">Сэтгэл ханамж</div>
            </div>
            <div>
              <div className="text-3xl text-white mb-2">24/7</div>
              <div className="text-sm text-white/80">Дэмжлэг</div>
            </div>
            <div>
              <div className="text-3xl text-white mb-2">
                {loading ? '...' : `${stats.totalInstructors}+`}
              </div>
              <div className="text-sm text-white/80">Мэргэжлийн багш</div>
            </div>
            <div>
              <div className="text-3xl text-white mb-2">
                {loading ? '...' : `${stats.partnerCompanies}+`}
              </div>
              <div className="text-sm text-white/80">Компанийн түнш</div>
            </div>
          </div>
        </div> */}
      </div>

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
