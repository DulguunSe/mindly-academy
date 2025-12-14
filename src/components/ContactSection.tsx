import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

export function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', message: '' });
        toast.success('Мессеж амжилттай илгээгдлээ!');
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        toast.error('Мессеж илгээхэд алдаа гарлаа');
      }
    } catch (error) {
      console.error('Error submitting contact message:', error);
      toast.error('Алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl text-gray-900 mb-4">Холбоо барих</h2>
          <p className="text-xl text-gray-600">
            Асуулт байвал бидэнтэй холбогдоорой
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl text-gray-900 mb-6">Холбоо барих мэдээлэл</h3>
              <div className="space-y-4">
                {/* <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">И-мэйл</div>
                    <div className="text-gray-900">info@edulearn.mn</div>
                  </div>
                </div> */}

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Утас</div>
                    <div className="text-gray-900">+976 94651282</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Хаяг</div>
                    <div className="text-gray-900">Улаанбаатар хот, Монгол Улс</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
              <h4 className="text-2xl mb-4">Бидний тухай</h4>
              <p className="text-blue-100">
                Mindly academy нь орчин үеийн онлайн сургалтын платформ юм. 
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl text-gray-900 mb-6">Мессеж илгээх</h3>
            
            {submitted && (
              <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
                Таны мессеж амжилттай илгээгдлээ!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Нэр</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Таны нэр"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">И-мэйл</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Мессеж</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                  placeholder="Таны мессеж..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
                {loading ? 'Илгээж байна...' : 'Илгээх'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
