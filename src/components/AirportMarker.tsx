import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { Airport } from '../data/airports';

const depIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  tooltipAnchor: [1, -34],
  shadowSize: [41, 41],
});

const arrIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  tooltipAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Props {
  airport: Airport;
  role: 'departure' | 'arrival';
}

export function AirportMarker({ airport, role }: Props) {
  return (
    <Marker
      position={[airport.lat, airport.lon]}
      icon={role === 'departure' ? depIcon : arrIcon}
    >
      <Tooltip direction="top" permanent={false}>
        <strong>{airport.iata}</strong> — {airport.name}<br />
        {airport.city}, {airport.country}
      </Tooltip>
    </Marker>
  );
}
