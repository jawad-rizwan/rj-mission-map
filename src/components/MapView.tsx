import { MapContainer, TileLayer } from 'react-leaflet';
import { RangeRing } from './RangeRing';
import { RouteOverlay } from './RouteOverlay';
import { AirportMarker } from './AirportMarker';
import { useAppState } from '../store/appState';
import { getAirportByIcao } from '../data/airports';

export function MapView() {
  const { departureIcao, arrivalIcao } = useAppState();

  const dep = departureIcao ? getAirportByIcao(departureIcao) : undefined;
  const arr = arrivalIcao ? getAirportByIcao(arrivalIcao) : undefined;

  return (
    <MapContainer
      center={[40, -40]}
      zoom={3}
      className="map-container"
      worldCopyJump={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {dep && <RangeRing airport={dep} />}
      {dep && <AirportMarker airport={dep} role="departure" />}
      {arr && <AirportMarker airport={arr} role="arrival" />}
      {dep && arr && <RouteOverlay from={dep} to={arr} />}
    </MapContainer>
  );
}
