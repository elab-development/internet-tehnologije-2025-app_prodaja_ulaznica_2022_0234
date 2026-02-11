import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../hooks/useAlert';
import { api } from '../services/api';
import Master from '../components/layout/Master';
import Section from '../components/section/Section';

interface TicketTypeForm {
  name: string;
  category: string;
  price: string;
  quantity_total: string;
  sales_start_at: string;
  sales_end_at: string;
  is_active: boolean;
}

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const { showAlert } = useAlert();

  const [loading, setLoading] = useState(false);
  const [eventData, setEventData] = useState({
    title: '',
    slug: '',
    description: '',
    venue: '',
    city: '',
    start_at: '',
    end_at: '',
    rows: '10',
    columns: '10',
  });

  const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([
    {
      name: '',
      category: '',
      price: '',
      quantity_total: '',
      sales_start_at: '',
      sales_end_at: '',
      is_active: true,
    },
  ]);

  // Redirect if not admin
  if (!isAuthenticated || !isAdmin) {
    navigate('/');
    return null;
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'title' ? { slug: generateSlug(value) } : {}),
    }));
  };

  const handleTicketChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setTicketTypes(prev => prev.map((ticket, i) => {
      if (i === index) {
        return {
          ...ticket,
          [name]: type === 'checkbox' ? checked : value,
        };
      }
      return ticket;
    }));
  };

  const addTicketType = () => {
    setTicketTypes(prev => [
      ...prev,
      {
        name: '',
        category: '',
        price: '',
        quantity_total: '',
        sales_start_at: '',
        sales_end_at: '',
        is_active: true,
      },
    ]);
  };

  const removeTicketType = (index: number) => {
    if (ticketTypes.length === 1) {
      showAlert({ type: 'warning', text: 'Morate imati bar jedan tip karte.', show: true });
      return;
    }
    setTicketTypes(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!eventData.title.trim()) {
      showAlert({ type: 'error', text: 'Unesite naziv dogadjaja.', show: true });
      return false;
    }
    if (!eventData.venue.trim()) {
      showAlert({ type: 'error', text: 'Unesite mesto odrzavanja.', show: true });
      return false;
    }
    if (!eventData.start_at) {
      showAlert({ type: 'error', text: 'Unesite datum pocetka.', show: true });
      return false;
    }

    for (let i = 0; i < ticketTypes.length; i++) {
      const ticket = ticketTypes[i];
      if (!ticket.name.trim()) {
        showAlert({ type: 'error', text: `Unesite naziv za tip karte ${i + 1}.`, show: true });
        return false;
      }
      if (!ticket.price || parseFloat(ticket.price) < 0) {
        showAlert({ type: 'error', text: `Unesite validnu cenu za tip karte ${i + 1}.`, show: true });
        return false;
      }
      if (!ticket.quantity_total || parseInt(ticket.quantity_total) < 1) {
        showAlert({ type: 'error', text: `Unesite validnu kolicinu za tip karte ${i + 1}.`, show: true });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const eventResponse = await api.post('/events', {
        title: eventData.title,
        slug: eventData.slug,
        description: eventData.description,
        venue: eventData.venue,
        city: eventData.city,
        start_at: eventData.start_at,
        end_at: eventData.end_at,
        rows: parseInt(eventData.rows) || 10,
        columns: parseInt(eventData.columns) || 10,
      });

      const eventId = eventResponse.data.event?.id || eventResponse.data.id;

      if (!eventId) {
        showAlert({ type: 'error', text: 'Failed to get event ID', show: true });
        setLoading(false);
        return;
      }

      // 2. Create ticket types for the event
      for (const ticket of ticketTypes) {
        await api.post(`/events/${eventId}/ticket-types`, {
          name: ticket.name,
          category: ticket.category || null,
          price: parseFloat(ticket.price),
          quantity_total: parseInt(ticket.quantity_total),
          sales_start_at: ticket.sales_start_at || null,
          sales_end_at: ticket.sales_end_at || null,
          is_active: ticket.is_active,
        });
      }

      showAlert({
        type: 'success',
        text: 'Dogadjaj je uspesno kreiran!',
        show: true,
      });

      navigate('/admin/dashboard');
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: error.response?.data?.message || 'Greska pri kreiranju dogadjaja.',
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate total seats
  const totalSeats = (parseInt(eventData.rows) || 0) * (parseInt(eventData.columns) || 0);

  return (
    <Master>
      <Section className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Nazad na dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Kreiraj novi dogadjaj</h1>
          <p className="text-gray-600 mt-1">Popunite informacije o dogadjaju i tipovima karata</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Event Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Osnovne informacije
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Naziv dogadjaja *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={eventData.title}
                      onChange={handleEventChange}
                      placeholder="npr. Rock Koncert 2025"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL Slug
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-500 bg-gray-100 px-3 py-3 rounded-l-lg border border-r-0 border-gray-300">
                        /events/
                      </span>
                      <input
                        type="text"
                        name="slug"
                        value={eventData.slug}
                        onChange={handleEventChange}
                        placeholder="rock-koncert-2025"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Opis
                    </label>
                    <textarea
                      name="description"
                      value={eventData.description}
                      onChange={handleEventChange}
                      rows={4}
                      placeholder="Opisite dogadjaj..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Lokacija i sedista
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mesto odrzavanja *
                    </label>
                    <input
                      type="text"
                      name="venue"
                      value={eventData.venue}
                      onChange={handleEventChange}
                      placeholder="npr. Stark Arena"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grad
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={eventData.city}
                      onChange={handleEventChange}
                      placeholder="npr. Beograd"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                  </div>
                </div>

                {/* Seats Configuration */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Konfiguracija sedista
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Automatski ce se kreirati sedista (npr. redovi A-J sa 10 sedista po redu = 100 sedista)
                  </p>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Broj redova
                      </label>
                      <input
                        type="number"
                        name="rows"
                        value={eventData.rows}
                        onChange={handleEventChange}
                        min="1"
                        max="26"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      />
                      <p className="text-xs text-gray-400 mt-1">Maks. 26 (A-Z)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sedista po redu
                      </label>
                      <input
                        type="number"
                        name="columns"
                        value={eventData.columns}
                        onChange={handleEventChange}
                        min="1"
                        max="50"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      />
                      <p className="text-xs text-gray-400 mt-1">Maks. 50</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ukupno sedista
                      </label>
                      <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 font-semibold">
                        {totalSeats}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Automatski</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date & Time Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Datum i vreme
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pocetak *
                    </label>
                    <input
                      type="datetime-local"
                      name="start_at"
                      value={eventData.start_at}
                      onChange={handleEventChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zavrsetak
                    </label>
                    <input
                      type="datetime-local"
                      name="end_at"
                      value={eventData.end_at}
                      onChange={handleEventChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Ticket Types Card */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    Tipovi karata
                  </h2>
                  <button
                    type="button"
                    onClick={addTicketType}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Dodaj tip
                  </button>
                </div>

                <div className="space-y-6">
                  {ticketTypes.map((ticket, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                      {ticketTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicketType(index)}
                          className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}

                      <p className="text-sm font-medium text-gray-500 mb-4">Tip karte #{index + 1}</p>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Naziv *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={ticket.name}
                            onChange={(e) => handleTicketChange(index, e)}
                            placeholder="npr. VIP, Standard"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Kategorija
                          </label>
                          <input
                            type="text"
                            name="category"
                            value={ticket.category}
                            onChange={(e) => handleTicketChange(index, e)}
                            placeholder="npr. Premium, Economy"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cena (RSD) *
                          </label>
                          <input
                            type="number"
                            name="price"
                            value={ticket.price}
                            onChange={(e) => handleTicketChange(index, e)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ukupna kolicina *
                          </label>
                          <input
                            type="number"
                            name="quantity_total"
                            value={ticket.quantity_total}
                            onChange={(e) => handleTicketChange(index, e)}
                            placeholder="100"
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            required
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="is_active"
                            checked={ticket.is_active}
                            onChange={(e) => handleTicketChange(index, e)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Aktivan (dostupan za prodaju)</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Pregled</h2>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Naziv:</span>
                    <span className="font-medium text-gray-800 text-right">
                      {eventData.title || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Lokacija:</span>
                    <span className="font-medium text-gray-800 text-right">
                      {eventData.venue ? `${eventData.venue}${eventData.city ? `, ${eventData.city}` : ''}` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Datum:</span>
                    <span className="font-medium text-gray-800 text-right">
                      {eventData.start_at ? new Date(eventData.start_at).toLocaleDateString('sr-RS') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sedista:</span>
                    <span className="font-medium text-gray-800">
                      {totalSeats} ({eventData.rows} x {eventData.columns})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipovi karata:</span>
                    <span className="font-medium text-gray-800">{ticketTypes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ukupno karata:</span>
                    <span className="font-medium text-gray-800">
                      {ticketTypes.reduce((sum, t) => sum + (parseInt(t.quantity_total) || 0), 0)}
                    </span>
                  </div>
                </div>

                <div className="border-t my-6"></div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ color: 'white' }}
                  className="w-full bg-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Kreiranje...
                    </span>
                  ) : (
                    'Kreiraj dogadjaj'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/admin/dashboard')}
                  className="w-full mt-3 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
                >
                  Odustani
                </button>
              </div>
            </div>
          </div>
        </form>
      </Section>
    </Master>
  );
};

export default CreateEvent;