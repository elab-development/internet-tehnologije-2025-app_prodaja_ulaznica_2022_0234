import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../hooks/useAlert';
import { api } from '../services/api';
import Master from '../components/layout/Master';
import Section from '../components/section/Section';

interface Stats {
  total_events: number;
  total_users: number;
  total_purchases: number;
  total_revenue: number;
  pending_purchases: number;
  tickets_sold: number;
}

interface Event {
  id: number;
  title: string;
  slug: string;
  venue: string;
  city: string | null;
  start_at: string;
  tickets_sold?: number;
  tickets_total?: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  purchases_count?: number;
}

interface Purchase {
  id: number;
  user?: { name: string; email: string };
  user_id?: number;
  event?: { title: string };
  event_id?: number;
  ticket_type?: { name: string };
  ticket_type_id?: number;
  quantity: number;
  total_amount: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  created_at: string;
}

interface WaitlistEntry {
  id: number;
  user_id: number;
  event_id: number;
  status: 'queued' | 'admitted' | 'completed' | 'expired';
  token: string | null;
  ttl_until: string | null;
  created_at: string;
  user?: { name: string; email: string };
}

type TabType = 'overview' | 'events' | 'users' | 'purchases' | 'queue';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  
  // Queue state
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loadingWaitlist, setLoadingWaitlist] = useState(false);
  const [admitCount, setAdmitCount] = useState(10);
  const [ttlMinutes, setTtlMinutes] = useState(10);
  const [admitting, setAdmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      showAlert({
        type: 'error',
        text: 'Nemate pristup ovoj stranici.',
        show: true,
      });
      navigate('/');
      return;
    }
    fetchData();
  }, [isAuthenticated, isAdmin]);

  // Fetch waitlist when event is selected
  useEffect(() => {
    if (selectedEventId) {
      fetchWaitlist(selectedEventId);
    }
  }, [selectedEventId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, eventsRes, usersRes, purchasesRes] = await Promise.all([
        api.get('/stats').catch(() => ({ data: null })),
        api.get('/events').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/purchases').catch(() => ({ data: [] })),
      ]);
      
      setStats(statsRes.data || {
        total_events: 0,
        total_users: 0,
        total_purchases: 0,
        total_revenue: 0,
        pending_purchases: 0,
        tickets_sold: 0,
      });
      
      const eventsData = eventsRes.data?.data || eventsRes.data || [];
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      
      const usersData = usersRes.data?.data || usersRes.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
      
      const purchasesData = purchasesRes.data?.data || purchasesRes.data || [];
      setPurchases(Array.isArray(purchasesData) ? purchasesData : []);
      
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: 'Greska pri ucitavanju podataka.',
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitlist = async (eventId: number) => {
    setLoadingWaitlist(true);
    try {
      const response = await api.get(`/events/${eventId}/waitlist/list`);
      const data = response.data?.data || response.data || [];
      setWaitlist(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching waitlist:', error);
      setWaitlist([]);
    } finally {
      setLoadingWaitlist(false);
    }
  };

  const handleAdmitUsers = async () => {
    if (!selectedEventId) return;
    
    setAdmitting(true);
    try {
      const response = await api.post(`/events/${selectedEventId}/queue/admit`, {
        count: admitCount,
        ttl_seconds: ttlMinutes * 60,
      });
      
      showAlert({
        type: 'success',
        text: `Pusteno ${response.data.count} korisnika u kupovinu!`,
        show: true,
      });
      
      // Refresh waitlist
      fetchWaitlist(selectedEventId);
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: error.response?.data?.error || 'Greska pri pustanju korisnika.',
        show: true,
      });
    } finally {
      setAdmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('sr-RS', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return (amount || 0).toLocaleString('sr-RS') + ' RSD';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      queued: 'bg-blue-100 text-blue-800',
      admitted: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      pending: 'Na cekanju',
      paid: 'Placeno',
      cancelled: 'Otkazano',
      expired: 'Isteklo',
      queued: 'U redu',
      admitted: 'Pusten',
      completed: 'Zavrseno',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Da li ste sigurni da zelite da obrisete ovaj dogadjaj?')) return;
    
    try {
      await api.delete(`/events/${eventId}`);
      setEvents(events.filter(e => e.id !== eventId));
      showAlert({ type: 'success', text: 'Dogadjaj je obrisan.', show: true });
    } catch (error: any) {
      showAlert({ type: 'error', text: 'Greska pri brisanju.', show: true });
    }
  };

  const handleToggleUserRole = async (userId: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    try {
      await api.put(`/users/${userId}`, { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as 'user' | 'admin' } : u));
      showAlert({ type: 'success', text: 'Uloga je promenjena.', show: true });
    } catch (error: any) {
      showAlert({ type: 'error', text: 'Greska pri promeni uloge.', show: true });
    }
  };

  const getQueuedCount = () => waitlist.filter(w => w.status === 'queued').length;
  const getAdmittedCount = () => waitlist.filter(w => w.status === 'admitted').length;

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

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

  return (
    <Master>
      <Section className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Upravljajte dogadjajima, korisnicima i prodajom</p>
          </div>
          <Link
            to="/admin/events/create"
            style={{ color: 'white' }}
            className="mt-4 md:mt-0 inline-flex items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novi dogadjaj
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { key: 'overview', label: 'Pregled', icon: '📊' },
            { key: 'events', label: 'Dogadjaji', icon: '🎫' },
            { key: 'users', label: 'Korisnici', icon: '👥' },
            { key: 'purchases', label: 'Kupovine', icon: '💳' },
            { key: 'queue', label: 'Red cekanja', icon: '⏳' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dogadjaji</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total_events}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Prihod</p>
                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.total_revenue)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Prodato karata</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.tickets_sold}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Korisnici</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total_users}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kupovine</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.total_purchases}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Na cekanju</p>
                    <p className="text-2xl font-bold text-gray-800">{stats.pending_purchases}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Purchases */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Nedavne kupovine</h3>
                <div className="space-y-3">
                  {purchases.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nema kupovina</p>
                  ) : (
                    purchases.slice(0, 5).map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium text-gray-800">{purchase.user?.name || `Korisnik #${purchase.user_id}`}</p>
                          <p className="text-sm text-gray-500">{purchase.event?.title || `Event #${purchase.event_id}`}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800">{parseFloat(purchase.total_amount).toLocaleString('sr-RS')} RSD</p>
                          {getStatusBadge(purchase.status)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Predstojeći dogadjaji</h3>
                <div className="space-y-3">
                  {events.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nema dogadjaja</p>
                  ) : (
                    events
                      .filter(e => new Date(e.start_at) > new Date())
                      .slice(0, 5)
                      .map((event) => (
                        <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium text-gray-800">{event.title}</p>
                            <p className="text-sm text-gray-500">{formatDateTime(event.start_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {event.tickets_sold || 0} / {event.tickets_total || 0}
                            </p>
                            <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                              <div 
                                className="h-2 bg-blue-600 rounded-full"
                                style={{ width: `${event.tickets_total ? (event.tickets_sold || 0) / event.tickets_total * 100 : 0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Nema dogadjaja</p>
                <Link to="/admin/events/create" className="text-blue-600 hover:underline mt-2 inline-block">
                  Kreirajte prvi dogadjaj
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dogadjaj</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokacija</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prodaja</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcije</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-800">{event.title}</p>
                            <p className="text-sm text-gray-500">{event.slug}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-600">{event.venue}</p>
                          {event.city && <p className="text-sm text-gray-500">{event.city}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-600">{formatDateTime(event.start_at)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full">
                              <div 
                                className="h-2 bg-green-600 rounded-full"
                                style={{ width: `${event.tickets_total ? ((event.tickets_sold || 0) / event.tickets_total) * 100 : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{event.tickets_sold || 0}/{event.tickets_total || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/admin/events/${event.id}/edit`}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                            >
                              Izmeni
                            </Link>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                            >
                              Obrisi
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Nema korisnika</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Korisnik</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uloga</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kupovine</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrovan</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcije</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {user.name ? user.name[0].toUpperCase() : '?'}
                              </span>
                            </div>
                            <span className="font-medium text-gray-800">{user.name || 'Nepoznato'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : 'Korisnik'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{user.purchases_count || 0}</td>
                        <td className="px-6 py-4 text-gray-600">{formatDate(user.created_at)}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleUserRole(user.id, user.role)}
                            className={`px-3 py-1 text-sm rounded transition ${
                              user.role === 'admin'
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            }`}
                          >
                            {user.role === 'admin' ? 'Ukloni admina' : 'Dodeli admina'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Purchases Tab */}
        {activeTab === 'purchases' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {purchases.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Nema kupovina</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Korisnik</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dogadjaj</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Karta</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kolicina</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Iznos</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {purchases.map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-500">#{purchase.id}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-800">{purchase.user?.name || `Korisnik #${purchase.user_id}`}</p>
                            <p className="text-sm text-gray-500">{purchase.user?.email || '-'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{purchase.event?.title || `Event #${purchase.event_id}`}</td>
                        <td className="px-6 py-4 text-gray-600">{purchase.ticket_type?.name || `Tip #${purchase.ticket_type_id}`}</td>
                        <td className="px-6 py-4 text-gray-600">{purchase.quantity}</td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {parseFloat(purchase.total_amount).toLocaleString('sr-RS')} RSD
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(purchase.status)}</td>
                        <td className="px-6 py-4 text-gray-600">{formatDateTime(purchase.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <div className="space-y-6">
            {/* Event Selector */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Izaberite dogadjaj</h3>
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full md:w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">-- Izaberite dogadjaj --</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} - {formatDate(event.start_at)}
                  </option>
                ))}
              </select>
            </div>

            {selectedEventId && (
              <>
                {/* Admit Controls */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Pusti korisnike u kupovinu</h3>
                  
                  <div className="grid md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Broj korisnika
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={admitCount}
                        onChange={(e) => setAdmitCount(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vreme za kupovinu (min)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="60"
                        value={ttlMinutes}
                        onChange={(e) => setTtlMinutes(parseInt(e.target.value) || 10)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <button
                        onClick={handleAdmitUsers}
                        disabled={admitting || getQueuedCount() === 0}
                        style={{ color: 'white' }}
                        className="w-full bg-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {admitting ? 'Pustam...' : `Pusti ${admitCount} korisnika`}
                      </button>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">U redu: <span className="font-bold text-blue-600">{getQueuedCount()}</span></p>
                      <p className="text-sm text-gray-500">Pusteno: <span className="font-bold text-green-600">{getAdmittedCount()}</span></p>
                    </div>
                  </div>
                </div>

                {/* Waitlist Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Lista cekanja</h3>
                    <button
                      onClick={() => fetchWaitlist(selectedEventId)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      🔄 Osvezi
                    </button>
                  </div>
                  
                  {loadingWaitlist ? (
                    <div className="text-center py-12">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-gray-500 mt-2">Ucitavanje...</p>
                    </div>
                  ) : waitlist.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Nema korisnika u redu cekanja</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pozicija</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Korisnik</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usao u red</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Istice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {waitlist.map((entry, index) => (
                            <tr key={entry.id} className={`hover:bg-gray-50 ${entry.status === 'admitted' ? 'bg-green-50' : ''}`}>
                              <td className="px-6 py-4 text-gray-600">#{index + 1}</td>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="font-medium text-gray-800">{entry.user?.name || `Korisnik #${entry.user_id}`}</p>
                                  <p className="text-sm text-gray-500">{entry.user?.email || '-'}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">{getStatusBadge(entry.status)}</td>
                              <td className="px-6 py-4 text-gray-600">{formatDateTime(entry.created_at)}</td>
                              <td className="px-6 py-4 text-gray-600">
                                {entry.ttl_until ? formatDateTime(entry.ttl_until) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Section>
    </Master>
  );
};

export default AdminDashboard;