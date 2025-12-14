import { Check } from 'lucide-react';

interface PricingSectionProps {
  onGetStarted: () => void;
}

export function PricingSection({ onGetStarted }: PricingSectionProps) {
  const plans = [
    {
      name: 'Үндсэн',
      price: '0',
      period: 'сар',
      description: 'Эхлэн суралцахад тохиромжтой',
      features: [
        '5 хичээл үзэх эрх',
        'Суурь материалууд',
        'Community дэмжлэг',
        'Сертификат (хязгаарлалттай)'
      ],
      color: 'blue',
      cta: 'Эхлэх'
    },
    {
      name: 'Стандарт',
      price: '49,900',
      period: 'сар',
      description: 'Идэвхтэй сурагчдад',
      features: [
        '30 хичээл үзэх эрх',
        'Бүх сургалтын материал',
        'Багшаас шууд дэмжлэг',
        'Бүрэн сертификат',
        'Хичээлийн материал татах'
      ],
      color: 'purple',
      popular: true,
      cta: 'Авах'
    },
    {
      name: 'Премиум',
      price: '99,900',
      period: 'сар',
      description: 'Бүрэн хэмжээний туршлага',
      features: [
        'Хязгааргүй хичээл',
        'Бүх сургалтын материал',
        'VIP дэмжлэг',
        'Бүх сертификат',
        '1-1 зөвлөгөө',
        'Тусгай вебинар',
        'Хөнгөлөлт хөтөлбөр'
      ],
      color: 'indigo',
      cta: 'Авах'
    }
  ];

  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl text-gray-900 mb-4">Төлбөрийн төлөвлөгөө</h2>
          <p className="text-xl text-gray-600">
            Өөрт тохирох төлөвлөгөөг сонгоорой
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
              } hover:shadow-xl transition-all duration-300`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm">
                  Хамгийн их авдаг
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl text-gray-900">{plan.price}</span>
                  {plan.price !== '0' && <span className="text-xl text-gray-600">₮</span>}
                </div>
                <div className="text-gray-600 text-sm">/{plan.period}</div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start gap-3">
                    <div className={`w-5 h-5 bg-${plan.color}-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Check className={`w-3 h-3 text-${plan.color}-600`} />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onGetStarted}
                className={`w-full py-3 rounded-lg transition ${
                  plan.popular
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl text-gray-900 mb-4">Хөнгөлөлтийн нөхцөл</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Оюутнуудад 20% хөнгөлөлт</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Багаар бүртгүүлбэл 15% хөнгөлөлт (5+ хүн)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Жилийн төлбөр төлвөл 2 сар үнэгүй</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Анхны 100 хэрэглэгчид тусгай урамшуулал</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎁</div>
                <h4 className="text-xl text-gray-900 mb-2">7 хоног үнэгүй туршаарай</h4>
                <p className="text-gray-600 mb-4">Ямар ч төлбөргүй, картын мэдээлэл шаардахгүй</p>
                <button
                  onClick={onGetStarted}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Туршиж үзэх
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
