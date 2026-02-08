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

interface TicketSelection {
  [ticketTypeId: number]: number;
}

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showAlert } = useAlert();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [waitlistEntry, setWaitlistEntry] = useState<any>(null);
  const [queueSize, setQueueSize] = useState<number | null>(null);
  const [reservation, setReservation] = useState<any>(null);
  
  // Ticket selection state
  const [selectedTickets, setSelectedTickets] = useState<TicketSelection>({});

  // Check if user is admitted (has gate_token)
  const isAdmitted = waitlistEntry?.status === 'admitted';
  const gateToken = waitlistEntry?.token || sessionStorage.getItem(`gate_token_${id}`);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWaitlistStatus();
    } else {
      setWaitlistEntry(null);
      setQueueSize(null);
      setReservation(null);
    }
  }, [isAuthenticated, id]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      const evt = response.data?.event ?? response.data;
      setEvent(evt);
    } catch (error: any) {
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
      
      // Save gate_token if admitted
      if (entry?.status === 'admitted' && entry?.token) {
        sessionStorage.setItem(`gate_token_${id}`, entry.token);
      }
    } catch (err: any) {
      setWaitlistEntry(null);
      setQueueSize(null);
      setReservation(null);
    } finally {
      setWaitlistLoading(false);
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

  const handleQuantityChange = (ticketTypeId: number, quantity: number) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketTypeId]: Math.max(0, quantity)
    }));
  };

  const getTotalAmount = () => {
    if (!event) return 0;
    return event.ticket_types.reduce((total, tt) => {
      const qty = selectedTickets[tt.id] || 0;
      return total + (qty * parseFloat(tt.price));
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      showAlert({ type: 'warning', text: 'Morate biti prijavljeni.', show: true });
      navigate('/login');
      return;
    }

    if (getTotalTickets() === 0) {
      showAlert({ type: 'warning', text: 'Izaberite bar jednu kartu.', show: true });
      return;
    }

    setPurchasing(true);

    try {
      // Build tickets array
      const tickets = Object.entries(selectedTickets)
        .filter(([_, qty]) => qty > 0)
        .map(([ticketTypeId, quantity]) => ({
          ticket_type_id: parseInt(ticketTypeId),
          quantity
        }));

      const response = await api.post('/purchases', {
        event_id: parseInt(id!),
        tickets,
        gate_token: gateToken, // Include gate token if available
      });

      showAlert({
        type: 'success',
        text: 'Karte su rezervisane! Preusmeravanje na placanje...',
        show: true,
      });

      // Clear gate token after successful purchase
      sessionStorage.removeItem(`gate_token_${id}`);

      // Navigate to checkout
      navigate(`/checkout/${response.data.purchase_id}`);

    } catch (error: any) {
      showAlert({
        type: 'error',
        text: error.response?.data?.message || 'Greska pri rezervaciji karata.',
        show: true,
      });
    } finally {
      setPurchasing(false);
    }
  };

  const joinWaitlist = async () => {
    if (!isAuthenticated) {
      showAlert({ type: 'warning', text: 'Morate biti prijavljeni.', show: true });
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
      showAlert({ type: 'success', text: 'Pridruzili ste se redu cekanja.', show: true });
      
      // Redirect to queue page
      navigate(`/events/${id}/queue`);
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Already in queue
        navigate(`/events/${id}/queue`);
      } else {
        showAlert({ type: 'error', text: err.response?.data?.message || 'Greska pri pridruzivanju redu.', show: true });
      }
    } finally {
      setWaitlistLoading(false);
    }
  };

  const leaveWaitlist = async () => {
    setWaitlistLoading(true);
    try {
      await api.delete(`/events/${id}/waitlist/leave`);
      setWaitlistEntry(null);
      sessionStorage.removeItem(`gate_token_${id}`);
      showAlert({ type: 'success', text: 'Napustili ste red cekanja.', show: true });
    } catch (err: any) {
      showAlert({ type: 'error', text: 'Greska pri napustanju reda.', show: true });
    } finally {
      setWaitlistLoading(false);
    }
  };

  // Get time remaining for admitted users
  const getTimeRemaining = () => {
    if (!waitlistEntry?.ttl_until) return null;
    const now = new Date().getTime();
    const expiry = new Date(waitlistEntry.ttl_until).getTime();
    const diff = Math.max(0, Math.floor((expiry - now) / 1000 / 60));
    return diff;
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

      {/* Admitted Banner */}
      {isAdmitted && (
        <div className="bg-green-500 text-white py-3">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">Dosli ste na red! Izaberite karte i zavrsete kupovinu.</span>
            </div>
            {getTimeRemaining() !== null && (
              <span className="bg-green-600 px-3 py-1 rounded-full text-sm">
                ⏱️ Jos {getTimeRemaining()} min
              </span>
            )}
          </div>
        </div>
      )}

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

            {/* Ticket Types */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {isAdmitted ? 'Izaberite karte' : 'Dostupne karte'}
              </h2>
              
              {!event.ticket_types || event.ticket_types.length === 0 ? (
                <p className="text-gray-500">Nema dostupnih karata za ovaj dogadjaj.</p>
              ) : (
                <div className="space-y-4">
                  {event.ticket_types.map((ticketType) => {
                    const available = getAvailableQuantity(ticketType);
                    const isAvailable = isTicketAvailable(ticketType);
                    const quantity = selectedTickets[ticketType.id] || 0;

                    return (
                      <div 
                        key={ticketType.id} 
                        className={`border rounded-lg p-4 ${isAdmitted && isAvailable ? 'border-blue-300 bg-blue-50' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 text-lg">{ticketType.name}</h3>
                            {ticketType.category && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                {ticketType.category}
                              </span>
                            )}
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                              {parseFloat(ticketType.price).toLocaleString('sr-RS')} RSD
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {isAvailable ? (
                                <span className="text-green-600">{available} dostupno</span>
                              ) : (
                                <span className="text-red-600">Rasprodato</span>
                              )}
                            </p>
                          </div>

                          {/* Quantity Selector - Only for admitted users */}
                          {isAdmitted && isAvailable && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuantityChange(ticketType.id, quantity - 1)}
                                disabled={quantity === 0}
                                className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xl font-bold"
                              >
                                -
                              </button>
                              <span className="w-12 text-center text-xl font-semibold">{quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(ticketType.id, quantity + 1)}
                                disabled={quantity >= Math.min(available, 10)}
                                className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xl font-bold text-white"
                              >
                                +
                              </button>
                            </div>
                          )}
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

              {/* ADMITTED - Show ticket summary and buy button */}
              {isAdmitted ? (
                <div>
                  {getTotalTickets() === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Izaberite karte sa leve strane
                    </p>
                  ) : (
                    <div className="space-y-3 mb-4">
                      {event.ticket_types.map((tt) => {
                        const qty = selectedTickets[tt.id] || 0;
                        if (qty === 0) return null;
                        return (
                          <div key={tt.id} className="flex justify-between text-sm">
                            <span>{tt.name} x {qty}</span>
                            <span className="font-medium">
                              {(qty * parseFloat(tt.price)).toLocaleString('sr-RS')} RSD
                            </span>
                          </div>
                        );
                      })}
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Ukupno</span>
                          <span className="text-blue-600">
                            {getTotalAmount().toLocaleString('sr-RS')} RSD
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handlePurchase}
                    disabled={purchasing || getTotalTickets() === 0}
                    style={{ color: 'white' }}
                    className="w-full bg-green-600 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {purchasing ? 'Obrada...' : 'Kupi karte'}
                  </button>

                  {getTimeRemaining() !== null && (
                    <p className="text-center text-sm text-orange-600 mt-3">
                      ⏱️ Imate jos {getTimeRemaining()} minuta
                    </p>
                  )}

                  <button
                    onClick={leaveWaitlist}
                    disabled={waitlistLoading}
                    className="w-full mt-3 py-2 text-red-600 hover:text-red-700 text-sm"
                  >
                    Odustani i napusti red
                  </button>
                </div>
              ) : waitlistEntry?.status === 'queued' ? (
                /* IN QUEUE - Show position */
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-blue-600">
                      {waitlistEntry.position || '?'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">Vasa pozicija u redu</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Sacekajte dok ne dodjete na red
                  </p>
                  <Link
                    to={`/events/${id}/queue`}
                    className="inline-block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    style={{ color: 'white' }}
                  >
                    Pogledaj red cekanja
                  </Link>
                  <button
                    onClick={leaveWaitlist}
                    disabled={waitlistLoading}
                    className="w-full mt-3 py-2 text-red-600 hover:text-red-700 text-sm"
                  >
                    Napusti red
                  </button>
                </div>
              ) : (
                /* NOT IN QUEUE - Show join button */
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">
                    Pristupite redu cekanja da biste kupili karte.
                  </p>
                  
                  {!isAuthenticated ? (
                    <Link
                      to={`/login?redirect=/events/${id}`}
                      className="inline-block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                      style={{ color: 'white' }}
                    >
                      Prijavite se
                    </Link>
                  ) : (
                    <button
                      onClick={joinWaitlist}
                      disabled={waitlistLoading}
                      style={{ color: 'white' }}
                      className="w-full bg-yellow-500 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition disabled:bg-gray-400"
                    >
                      {waitlistLoading ? 'Ucitavanje...' : 'Pridruzi se redu cekanja'}
                    </button>
                  )}

                  {queueSize !== null && queueSize > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Trenutno u redu: {queueSize}
                    </p>
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