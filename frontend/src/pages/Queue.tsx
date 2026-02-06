import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Master from '../components/layout/Master';
import { QueueStatus } from '../types';

const Queue: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Funkcija za proveru statusa reda
  const checkQueueStatus = async () => {
    try {
      const response = await api.get(`/events/${eventId}/queue/status`);
      setQueueStatus(response.data);
      
      // Ako korisnik može da kupi, preusmeri ga
      if (response.data.can_purchase) {
        navigate(`/events/${eventId}/tickets`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check queue status');
    } finally {
      setLoading(false);
    }
  };

  // Funkcija za ulazak u red
  const joinQueue = async () => {
    try {
      setLoading(true);
      await api.put(`/events/${eventId}/queue/join`);
      await checkQueueStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join queue');
      setLoading(false);
    }
  };

  // Proveri status na učitavanju
  useEffect(() => {
    if (user) {
      checkQueueStatus();
    }
  }, [eventId, user]);

  // Polling - proveri status svakih 10 sekundi
  useEffect(() => {
    if (!queueStatus?.in_queue) return;

    const interval = setInterval(() => {
      checkQueueStatus();
    }, 10000); // 10 sekundi

    return () => clearInterval(interval);
  }, [queueStatus]);

  if (loading && !queueStatus) {
    return (
      <Master>
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-xl">Učitavanje...</div>
        </div>
      </Master>
    );
  }

  return (
    <Master>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Red čekanja
              </h1>
              <p className="text-gray-600">
                {queueStatus?.in_queue 
                  ? 'You are in the waiting queue' 
                  : 'Join the queue to purchase tickets'}
              </p>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Nije u redu - prikaži dugme za ulazak */}
            {!queueStatus?.in_queue && (
              <div className="text-center">
                <button
                  onClick={joinQueue}
                  disabled={loading}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {loading ? 'Ulazak u red čekanja...' : 'Pridružite se redu čekanja'}
                </button>
              </div>
            )}

            {/* U redu - prikaži progress */}
            {queueStatus?.in_queue && (
              <div>
                {/* Pozicija u redu */}
                <div className="bg-blue-50 rounded-lg p-6 mb-6">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-blue-600 mb-2">
                      {queueStatus.position || '?'}
                    </div>
                    <div className="text-gray-600">
                      Vaša pozicija u redu čekanja
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      Ukupan broj korisnika u redu čekanja: {queueStatus.total_in_queue || '?'}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {queueStatus.position && queueStatus.total_in_queue && (
                  <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                        style={{
                          width: `${((queueStatus.total_in_queue - queueStatus.position) / queueStatus.total_in_queue) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Predviđeno vreme čekanja */}
                {queueStatus.estimated_wait_minutes && (
                  <div className="text-center text-gray-600">
                    <p>Predviđeno vreme čekanja u redu:</p>
                    <p className="text-2xl font-semibold text-gray-800">
                      ~{queueStatus.estimated_wait_minutes} minuta
                    </p>
                  </div>
                )}

                {/* Info */}
                <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    💡 <strong>Tip:</strong> Ne napuštajte ovu stranicu. Bićete automatski prebačeni na stranicu za biranje karata kada dođe Vaš red.
                  </p>
                </div>

                {/* Izađi iz reda čekanja button */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => navigate(`/events/${eventId}`)}
                    className="text-gray-600 hover:text-gray-800 underline"
                  >
                    Izađite iz reda čekanja i vratite se nazad
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Master>
  );
};

export default Queue;