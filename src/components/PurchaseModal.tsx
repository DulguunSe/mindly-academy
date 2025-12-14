import { useState } from 'react';
import { X, CreditCard, Building2, Smartphone, CheckCircle } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: string;
    title: string;
    price: number;
    teacher: string;
  };
  accessToken: string;
  onSuccess: () => void;
}

export function PurchaseModal({ isOpen, onClose, course, accessToken, onSuccess }: PurchaseModalProps) {
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [loading, setLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<any>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [userPhone, setUserPhone] = useState('');

  if (!isOpen) return null;

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Promo code оруулна уу');
      return;
    }

    setValidatingPromo(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/validate-promo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          code: promoCode,
          courseId: course.id
        })
      });

      const data = await response.json();

      if (data.valid) {
        setPromoApplied(data);
        toast.success(`Promo code амжилттай! ${data.promo.discountPercent}% хөнгөлөлт`);
      } else {
        toast.error(data.error || 'Promo code буруу байна');
        setPromoApplied(null);
      }
    } catch (error) {
      console.error('Error validating promo:', error);
      toast.error('Promo code шалгахад алдаа гарлаа');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-80ca54e2/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          courseId: course.id,
          paymentMethod,
          promoCode: promoApplied?.promo?.code || null
        })
      });

      if (response.ok) {
        setOrderCreated(true);
        toast.success('Захиалга амжилттай үүсгэгдлээ!');
        onSuccess();
        setTimeout(() => {
          setOrderCreated(false);
          onClose();
        }, 3000);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Захиалга үүсгэх амжилтгүй боллоо');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        {!orderCreated ? (
          <>
            <h2 className="text-3xl text-gray-900 mb-2">Хичээл худалдаж авах</h2>
            <p className="text-gray-600 mb-6">Төлбөрийн мэдээллээ баталгаажуулна уу</p>

            {/* Course Info */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
              <h3 className="text-xl text-gray-900 mb-2">{course.title}</h3>
              <p className="text-gray-700 mb-4">Багш: {course.teacher}</p>
              <div className="space-y-2">
                {promoApplied ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl text-gray-400 line-through">{course.price.toLocaleString()}₮</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                        -{promoApplied.promo.discountPercent}%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl text-green-600">{promoApplied.finalPrice.toLocaleString()}₮</span>
                    </div>
                    {promoApplied.promo.description && (
                      <p className="text-sm text-gray-600">{promoApplied.promo.description}</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl text-blue-600">{course.price.toLocaleString()}₮</span>
                  </div>
                )}
              </div>
            </div>

            {/* Promo Code */}
            <div className="mb-6">
              <label className="block text-sm text-gray-700 mb-2">Promo код</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="PROMO2024"
                  disabled={!!promoApplied}
                />
                {!promoApplied ? (
                  <button
                    type="button"
                    onClick={handleValidatePromo}
                    disabled={validatingPromo || !promoCode.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {validatingPromo ? 'Шалгаж байна...' : 'Шалгах'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPromoApplied(null);
                      setPromoCode('');
                    }}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                  >
                    Цуцлах
                  </button>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm text-gray-700 mb-3">Төлбөрийн хэлбэр сонгох</label>
              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`w-full p-4 rounded-lg border-2 transition flex items-center gap-4 ${
                    paymentMethod === 'bank_transfer'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    paymentMethod === 'bank_transfer' ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <Building2 className={`w-6 h-6 ${
                      paymentMethod === 'bank_transfer' ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-gray-900">Дансаар шилжүүлэг</div>
                    <div className="text-sm text-gray-600">Банкны данс руу шилжүүлэг хийх</div>
                  </div>
                  {paymentMethod === 'bank_transfer' && (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  )}
                </button>

                {/* <button
                  onClick={() => setPaymentMethod('qpay')}
                  className={`w-full p-4 rounded-lg border-2 transition flex items-center gap-4 ${
                    paymentMethod === 'qpay'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    paymentMethod === 'qpay' ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <Smartphone className={`w-6 h-6 ${
                      paymentMethod === 'qpay' ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-gray-900">QPay</div>
                    <div className="text-sm text-gray-600">QPay апп ашиглан төлөх</div>
                  </div>
                  {paymentMethod === 'qpay' && (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  )}
                </button> */}

                {/* <button
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full p-4 rounded-lg border-2 transition flex items-center gap-4 ${
                    paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    paymentMethod === 'card' ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    <CreditCard className={`w-6 h-6 ${
                      paymentMethod === 'card' ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-gray-900">Картаар төлөх</div>
                    <div className="text-sm text-gray-600">Кредит/Дебит карт</div>
                  </div>
                  {paymentMethod === 'card' && (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  )}
                </button> */}
              </div>
            </div>

            {/* Payment Instructions */}
            {paymentMethod === 'bank_transfer' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h4 className="text-gray-900 mb-2">Шилжүүлэг хийх заавар:</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>Банк: Хаан банк</p>
                  <p>Дансны нэр: Дөлгөөн</p>
                  <p>Дансны дугаар: 5406163083</p>
                  <p className="mt-2 font-medium text-red-700">
                    ⚠️ Гүйлгээний утга дээр таны бүртгэлтэй утасны дугаарыг заавал бичнэ үү!
                  </p>
                  <p className="text-yellow-800">
                    💡 Шилжүүлэг хийгээд заавал захиалга үүсгэх товч дээр дарна уу.
                  </p>
                </div>
              </div>
            )}

            {/* Terms */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <input type="checkbox" className="mt-1" required />
                <span>
                  Би <span className="text-blue-600 hover:underline cursor-pointer">үйлчилгээний нөхцөл</span> болон{' '}
                  <span className="text-blue-600 hover:underline cursor-pointer">буцаалтын бодлого</span>-той танилцаж зөвшөөрч байна.
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Цуцлах
              </button>
              <button
                onClick={handlePurchase}
                disabled={loading}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Уншиж байна...' : 'Захиалга үүсгэх'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl text-gray-900 mb-4">Захиалга амжилттай үүсгэгдлээ!</h3>
            <p className="text-gray-600 mb-4">
              Таны захиалга амжилттай бүртгэгдлээ. Төлбөр шилжүүлсний дараа админ баталгаажуулна.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-700">
                <strong>Дараагийн алхам:</strong> Банкны дансаар шилжүүлэг хийнэ үү. Төлбөр баталгаажсаны дараа та хичээлд нэвтрэх боломжтой болно.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
