import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Master from '../components/layout/Master';
import Section from '../components/section/Section';
import Heading from '../components/heading/Heading';
import CardGroup from '../components/card/CardGroup';
import { useAlert } from '../hooks/useAlert';

interface ResultEvent {
  id?: number;
  name: string;
  description?: string | null;
  venue?: string | null;
  city?: string | null;
  start_at?: string | null;
  image?: string | null;
  link?: string | null;
}

const EventSearch: React.FC = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [events, setEvents] = useState<ResultEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const q = params.get('q') || '';
    const date = params.get('date') || '';
    const location = params.get('location') || '';

    fetchSearch(q, date, location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const fetchSearch = async (q: string, date: string, location: string) => {
    setLoading(true);
    try {
      const params: any = {};
      if (q) params.q = q;
      if (location) params.city = location;
      if (date) {
        params.date_from = date;
        params.date_to = date;
      }

      const res = await api.get('/events', { params });
      // EventController returns paginated resource (data key)
      const data = res.data?.data ?? res.data ?? [];
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showAlert({ type: 'error', text: err.response?.data || 'Greška pri pretrazi', show: true });
    } finally {
      setLoading(false);
    }
  };

  const openEvent = (id?: number) => {
    if (!id) return;
    navigate(`/events/${id}`);
  };

  return (
    <Master>
      <Section className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <Heading type={1} color="text-gray-800" text="Rezultati pretrage" />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            <p className="text-gray-500 mt-4">Pretraga u toku...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 text-lg">Nema rezultata pretrage</p>
          </div>
        ) : (
          <>
            <CardGroup className="mt-6">
              {events.map((ev, idx) => (
                <div key={ev.id ?? idx} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer" onClick={() => openEvent(ev.id)}>
                  {ev.image ? (
                    <img src={ev.image} alt={ev.name} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <svg className="w-20 h-20 text-white opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1">{ev.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ev.description}</p>
                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div>{ev.city} {ev.venue ? `· ${ev.venue}` : ''}</div>
                      {ev.start_at && <div>{new Date(ev.start_at).toLocaleString('sr-RS')}</div>}
                    </div>
                    <div className="flex justify-end">
                      <button onClick={() => openEvent(ev.id)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">Vidi detalje →</button>
                    </div>
                  </div>
                </div>
              ))}
            </CardGroup>
          </>
        )}
      </Section>
    </Master>
  );
};

export default EventSearch;
