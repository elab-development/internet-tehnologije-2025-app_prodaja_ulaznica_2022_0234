import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

interface EventMapProps {
  latitude: number;
  longitude: number;
  title: string;
  venue?: string;
}

const EventMap: React.FC<EventMapProps> = ({ latitude, longitude, title, venue }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <p className="text-gray-600">Google Maps API key nije konfigurisan</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="w-full h-96 rounded-lg overflow-hidden shadow-md border border-gray-200">
        <Map
          defaultCenter={{ lat: latitude, lng: longitude }}
          defaultZoom={15}
          mapId="event-map"
          gestureHandling="cooperative"
        >
          <Marker
            position={{ lat: latitude, lng: longitude }}
            title={title}
          />
        </Map>
      </div>
    </APIProvider>
  );
};

export default EventMap;