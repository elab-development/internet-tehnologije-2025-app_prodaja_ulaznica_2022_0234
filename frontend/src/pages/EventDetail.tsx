import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAlert } from '../hooks/useAlert';
import { useAuth } from '../hooks/useAuth';
import { Event, TicketType } from '../types';

import Master from '../components/layout/Master';
import Section from '../components/section/Section';
import Heading from '../components/heading/Heading';

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<{ [key: number]: number }>({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const [eventRes, ticketsRes] = await Promise.all([
        api.get(`/events/${id}`),
        api.get(`/events/${id}/ticket-types`),
      ]);
      setEvent(eventRes.data);
      setTicketTypes(ticketsRes.data);
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: error.response?.data?.message || 'Failed to load event',
        show: true,
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketChange = (ticketTypeId: number, quantity: number) => {
    setSelectedTickets((prev) => ({
      ...prev,
      [ticketTypeId]: Math.max(0, quantity),
    }));
  };

  const calculateTotal = () => {
    return ticketTypes.reduce((total, ticket) => {
      const quantity = selectedTickets[ticket.id] || 0;
      return total + ticket.price * quantity;
    }, 0);
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      showAlert({
        type: 'warning',
        text: 'Molimo da se ulogujete kako biste kupili karte',
        show: true,
      });
      navigate('/login');
      return;
    }

    const tickets = Object.entries(selectedTickets)
      .filter(([_, quantity]) => quantity > 0)
      .map(([ticketTypeId, quantity]) => ({
        ticket_type_id: Number(ticketTypeId),
        quantity,
      }));

    if (tickets.length === 0) {
      showAlert({
        type: 'warning',
        text: 'Izaberite najmanje jednu kartu',
        show: true,
      });
      return;
    }

    setPurchasing(true);
    try {
      const response = await api.post('/purchases', {
        event_id: Number(id),
        tickets,
      });

      showAlert({
        type: 'success',
        text: 'Kupovina uspešna!',
        show: true,
      });

      navigate('/tickets');
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: error.response?.data?.message || 'Kupovina neuspešna',
        show: true,
      });
    } finally {
      setPurchasing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sr-RS', {
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Master>
    );
  }

  if (!event) return null;

  const total = calculateTotal();
  const hasSelectedTickets = Object.values(selectedTickets).some((q) => q > 0);

  return (
    <Master>
      <Section className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-700"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Events
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Slika događaja */}
          <div>
            {event.image ? (
              <img
                src={event.image}
                alt={event.name}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-full h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-32 h-32 text-white opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
            )}
          </div>

          {/* Detalji događaja */}
          <div>
            <Heading type={1} color="text-gray-800" text={event.name} />
            <p className="text-gray-600 text-lg mt-4 mb-6">{event.description}</p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center text-gray-700">
                <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-lg">{formatDate(event.date)}</span>
              </div>

              <div className="flex items-center text-gray-700">
                <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-lg">{event.location}</span>
              </div>

              {event.available_tickets !== undefined && (
                <div className="flex items-center text-gray-700">
                  <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  <span className="text-lg">
                    {event.available_tickets > 0 ? (
                      <span className="text-green-600 font-semibold">{event.available_tickets} tickets available</span>
                    ) : (
                      <span className="text-red-600 font-semibold">Sold out</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Izbor karata */}
        {ticketTypes.length > 0 && (
          <div className="mt-12">
            <Heading type={2} color="text-gray-700" text="Select Tickets" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {ticketTypes.map((ticket) => (
                <div key={ticket.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{ticket.name}</h3>
                  {ticket.description && <p className="text-gray-600 text-sm mb-4">{ticket.description}</p>}
                  
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-blue-600">{ticket.price} RSD</span>
                  </div>

                  <div className="text-sm text-gray-500 mb-4">
                    Available: {ticket.available_quantity} / {ticket.quantity}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTicketChange(ticket.id, (selectedTickets[ticket.id] || 0) - 1)}
                      disabled={!selectedTickets[ticket.id] || selectedTickets[ticket.id] === 0}
                      className="w-10 h-10 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={ticket.available_quantity}
                      value={selectedTickets[ticket.id] || 0}
                      onChange={(e) => handleTicketChange(ticket.id, parseInt(e.target.value) || 0)}
                      className="w-16 text-center border border-gray-300 rounded-lg py-2 font-semibold"
                    />
                    <button
                      onClick={() => handleTicketChange(ticket.id, (selectedTickets[ticket.id] || 0) + 1)}
                      disabled={(selectedTickets[ticket.id] || 0) >= ticket.available_quantity}
                      className="w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pregled kupovine */}
            {hasSelectedTickets && (
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-700">Total:</span>
                  <span className="text-3xl font-bold text-blue-600">{total.toFixed(2)} RSD</span>
                </div>
                <button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg transition"
                >
                  {purchasing ? 'Processing...' : 'Purchase Tickets'}
                </button>
              </div>
            )}
          </div>
        )}
      </Section>
    </Master>
  );
};

export default EventDetail;