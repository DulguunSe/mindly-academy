import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    feedback: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          ...formData,
          rating
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: '', email: '', feedback: '' });
        setRating(0);
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl text-gray-900 mb-4">Сэтгэгдэл үлдээх</h2>
          <p className="text-xl text-gray-600">
            Таны санал бодол бидэнд чухал
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {submitted && (
            <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-center">
              <div className="text-2xl mb-2">✓</div>
              <div>Баярлалаа! Таны сэтгэгдэл амжилттай илгээгдлээ.</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-gray-700 mb-3 text-center">
                Үнэлгээ өгөх
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoverRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-gray-600 mt-2">
                  Та {rating} од өглөө
                </p>
              )}
            </div>

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
              <label className="block text-sm text-gray-700 mb-2">Сэтгэгдэл</label>
              <textarea
                value={formData.feedback}
                onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                placeholder="Та бидний сургалтын талаар юу бодож байна? Санал, хүсэлт байвал бичнэ үү..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || rating === 0}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              {loading ? 'Илгээж байна...' : 'Илгээх'}
            </button>
          </form>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-4xl mb-2">⭐</div>
            <div className="text-2xl text-gray-900 mb-1">4.8/5</div>
            <div className="text-sm text-gray-600">Дундаж үнэлгээ</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-4xl mb-2">💬</div>
            <div className="text-2xl text-gray-900 mb-1">100+</div>
            <div className="text-sm text-gray-600">Сэтгэгдэл</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="text-4xl mb-2">😊</div>
            <div className="text-2xl text-gray-900 mb-1">98%</div>
            <div className="text-sm text-gray-600">Сэтгэл ханамж</div>
          </div>
        </div>
      </div>
    </div>
  );
}
