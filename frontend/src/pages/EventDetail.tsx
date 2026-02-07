import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../hooks/useAlert';
import { api } from '../services/api';
import Master from '../components/layout/Master';

interface TicketType {
  id: number;
  event_id: number;
  name: string;
  category: string | null;
  price: string;
  quantity_total: number;
  quantity_sold: number;
  sales_start_at: string | null;
  sales_end_at: string | null;
  is_active: boolean;
}

interface Event {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  venue: string;
  city: string | null;
  start_at: string;
  end_at: string | null;
  ticket_types: TicketType[];
}

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showAlert } = useAlert();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistEntry, setWaitlistEntry] = useState<any>(null);
  const [queueSize, setQueueSize] = useState<number | null>(null);
  const [reservation, setReservation] = useState<any>(null);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  // Re-fetch waitlist status when auth state changes (e.g. user logs in)
  useEffect(() => {
    if (isAuthenticated) {
      fetchWaitlistStatus();
    } else {
      // clear waitlist info when not authenticated
      setWaitlistEntry(null);
      setQueueSize(null);
      setReservation(null);
    }
  }, [isAuthenticated, id]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      // Backend returns a wrapped resource: { event: { ... } }
      console.log('API Response:', response.data);
      const evt = response.data?.event ?? response.data;
      setEvent(evt);
    } catch (error: any) {
      console.error('API Error:', error);
      showAlert({
        type: 'error',
        text: 'Greska pri ucitavanju dogadjaja.',
        show: true,
      });
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
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('sr-RS', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvailableQuantity = (ticketType: TicketType) => {
    return ticketType.quantity_total - ticketType.quantity_sold;
  };

  const isTicketAvailable = (ticketType: TicketType) => {
    if (!ticketType.is_active) return false;
    if (getAvailableQuantity(ticketType) <= 0) return false;

    const now = new Date();
    if (ticketType.sales_start_at && new Date(ticketType.sales_start_at) > now) return false;
    if (ticketType.sales_end_at && new Date(ticketType.sales_end_at) < now) return false;

    return true;
  };

  const anyTicketsAvailable = () => {
    if (!event || !event.ticket_types) return false;
    return event.ticket_types.some(t => isTicketAvailable(t));
  };



  const fetchWaitlistStatus = async () => {
    if (!id) return;
    setWaitlistLoading(true);
    try {
      const res = await api.get(`/events/${id}/waitlist/status`);
      const entry = res.data.waitlist_entry ?? null;
      if (entry && res.data.position) entry.position = res.data.position;
      setWaitlistEntry(entry);
      setQueueSize(res.data.queue_size ?? null);
      setReservation(res.data.reservation ?? null);
    } catch (err: any) {
      // ignore if not joined or server returns 404/401
      setWaitlistEntry(null);
      setQueueSize(null);
      setReservation(null);
    } finally {
      setWaitlistLoading(false);
    }
  };

  const joinWaitlist = async () => {
    if (!isAuthenticated) {
      showAlert({ type: 'warning', text: 'Morate biti prijavljeni da se pridruzite redu cekanja.', show: true });
      navigate('/login');
      return;
    }

    setWaitlistLoading(true);
    try {
      const res = await api.post(`/events/${id}/waitlist/join`);
      const entry = res.data.waitlist_entry ?? null;
      if (entry && res.data.position) entry.position = res.data.position;
      setWaitlistEntry(entry);
      setQueueSize(res.data.queue_size ?? null);
      setReservation(res.data.reservation ?? null);
      showAlert({ type: 'success', text: res.data.message || 'Pridruzili ste se redu cekanja.', show: true });
    } catch (err: any) {
      showAlert({ type: 'error', text: err.response?.data?.message || 'Greska pri pridruzivanju redu.', show: true });
    } finally {
      setWaitlistLoading(false);
    }
  };

  const leaveWaitlist = async () => {
    if (!isAuthenticated) {
      return;
    }

    setWaitlistLoading(true);
    try {
      const res = await api.delete(`/events/${id}/waitlist/leave`);
      setWaitlistEntry(null);
      setQueueSize(res.data.queue_size ?? null);
      showAlert({ type: 'success', text: res.data.message || 'Napustili ste red cekanja.', show: true });
    } catch (err: any) {
      showAlert({ type: 'error', text: err.response?.data?.message || 'Greska pri napustanju reda.', show: true });
    } finally {
      setWaitlistLoading(false);
    }
  };

  if (loading) {
    return (
      <Master>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Ucitavanje dogadjaja...</p>
          </div>
        </div>
      </Master>
    );
  }

  if (!event) {
    return (
      <Master>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Dogadjaj nije pronadjen.</p>
            <Link to="/" className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Nazad na pocetnu
            </Link>
          </div>
        </div>
      </Master>
    );
  }

  return (
    <Master>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-700 text-white py-16">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-blue-100 hover:text-white mb-4 transition">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Nazad na dogadjaje
          </Link>
          <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
          <div className="flex flex-wrap gap-6 text-blue-100">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDate(event.start_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatTime(event.start_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{event.venue}{event.city ? `, ${event.city}` : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2">
            {/* Description */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">O dogadjaju</h2>
              <p className="text-gray-600 whitespace-pre-line">
                {event.description || 'Nema opisa za ovaj dogadjaj.'}
              </p>
            </div>

            {/* Ticket Types - Info only (purchasing done through queue) */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Dostupne karte</h2>
              {!event.ticket_types || event.ticket_types.length === 0 ? (
                <p className="text-gray-500">Nema dostupnih karata za ovaj dogadjaj.</p>
              ) : (
                <div className="space-y-3">
                  {event.ticket_types.map((ticketType) => {
                    const available = getAvailableQuantity(ticketType);
                    const isAvailable = isTicketAvailable(ticketType);

                    return (
                      <div key={ticketType.id} className="border rounded-lg p-3 flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-800">{ticketType.name}</h3>
                          <p className="text-lg font-bold text-blue-600">
                            {parseFloat(ticketType.price).toLocaleString('sr-RS')} RSD
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {isAvailable ? (
                              <><span className="text-green-600 font-medium">{available}</span> dostupno</>
                            ) : (
                              <span className="text-red-600">Rasprodato</span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Order Summary - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Vasa narudzbina</h2>

              <div className="text-center py-6">
                <p className="text-gray-600 mb-4">Pristupite redu čekanja da biste kupili karte.</p>
                
                {!isAuthenticated ? (
                  <Link
                    to={`/login?event_id=${id}`}
                    className="inline-block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Uloguј se da se pridružiš redu čekanja
                  </Link>
                ) : (
                  <Link
                    to={`/events/${id}/queue`}
                    className="inline-block w-full bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition"
                  >
                    Pridružite se redu čekanja
                  </Link>
                )}
              </div>

              {/* Waitlist UI - shown only when no tickets available */}
              {!anyTicketsAvailable() && (
                <div className="mt-4 text-center">
                  <p className="text-gray-600 mb-2">Nema dostupnih karata. Pridruzite se redu cekanja.</p>
                  {waitlistEntry ? (
                    <div className="flex flex-col items-center gap-2">
                      {waitlistEntry.status === 'admitted' && reservation ? (
                        <>
                          <p className="text-sm text-gray-700">Imate rezervaciju. Istice: <span className="font-semibold">{new Date(reservation.expires_at).toLocaleString()}</span></p>
                          <div className="flex gap-2">
                            <button onClick={() => navigate(`/checkout/${reservation.purchase_id}`)} className="mt-2 bg-green-600 text-white px-4 py-2 rounded">Zavrsi kupovinu</button>
                            <button onClick={leaveWaitlist} disabled={waitlistLoading} className="mt-2 bg-red-500 text-white px-4 py-2 rounded">Napusti red</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-700">Vasa pozicija u redu: <span className="font-semibold">{waitlistEntry.position ?? '—'}</span></p>
                          <button onClick={leaveWaitlist} disabled={waitlistLoading} className="mt-2 bg-red-500 text-white px-4 py-2 rounded">Napusti red</button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <button onClick={joinWaitlist} disabled={waitlistLoading} className="mt-2 bg-yellow-500 text-white px-4 py-2 rounded">Pridruzi se redu cekanja</button>
                      {queueSize !== null && <p className="text-xs text-gray-500">Ukupno u redu: {queueSize}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Event Info Summary */}
              <div className="mt-6 pt-6 border-t">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-gray-500">Datum</p>
                      <p className="text-gray-800 font-medium">{formatDate(event.start_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-gray-500">Vreme</p>
                      <p className="text-gray-800 font-medium">{formatTime(event.start_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-gray-500">Lokacija</p>
                      <p className="text-gray-800 font-medium">{event.venue}</p>
                      {event.city && <p className="text-gray-600">{event.city}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Master>
  );
};

export default EventDetail;