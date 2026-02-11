import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../hooks/useAlert';
import { api } from '../services/api';
import Master from '../components/layout/Master';
import Section from '../components/section/Section';


interface Seat {
  id: number;
  seat_number: string;
  row: string;
  column: number;
  status: 'available' | 'reserved' | 'sold';
  price: number;
}

interface Venue {
  id: number;
  name: string;
  rows: number;
  columns: number;
  total_seats: number;
}

interface SeatData {
  event_id: number;
  event_title: string;
  venue: Venue;
  seats: Seat[];
  ticket_type_id: number;
  ticket_type_name: string;
  quantity_to_purchase: number;
  unit_price: number;
}

const SeatSelection: React.FC = () => {
  const { eventId, ticketTypeId } = useParams<{ eventId: string; ticketTypeId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { showAlert } = useAlert();

  const [seatData, setSeatData] = useState<SeatData | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchParams] = useSearchParams();
  const quantityFromUrl = parseInt(searchParams.get('quantity') || '1');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchSeatData();
  }, [eventId, ticketTypeId, isAuthenticated]);

  const fetchSeatData = async () => {
    try {
      const selectionData = sessionStorage.getItem(`ticket_selection_${eventId}`);
     const selection = selectionData ? JSON.parse(selectionData) : null;
     const quantity = selection?.tickets?.[ticketTypeId!] || 1;

      const response = await api.get(
        `/events/${eventId}/seat-selection/${ticketTypeId}`
      );
      
      setSeatData({
      ...response.data,
      quantity_to_purchase: quantity,
    });
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: 'Greška pri učitavanju raspoloživih sedišta.',
        show: true,
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const toggleSeatSelection = (seatId: number, status: string) => {
    if (status !== 'available') {
      showAlert({
        type: 'warning',
        text: 'Ovo sedište nije dostupno.',
        show: true,
      });
      return;
    }

    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      } else {
        if (seatData && prev.length < quantityFromUrl) {
          return [...prev, seatId];
        } else {
          showAlert({
            type: 'warning',
            text: `Možete izabrati maksimalno ${seatData?.quantity_to_purchase} sedišta.`,
            show: true,
          });
          return prev;
        }
      }
    });
  };

  const handleProceedToPayment = async () => {
    if (selectedSeats.length !== seatData?.quantity_to_purchase) {
      showAlert({
        type: 'error',
        text: `Morate izabrati tačno ${seatData?.quantity_to_purchase} sedišta.`,
        show: true,
      });
      return;
    }

    setProcessing(true);

    try {
      const response = await api.post(
        `/events/${eventId}/seat-selection/${ticketTypeId}/reserve`,
        {
          seat_ids: selectedSeats,
        }
      );

      showAlert({
        type: 'success',
        text: 'Sedišta su uspešno rezervisana!',
        show: true,
      });

      // Preusmeri na stranicu za placanje sa purchase ID-om
      navigate(`/checkout/${response.data.purchase_id}`);
    } catch (error: any) {
      showAlert({
        type: 'error',
        text: error.response?.data?.message || 'Greška pri rezervisanju sedišta.',
        show: true,
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Master>
        <Section className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 mt-4">Učitavanje sedišta...</p>
          </div>
        </Section>
      </Master>
    );
  }

  if (!seatData) {
    return (
      <Master>
        <Section className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Sedišta nisu pronađena.</p>
            <Link
              to="/"
              style={{ color: 'white' }}
              className="inline-block mt-4 bg-blue-600 px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Nazad na početnu
            </Link>
          </div>
        </Section>
      </Master>
    );
  }

  // Grupiraj sedišta po redovima
  const seatsByRow = seatData.seats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = [];
    }
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<string, Seat[]>);

  const getSeatColor = (seat: Seat) => {
    if (selectedSeats.includes(seat.id)) {
      return 'bg-green-500 border-green-600';
    }
    switch (seat.status) {
      case 'available':
        return 'bg-blue-100 border-blue-300 hover:bg-blue-200 cursor-pointer';
      case 'reserved':
        return 'bg-yellow-100 border-yellow-300 cursor-not-allowed';
      case 'sold':
        return 'bg-red-100 border-red-300 cursor-not-allowed';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const getSeatStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Dostupno';
      case 'reserved':
        return 'Rezervisano';
      case 'sold':
        return 'Prodano';
      default:
        return 'Nepoznato';
    }
  };

  return (
    <Master>
      <Section className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Izbor sedišta</h1>
        <p className="text-gray-600 mb-8">{seatData.event_title}</p>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Mapa sedišta */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-8">
              {/* Stage */}
              <div className="text-center mb-8">
                <div className="inline-block bg-gray-800 text-white px-12 py-3 rounded-full font-semibold">
                  POZORNICA
                </div>
              </div>

              {/* Legend */}
              <div className="mb-8 flex flex-wrap gap-6 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 border-2 border-blue-300 rounded"></div>
                  <span className="text-sm text-gray-600">Dostupno</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
                  <span className="text-sm text-gray-600">Rezervisano</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded"></div>
                  <span className="text-sm text-gray-600">Prodano</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 border-2 border-green-600 rounded"></div>
                  <span className="text-sm text-gray-600">Izabrano</span>
                </div>
              </div>

              {/* Seating Chart */}
              <div className="bg-gray-50 rounded-lg p-6 overflow-x-auto">
                <div className="space-y-4 inline-block w-full">
                  {Object.entries(seatsByRow)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([row, seats]) => (
                      <div key={row} className="flex items-center gap-4">
                        <div className="w-8 font-semibold text-gray-600 text-right">
                          {row}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {seats
                            .sort((a, b) => a.column - b.column)
                            .map((seat) => (
                              <button
                                key={seat.id}
                                onClick={() =>
                                  toggleSeatSelection(seat.id, seat.status)
                                }
                                disabled={seat.status !== 'available'}
                                className={`w-8 h-8 rounded border-2 font-semibold text-xs transition ${getSeatColor(seat)}`}
                                title={`${seat.row}${seat.column} - ${getSeatStatusText(seat.status)}`}
                              >
                                {seat.column}
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Napomena:</strong> Kliknite na dostupna sedišta da ih izaberete.
                  Možete izabrati do <strong>{quantityFromUrl}</strong> sedišta.
                </p>
              </div>
            </div>
          </div>

          {/* Sažetak */}
          <div>
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Pregled
              </h2>

              {/* Event Info */}
              <div className="border-b pb-4 mb-4">
                <h3 className="font-semibold text-gray-800">
                  {seatData.event_title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Lokacija: {seatData.venue.name}
                </p>
              </div>

              {/* Ticket Type */}
              <div className="border-b pb-4 mb-4">
                <p className="text-sm text-gray-600">Tip karte</p>
                <p className="font-semibold text-gray-800">
                  {seatData.ticket_type_name}
                </p>
              </div>

              {/* Selected Seats */}
              <div className="border-b pb-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Izabrana sedišta ({selectedSeats.length}/{quantityFromUrl})
                </p>
                {selectedSeats.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedSeats.map((seatId) => {
                      const seat = seatData.seats.find((s) => s.id === seatId);
                      return (
                        <span
                          key={seatId}
                          className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded text-sm"
                        >
                          {seat?.row}
                          {seat?.column}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Još uvek niste izabrali sedišta
                  </p>
                )}
              </div>

              {/* Cena */}
              <div className="border-b pb-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cena po karti</span>
                  <span className="text-gray-800 font-medium">
                    {seatData.unit_price.toLocaleString('sr-RS')} RSD
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Količina</span>
                  <span className="text-gray-800 font-medium">
                    {selectedSeats.length}
                  </span>
                </div>
              </div>

              {/* Ukupno */}
              <div className="mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Ukupno</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {(seatData.unit_price * selectedSeats.length).toLocaleString(
                      'sr-RS'
                    )}{' '}
                    RSD
                  </span>
                </div>
                <p className="text-xs text-gray-500 text-right mt-1">
                  Uključen PDV
                </p>
              </div>

              {/* Akcije */}
              <button
                onClick={handleProceedToPayment}
                disabled={
                  processing ||
                  selectedSeats.length !== quantityFromUrl
                }
                style={{ color: 'white' }}
                className="w-full bg-green-600 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Obrada...
                  </span>
                ) : (
                  'Nastavi na plaćanje'
                )}
              </button>

              <button
                onClick={() =>
                  navigate(`/events/${eventId}`)
                }
                className="w-full mt-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition"
              >
                Otkaži
              </button>
            </div>
          </div>
        </div>
      </Section>
    </Master>
  );
};

export default SeatSelection;