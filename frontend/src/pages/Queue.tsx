import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Master from '../components/layout/Master';

interface QueueStatus {
  in_queue: boolean;
  position: number | null;
  total_in_queue: number;
  is_admitted: boolean;
  gate_token: string | null;
  ttl_until: string | null;
}

const Queue: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [event, setEvent] = useState<any>(null);

  // Fetch event info
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/events/${eventId}`);
        setEvent(response.data);
      } catch (err) {
        console.error('Failed to fetch event');
      }
    };
    fetchEvent();
  }, [eventId]);

  // Check queue status
  const checkQueueStatus = async () => {
    try {
      const response = await api.get(`/events/${eventId}/waitlist/status`);
      const data = response.data;
      
      const isAdmitted = data.waitlist_entry?.status === 'admitted';
      const gateToken = data.waitlist_entry?.token || null;
      const ttlUntil = data.waitlist_entry?.ttl_until || null;

      setQueueStatus({
        in_queue: !!data.waitlist_entry,
        position: data.position || null,
        total_in_queue: data.queue_size || 0,
        is_admitted: isAdmitted,
        gate_token: gateToken,
        ttl_until: ttlUntil,
      });

      // If admitted, save gate_token to sessionStorage
      if (isAdmitted && gateToken) {
        sessionStorage.setItem(`gate_token_${eventId}`, gateToken);
      }

    } catch (err: any) {
      if (err.response?.status === 404) {
        setQueueStatus({
          in_queue: false,
          position: null,
          total_in_queue: 0,
          is_admitted: false,
          gate_token: null,
          ttl_until: null,
        });
      } else {
        setError(err.response?.data?.message || 'Greska pri proveri statusa');
      }
    } finally {
      setLoading(false);
    }
  };

  // Join queue
  const joinQueue = async () => {
    try {
      setLoading(true);
      setError('');
      await api.post(`/events/${eventId}/waitlist/join`);
      await checkQueueStatus();
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Already in queue, just check status
        await checkQueueStatus();
      } else {
        setError(err.response?.data?.message || 'Greska pri ulasku u red');
      }
      setLoading(false);
    }
  };

  // Go to event page to buy tickets
  const handleProceedToTickets = () => {
    navigate(`/events/${eventId}`);
  };

  // Check status on load
  useEffect(() => {
    if (user) {
      checkQueueStatus();
    }
  }, [eventId, user]);

  // Polling - check status every 5 seconds
  useEffect(() => {
    if (!queueStatus?.in_queue || queueStatus?.is_admitted) return;

    const interval = setInterval(() => {
      checkQueueStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [queueStatus?.in_queue, queueStatus?.is_admitted]);

  // Format time remaining
  const getTimeRemaining = () => {
    if (!queueStatus?.ttl_until) return null;
    const now = new Date().getTime();
    const expiry = new Date(queueStatus.ttl_until).getTime();
    const diff = Math.max(0, Math.floor((expiry - now) / 1000 / 60));
    return diff;
  };

  if (loading && !queueStatus) {
    return (
      <Master>
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-4">Ucitavanje...</p>
        </div>
      </Master>
    );
  }

  return (
    <Master>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          
          {/* Event Info */}
          {event && (
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h2 className="font-semibold text-gray-800">{event.title}</h2>
              <p className="text-sm text-gray-500">{event.venue}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Red cekanja
              </h1>
              <p className="text-gray-600">
                {queueStatus?.is_admitted 
                  ? 'Dosli ste na red! Mozete kupiti karte.' 
                  : queueStatus?.in_queue 
                    ? 'Sacekajte dok ne dodjete na red' 
                    : 'Udjite u red da biste kupili karte'}
              </p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* ADMITTED - Can buy tickets */}
            {queueStatus?.is_admitted && (
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-green-600 mb-2">Dosli ste na red!</h2>
                <p className="text-gray-600 mb-6">
                  Sada mozete izabrati i kupiti karte. Pozurite!
                </p>

                {getTimeRemaining() !== null && (
                  <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg mb-6">
                    ⏱️ Imate jos <strong>{getTimeRemaining()}</strong> minuta da zavrsete kupovinu
                  </div>
                )}

                <button
                  onClick={handleProceedToTickets}
                  style={{ color: 'white' }}
                  className="bg-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition"
                >
                  Izaberi karte →
                </button>
              </div>
            )}

            {/* IN QUEUE - Waiting */}
            {queueStatus?.in_queue && !queueStatus?.is_admitted && (
              <div>
                {/* Position */}
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-bold text-blue-600">
                          {queueStatus.position || '?'}
                        </span>
                      </div>
                    </div>
                    <div className="text-gray-600">
                      Vasa pozicija u redu
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Ukupno u redu: {queueStatus.total_in_queue || '?'}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {queueStatus.position && queueStatus.total_in_queue > 0 && (
                  <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(5, 100 - (queueStatus.position / queueStatus.total_in_queue * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Tips */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    💡 <strong>Saveti:</strong>
                  </p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Ne zatvarajte ovu stranicu</li>
                    <li>• Stranica se automatski osvezava</li>
                    <li>• Pripremite podatke za placanje</li>
                  </ul>
                </div>

                <p className="text-xs text-gray-400 text-center mt-4">
                  Automatsko osvezavanje svakih 5 sekundi...
                </p>
              </div>
            )}

            {/* NOT IN QUEUE - Join button */}
            {!queueStatus?.in_queue && (
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Udjite u red cekanja</h2>
                <p className="text-gray-600 mb-6">
                  Zbog velike potraznje, potrebno je sacekati u redu.
                </p>

                <button
                  onClick={joinQueue}
                  disabled={loading}
                  style={{ color: 'white' }}
                  className="bg-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {loading ? 'Ulazak...' : 'Udji u red cekanja'}
                </button>
              </div>
            )}

            {/* Back link */}
            <div className="mt-8 text-center">
              <Link to={`/events/${eventId}`} className="text-blue-600 hover:underline">
                ← Nazad na dogadjaj
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Master>
  );
};

export default Queue;