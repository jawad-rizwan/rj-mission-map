import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { Airport } from '../data/airports';
import { longestRunway } from '../data/runways';

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
  showAirfieldInfo?: boolean;
}

function fmtLengthFt(lengthFt: number): string {
  return `${Math.round(lengthFt).toLocaleString()} ft`;
}

function fmtSurface(surface: string): string {
  if (!surface) return 'Unknown';
  return surface.charAt(0).toUpperCase() + surface.slice(1);
}

export function AirportMarker({ airport, role, showAirfieldInfo = false }: Props) {
  const runway = longestRunway(airport.icao);

  return (
    <Marker
      position={[airport.lat, airport.lon]}
      icon={role === 'departure' ? depIcon : arrIcon}
    >
      <Tooltip direction="top" permanent={false}>
        <strong>{airport.iata}</strong> — {airport.name}<br />
        {airport.city}, {airport.country}
      </Tooltip>

      {showAirfieldInfo && (
        <Tooltip
          direction={role === 'departure' ? 'right' : 'left'}
          offset={role === 'departure' ? [14, -18] : [-14, -18]}
          permanent
          className="airfield-info-window"
        >
          <div className="airfield-info-content">
            <div className="airfield-info-title">{airport.iata}</div>
            <div>Runway: {runway ? fmtLengthFt(runway.lengthFt) : 'N/A'}</div>
            <div>Surface: {runway ? fmtSurface(runway.surface) : 'N/A'}</div>
          </div>
        </Tooltip>
      )}
    </Marker>
  );
}
