import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../hooks/useAlert';
import { api } from '../services/api';
import Master from '../components/layout/Master';
import Section from '../components/section/Section';

interface Purchase {
  id: number;
  user_id: number;
  event_id: number;
  ticket_type_id: number;
  quantity: number;
  unit_price: string;
  total_amount: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  reserved_until: string;
  event: {
    id: number;
    title: string;
    venue: string;
    city: string | null;
    start_at: string;
  };
  ticket_type: {
    id: number;
    name: string;
    category: string | null;
  };
}

const Checkout: React.FC = () => {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showAlert } = useAlert();

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Payment form state
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchPurchase();
  }, [purchaseId, isAuthenticated]);

  // Countdown timer
  useEffect(() => {
    if (!purchase?.reserved_until) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(purchase.reserved_until).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diff);

      if (diff === 0) {
        showAlert({
          type: 'error',
          text: 'Vreme za rezervaciju je isteklo.',
          show: true,
        });
        navigate('/');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [purchase?.reserved_until]);

  const fetchPurchase = async () => {
    try {
      const response = await api.get(`/purchases/${purchaseId}`);
      setPurchase(response.data);

      if (response.data.status !== 'pending') {
        showAlert({
          type: 'warning',
          text: 'Ova narudzbina je vec obradjena.',
          show: true,
        });
        navigate('/account');
      }
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: 'Greska pri ucitavanju narudzbine.',
        show: true,
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setPaymentData(prev => ({ ...prev, [name]: formatted.slice(0, 19) }));
      return;
    }

    // Format expiry date
    if (name === 'expiryDate') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length >= 2) {
        setPaymentData(prev => ({ ...prev, [name]: cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) }));
      } else {
        setPaymentData(prev => ({ ...prev, [name]: cleaned }));
      }
      return;
    }

    // CVV - only numbers, max 4
    if (name === 'cvv') {
      setPaymentData(prev => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 4) }));
      return;
    }

    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const cardNum = paymentData.cardNumber.replace(/\s/g, '');
    if (cardNum.length < 16) {
      showAlert({ type: 'error', text: 'Unesite ispravan broj kartice.', show: true });
      return false;
    }
    if (paymentData.cardName.trim().length < 3) {
      showAlert({ type: 'error', text: 'Unesite ime na kartici.', show: true });
      return false;
    }
    if (paymentData.expiryDate.length < 5) {
      showAlert({ type: 'error', text: 'Unesite datum isteka kartice.', show: true });
      return false;
    }
    if (paymentData.cvv.length < 3) {
      showAlert({ type: 'error', text: 'Unesite CVV kod.', show: true });
      return false;
    }
    return true;
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setProcessing(true);

    try {
      await api.post(`/purchases/${purchaseId}/pay`, {
        card_number: paymentData.cardNumber.replace(/\s/g, ''),
        card_name: paymentData.cardName,
        expiry_date: paymentData.expiryDate,
        cvv: paymentData.cvv,
      });

      showAlert({
        type: 'success',
        text: 'Placanje uspesno! Karte su vase.',
        show: true,
      });

      navigate(`/payment/success/${purchaseId}`);
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: error.response?.data?.message || 'Greska pri placanju. Pokusajte ponovo.',
        show: true,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Da li ste sigurni da zelite da otkazete narudzbinu?')) return;

    try {
      await api.post(`/purchases/${purchaseId}/cancel`);
      showAlert({
        type: 'info',
        text: 'Narudzbina je otkazana.',
        show: true,
      });
      navigate('/');
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: 'Greska pri otkazivanju.',
        show: true,
      });
    }
  };

  if (loading) {
    return (
      <Master>
        <Section className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Ucitavanje...</p>
          </div>
        </Section>
      </Master>
    );
  }

  if (!purchase) {
    return (
      <Master>
        <Section className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Narudzbina nije pronadjena.</p>
            <Link to="/" style={{ color: 'white' }} className="inline-block mt-4 bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Nazad na pocetnu
            </Link>
          </div>
        </Section>
      </Master>
    );
  }

  return (
    <Master>
      {/* Timer Bar */}
      <div className={`py-3 text-center text-white font-semibold ${timeLeft < 120 ? 'bg-red-600' : 'bg-orange-500'}`}>
        <div className="container mx-auto px-4 flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Vreme za placanje: {formatTime(timeLeft)}</span>
        </div>
      </div>

      <Section className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Placanje</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Podaci o kartici</h2>

              <form onSubmit={handlePayment} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Broj kartice
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cardNumber"
                      value={paymentData.cardNumber}
                      onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                      <svg className="h-6 w-auto text-gray-400" viewBox="0 0 36 24" fill="currentColor">
                        <rect width="36" height="24" rx="4" fill="#1A1F71"/>
                        <path d="M15 17.5L16.5 7H19L17.5 17.5H15Z" fill="white"/>
                        <path d="M23.5 7.2C23 7 22.2 6.8 21.2 6.8C18.7 6.8 17 8.2 17 10.1C17 11.5 18.2 12.3 19.1 12.8C20 13.3 20.3 13.6 20.3 14.1C20.3 14.8 19.5 15.1 18.8 15.1C17.8 15.1 17.2 14.9 16.4 14.5L16 14.3L15.6 17C16.3 17.3 17.5 17.5 18.7 17.5C21.4 17.5 23 16.2 23 14.1C23 11.6 19.6 11.4 19.6 10.1C19.6 9.6 20 9.1 21.1 9.1C21.9 9.1 22.5 9.3 23 9.5L23.3 9.6L23.5 7.2Z" fill="white"/>
                      </svg>
                      <svg className="h-6 w-auto text-gray-400" viewBox="0 0 36 24" fill="currentColor">
                        <rect width="36" height="24" rx="4" fill="#EB001B" fillOpacity="0.1"/>
                        <circle cx="14" cy="12" r="7" fill="#EB001B"/>
                        <circle cx="22" cy="12" r="7" fill="#F79E1B"/>
                        <path d="M18 7.5C19.5 8.7 20.5 10.2 20.5 12C20.5 13.8 19.5 15.3 18 16.5C16.5 15.3 15.5 13.8 15.5 12C15.5 10.2 16.5 8.7 18 7.5Z" fill="#FF5F00"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ime na kartici
                  </label>
                  <input
                    type="text"
                    name="cardName"
                    value={paymentData.cardName}
                    onChange={handleInputChange}
                    placeholder="MARKO MARKOVIC"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition uppercase"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Datum isteka
                    </label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={paymentData.expiryDate}
                      onChange={handleInputChange}
                      placeholder="MM/YY"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="password"
                      name="cvv"
                      value={paymentData.cvv}
                      onChange={handleInputChange}
                      placeholder="***"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={processing || timeLeft === 0}
                    style={{ color: 'white' }}
                    className="w-full bg-green-600 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Obrada...
                      </span>
                    ) : (
                      `Plati ${parseFloat(purchase.total_amount).toLocaleString('sr-RS')} RSD`
                    )}
                  </button>
                </div>
              </form>

              <button
                onClick={handleCancel}
                className="w-full mt-4 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
              >
                Otkazi narudzbinu
              </button>

              {/* Security Notice */}
              <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Vasi podaci su zasticeni SSL enkripcijom</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Pregled narudzbine</h2>

              {/* Event Info */}
              <div className="border-b pb-4 mb-4">
                <h3 className="font-semibold text-gray-800 text-lg">{purchase.event.title}</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(purchase.event.start_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span>{purchase.event.venue}{purchase.event.city ? `, ${purchase.event.city}` : ''}</span>
                  </div>
                </div>
              </div>

              {/* Ticket Info */}
              <div className="border-b pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">{purchase.ticket_type.name}</p>
                    {purchase.ticket_type.category && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {purchase.ticket_type.category}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">x {purchase.quantity}</p>
                </div>
                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-500">Cena po karti</span>
                  <span className="text-gray-700">{parseFloat(purchase.unit_price).toLocaleString('sr-RS')} RSD</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold text-gray-800">Ukupno za placanje</span>
                <span className="font-bold text-blue-600 text-2xl">
                  {parseFloat(purchase.total_amount).toLocaleString('sr-RS')} RSD
                </span>
              </div>
              <p className="text-xs text-gray-500 text-right mt-1">Ukljucen PDV</p>

              {/* What You Get */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-800 mb-3">Sta dobijate</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Elektronska karta na email
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    QR kod za ulaz
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Pristup u "Moj nalog"
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </Master>
  );
};

export default Checkout;