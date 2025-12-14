import { Menu, X, GraduationCap } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  onAuthClick: () => void;
  onNavigate: (section: string) => void;
  isAuthenticated: boolean;
  isAdmin?: boolean;
  onLogout: () => void;
}

export function Navbar({ onAuthClick, onNavigate, isAuthenticated, isAdmin, onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
            <GraduationCap className="w-8 h-8 text-blue-600" />
            <span className="text-xl text-blue-600">Mindly</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => onNavigate('home')} className="text-gray-700 hover:text-blue-600 transition">
              Нүүр
            </button>
            <button onClick={() => onNavigate('courses')} className="text-gray-700 hover:text-blue-600 transition">
              Хичээлүүд
            </button>
            <button onClick={() => onNavigate('contact')} className="text-gray-700 hover:text-blue-600 transition">
              Холбоо барих
            </button>
            {isAuthenticated ? (
              <>
                <button onClick={() => onNavigate('profile')} className="text-gray-700 hover:text-blue-600 transition">
                  Профайл
                </button>
                <button onClick={() => onNavigate('my-courses')} className="text-gray-700 hover:text-blue-600 transition">
                  Миний хичээл
                </button>
                {isAdmin && (
                  <button onClick={() => onNavigate('admin')} className="text-purple-600 hover:text-purple-700 transition">
                    Админ
                  </button>
                )}
                <button onClick={onLogout} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                  Гарах
                </button>
              </>
            ) : (
              <button onClick={onAuthClick} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Нэвтрэх / Бүртгүүлэх
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col gap-4">
              <button onClick={() => { onNavigate('home'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-blue-600 transition text-left">
                Нүүр
              </button>
              <button onClick={() => { onNavigate('courses'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-blue-600 transition text-left">
                Хичээлүүд
              </button>
              <button onClick={() => { onNavigate('contact'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-blue-600 transition text-left">
                Холбоо барих
              </button>
              {isAuthenticated ? (
                <>
                  <button onClick={() => { onNavigate('profile'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-blue-600 transition text-left">
                    Профайл
                  </button>
                  <button onClick={() => { onNavigate('my-courses'); setIsMenuOpen(false); }} className="text-gray-700 hover:text-blue-600 transition text-left">
                    Миний хичээл
                  </button>
                  {isAdmin && (
                    <button onClick={() => { onNavigate('admin'); setIsMenuOpen(false); }} className="text-purple-600 hover:text-purple-700 transition text-left">
                      Админ
                    </button>
                  )}
                  <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    Гарах
                  </button>
                </>
              ) : (
                <button onClick={() => { onAuthClick(); setIsMenuOpen(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  Нэвтрэх / Бүртгүүлэх
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
