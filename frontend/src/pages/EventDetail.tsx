import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../hooks/useAlert';
import { api } from '../services/api';
import Master from '../components/layout/Master';
import Section from '../components/section/Section';

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

interface SelectedTickets {
  [ticketTypeId: number]: number;
}

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showAlert } = useAlert();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<SelectedTickets>({});
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
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

  const handleQuantityChange = (ticketTypeId: number, change: number) => {
    const ticketType = event?.ticket_types.find(t => t.id === ticketTypeId);
    if (!ticketType) return;

    const currentQty = selectedTickets[ticketTypeId] || 0;
    const newQty = currentQty + change;
    const maxAvailable = getAvailableQuantity(ticketType);

    if (newQty < 0 || newQty > Math.min(maxAvailable, 10)) return;

    setSelectedTickets(prev => ({
      ...prev,
      [ticketTypeId]: newQty,
    }));
  };

  const getTotalPrice = () => {
    if (!event) return 0;
    return event.ticket_types.reduce((total, ticketType) => {
      const qty = selectedTickets[ticketType.id] || 0;
      return total + (qty * parseFloat(ticketType.price));
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      showAlert({
        type: 'warning',
        text: 'Morate biti prijavljeni da biste kupili karte.',
        show: true,
      });
      navigate('/login');
      return;
    }

    if (getTotalTickets() === 0) {
      showAlert({
        type: 'warning',
        text: 'Izaberite bar jednu kartu.',
        show: true,
      });
      return;
    }

    setPurchasing(true);

    try {
      // Create purchase for each selected ticket type
      const purchases = Object.entries(selectedTickets)
        .filter(([_, qty]) => qty > 0)
        .map(([ticketTypeId, quantity]) => ({
          ticket_type_id: parseInt(ticketTypeId),
          quantity,
        }));

      const response = await api.post('/purchases', {
        event_id: event?.id,
        tickets: purchases,
      });

      showAlert({
        type: 'success',
        text: 'Uspesno ste rezervisali karte! Imate 15 minuta da zavrsite placanje.',
        show: true,
      });

      // Navigate to checkout/payment page
      navigate(`/checkout/${response.data.purchase_id}`);
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: error.response?.data?.message || 'Greska pri kupovini karata.',
        show: true,
      });
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <Master>
        <Section className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Ucitavanje dogadjaja...</p>
          </div>
        </Section>
      </Master>
    );
  }

  if (!event) {
    return (
      <Master>
        <Section className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Dogadjaj nije pronadjen.</p>
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

      <Section className="container mx-auto px-4 py-12">
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
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Izaberite karte</h2>
              
              {event.ticket_types.length === 0 ? (
                <p className="text-gray-500">Nema dostupnih karata za ovaj dogadjaj.</p>
              ) : (
                <div className="space-y-4">
                  {event.ticket_types.map((ticketType) => {
                    const available = getAvailableQuantity(ticketType);
                    const isAvailable = isTicketAvailable(ticketType);
                    const selectedQty = selectedTickets[ticketType.id] || 0;

                    return (
                      <div
                        key={ticketType.id}
                        className={`border rounded-lg p-4 ${isAvailable ? 'border-gray-200' : 'border-gray-100 bg-gray-50'}`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-800">{ticketType.name}</h3>
                              {ticketType.category && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {ticketType.category}
                                </span>
                              )}
                            </div>
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                              {parseFloat(ticketType.price).toLocaleString('sr-RS')} RSD
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {isAvailable ? (
                                <>Dostupno: <span className="text-green-600 font-medium">{available}</span> karata</>
                              ) : available <= 0 ? (
                                <span className="text-red-600">Rasprodato</span>
                              ) : (
                                <span className="text-orange-600">Prodaja nije aktivna</span>
                              )}
                            </p>
                          </div>

                          {isAvailable && (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleQuantityChange(ticketType.id, -1)}
                                disabled={selectedQty === 0}
                                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="w-12 text-center text-xl font-semibold text-gray-800">
                                {selectedQty}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(ticketType.id, 1)}
                                disabled={selectedQty >= Math.min(available, 10)}
                                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
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
              
              {getTotalTickets() === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Izaberite karte za kupovinu
                </p>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {event.ticket_types
                      .filter(t => (selectedTickets[t.id] || 0) > 0)
                      .map(ticketType => {
                        const qty = selectedTickets[ticketType.id];
                        const subtotal = qty * parseFloat(ticketType.price);
                        return (
                          <div key={ticketType.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {ticketType.name} x {qty}
                            </span>
                            <span className="font-medium text-gray-800">
                              {subtotal.toLocaleString('sr-RS')} RSD
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-800">Ukupno</span>
                      <span className="text-lg font-bold text-blue-600">
                        {getTotalPrice().toLocaleString('sr-RS')} RSD
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Ukljucen PDV
                    </p>
                  </div>
                </>
              )}

              <button
                onClick={handlePurchase}
                disabled={getTotalTickets() === 0 || purchasing}
                style={{ color: 'white' }}
                className="w-full bg-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {purchasing ? 'Obrada...' : 'Nastavi na placanje'}
              </button>

              {!isAuthenticated && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  Morate biti <Link to="/login" className="text-blue-600 hover:underline">prijavljeni</Link> da biste kupili karte
                </p>
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
      </Section>
    </Master>
  );
};

export default EventDetail;