import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import Master from '../components/layout/Master';
import Section from '../components/section/Section';

interface Purchase {
  id: number;
  quantity: number;
  total_amount: string;
  status: string;
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

const PaymentSuccess: React.FC = () => {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchPurchase();
  }, [purchaseId, isAuthenticated]);

  const fetchPurchase = async () => {
    try {
      const response = await api.get(`/purchases/${purchaseId}`);
      const data = response.data.purchase || response.data;
      setPurchase(data);
    } catch (error) {
      navigate('/');
    } finally {
      setLoading(false);
    }
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
            <Link 
              to="/" 
              style={{ color: 'white' }} 
              className="inline-block mt-4 bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Nazad na pocetnu
            </Link>
          </div>
        </Section>
      </Master>
    );
  }

  return (
    <Master>
      <Section className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            {/* Success Icon */}
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Placanje uspesno!</h1>
            <p className="text-gray-600 text-lg mb-6">
              Hvala vam na kupovini. Vasa karta je spremna!
            </p>

            {/* Order Details */}
            <div className="bg-gray-50 rounded-xl p-6 text-left mb-6">
              <h2 className="font-semibold text-gray-800 mb-4 text-center">Detalji narudzbine</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Broj narudzbine:</span>
                  <span className="font-semibold text-gray-800">#{purchase.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Dogadjaj:</span>
                  <span className="font-semibold text-gray-800">{purchase.event.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Datum:</span>
                  <span className="text-gray-800">{formatDate(purchase.event.start_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lokacija:</span>
                  <span className="text-gray-800">
                    {purchase.event.venue}
                    {purchase.event.city ? `, ${purchase.event.city}` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tip karte:</span>
                  <span className="text-gray-800">{purchase.ticket_type.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kolicina:</span>
                  <span className="text-gray-800">
                    {purchase.quantity} {purchase.quantity === 1 ? 'karta' : 'karte'}
                  </span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-800">Ukupno placeno:</span>
                    <span className="font-bold text-green-600 text-xl">
                      {parseFloat(purchase.total_amount).toLocaleString('sr-RS')} RSD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-blue-50 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-blue-800 mb-3">Sta dalje?</h3>
              <ul className="text-left space-y-2 text-blue-700">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Proverite vas email - poslali smo vam potvrdu i kartu</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span>Kartu mozete pronaci i u "Moj nalog" sekciji</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <span>Na dan dogadjaja pokazite QR kod na ulazu</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/account"
                style={{ color: 'white' }}
                className="flex-1 bg-blue-600 py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition text-center"
              >
                Idi na Moj nalog
              </Link>
              <Link
                to="/"
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
              >
                Nazad na pocetnu
              </Link>
            </div>
          </div>

          {/* Support Note */}
          <p className="text-center text-gray-500 text-sm mt-6">
            Imate pitanja? <Link to="/contact" className="text-blue-600 hover:underline">Kontaktirajte nas</Link>
          </p>
        </div>
      </Section>
    </Master>
  );
};

export default PaymentSuccess;