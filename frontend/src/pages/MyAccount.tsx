import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../hooks/useAlert';
import { api } from '../services/api';
import Master from '../components/layout/Master';
import Section from '../components/section/Section';


interface Ticket {
  id: number;
  event: {
    id: number;
    name: string;
    date: string;
    time: string;
    location: string;
    image?: string;
  };
  ticket_type: {
    name: string;
    price: number;
  };
  seat_number?: string;
  status: string;
  purchase_date: string;
}

const MyAccount: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchTickets();
  }, [isAuthenticated]);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/my-purchases');
      setTickets(response.data);
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: 'Greska pri ucitavanju karata.',
        show: true,
      });
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

  const formatTime = (timeString: string) => {
    return timeString?.substring(0, 5) || '';
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  const upcomingTickets = tickets.filter(t => isUpcoming(t.event.date));
  const pastTickets = tickets.filter(t => !isUpcoming(t.event.date));

  const handleLogout = async () => {
    await logout();
    navigate('/');
    showAlert({
      type: 'success',
      text: 'Uspesno ste se odjavili.',
      show: true,
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Master>
      <Section className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {user?.ime?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {user?.ime && user?.prezime 
                    ? `${user.ime} ${user.prezime}` 
                    : user?.korisnickoIme || 'Korisnik'}
                </h1>
                <p className="text-gray-600">{user?.email}</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition"
              >
                Odjavi se
              </button>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ukupno karata</p>
                <p className="text-2xl font-bold text-gray-800">{tickets.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Predstojecih</p>
                <p className="text-2xl font-bold text-gray-800">{upcomingTickets.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Prosli dogadjaji</p>
                <p className="text-2xl font-bold text-gray-800">{pastTickets.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex-1 py-4 text-center font-semibold transition ${
                activeTab === 'upcoming'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Predstojecih dogadjaji ({upcomingTickets.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`flex-1 py-4 text-center font-semibold transition ${
                activeTab === 'past'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Prosli dogadjaji ({pastTickets.length})
            </button>
          </div>

          {/* Tickets List */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 mt-4">Ucitavanje karata...</p>
              </div>
            ) : (
              <>
                {activeTab === 'upcoming' && (
                  <>
                    {upcomingTickets.length === 0 ? (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                        <p className="text-gray-500 text-lg mb-4">Nemate predstojecih dogadjaja</p>
                        <Link
                          to="/"
                          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                          Pregledaj dogadjaje
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {upcomingTickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="flex flex-col md:flex-row gap-4 p-4 border border-gray-100 rounded-lg hover:shadow-md transition"
                          >
                            {ticket.event.image ? (
                              <img
                                src={ticket.event.image}
                                alt={ticket.event.name}
                                className="w-full md:w-32 h-24 object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full md:w-32 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                                <svg className="w-10 h-10 text-white opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-800">{ticket.event.name}</h3>
                              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {formatDate(ticket.event.date)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {formatTime(ticket.event.time)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                  {ticket.event.location}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-3">
                                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {ticket.ticket_type.name}
                                </span>
                                {ticket.seat_number && (
                                  <span className="text-sm text-gray-500">
                                    Sediste: {ticket.seat_number}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end justify-between">
                              <span className="text-lg font-bold text-blue-600">
                                {ticket.ticket_type.price} RSD
                              </span>
                              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                                Aktivna
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'past' && (
                  <>
                    {pastTickets.length === 0 ? (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-500 text-lg">Nemate prosle dogadjaje</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pastTickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="flex flex-col md:flex-row gap-4 p-4 border border-gray-100 rounded-lg opacity-75"
                          >
                            {ticket.event.image ? (
                              <img
                                src={ticket.event.image}
                                alt={ticket.event.name}
                                className="w-full md:w-32 h-24 object-cover rounded-lg grayscale"
                              />
                            ) : (
                              <div className="w-full md:w-32 h-24 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                                <svg className="w-10 h-10 text-white opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                              </div>
                            )}
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-700">{ticket.event.name}</h3>
                              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {formatDate(ticket.event.date)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  </svg>
                                  {ticket.event.location}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-3">
                                <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  {ticket.ticket_type.name}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end justify-between">
                              <span className="text-lg font-bold text-gray-500">
                                {ticket.ticket_type.price} RSD
                              </span>
                              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                                Zavrseno
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </Section>
    </Master>
  );
};

export default MyAccount;