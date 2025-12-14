import { useState } from 'react';
import { X } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (accessToken: string) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login with email or phone
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ 
            identifier, 
            password 
          })
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Нэвтрэх нэр эсвэл нууц үг буруу байна');
          setLoading(false);
          return;
        }

        if (data.accessToken) {
          onSuccess(data.accessToken);
          onClose();
        }
      } else {
        // Sign up
        if (!name) {
          setError('Нэрээ оруулна уу');
          setLoading(false);
          return;
        }

        if (!phone) {
          setError('Утасны дугаараа оруулна уу');
          setLoading(false);
          return;
        }

        // Validate phone number (must be 8 digits)
        const phoneRegex = /^\d{8}$/;
        if (!phoneRegex.test(phone)) {
          setError('Утасны дугаар 8 оронтой тоо байх ёстой');
          setLoading(false);
          return;
        }

        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ email, password, name, phone })
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Бүртгэл амжилтгүй боллоо');
          setLoading(false);
          return;
        }

        // Auto login after signup
        const loginResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ 
            identifier: email, 
            password 
          })
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok || !loginData.accessToken) {
          setError('Бүртгэл амжилттай болсон боловч нэвтрэх амжилтгүй боллоо. Дахин оролдоно уу.');
          setLoading(false);
          return;
        }

        onSuccess(loginData.accessToken);
        onClose();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-3xl text-gray-900 mb-2">
          {isLogin ? 'Нэвтрэх' : 'Бүртгүүлэх'}
        </h2>
        <p className="text-gray-600 mb-6">
          {isLogin ? 'Өөрийн бүртгэлээр нэвтэрнэ үү' : 'Шинэ бүртгэл үүсгэх'}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Нэр</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Таны нэр"
                  required={!isLogin}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Утасны дугаар</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="99112233"
                  required={!isLogin}
                />
              </div>
            </>
          )}

          {isLogin ? (
            <div>
              <label className="block text-sm text-gray-700 mb-2">И-мэйл эсвэл утасны дугаар</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com эсвэл 99112233"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm text-gray-700 mb-2">И-мэйл</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-700 mb-2">Нууц үг</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-3 rounded-lg transition ${
                isLogin
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Нэвтрэх
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-3 rounded-lg transition ${
                !isLogin
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Бүртгүүлэх
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Уншиж байна...' : isLogin ? 'Нэвтрэх' : 'Бүртгүүлэх'}
          </button>
        </form>
      </div>
    </div>
  );
}