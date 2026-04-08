import { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { RangeRing } from './RangeRing';
import { RouteOverlay } from './RouteOverlay';
import { AirportMarker } from './AirportMarker';
import { useAppState } from '../store/appState';
import { getAirportByIcao } from '../data/airports';

export function MapView() {
  const { departureIcao, arrivalIcao } = useAppState();
  const [showAirfieldInfo, setShowAirfieldInfo] = useState(true);
  const [showRangePopup, setShowRangePopup] = useState(true);

  const dep = departureIcao ? getAirportByIcao(departureIcao) : undefined;
  const arr = arrivalIcao ? getAirportByIcao(arrivalIcao) : undefined;
  const hasRoute = Boolean(dep && arr);

  return (
    <div className="map-shell">
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
        {dep && <AirportMarker airport={dep} role="departure" showAirfieldInfo={hasRoute && showAirfieldInfo} />}
        {arr && <AirportMarker airport={arr} role="arrival" showAirfieldInfo={hasRoute && showAirfieldInfo} />}
        {dep && arr && <RouteOverlay from={dep} to={arr} showPersistentLabel={showRangePopup} />}
      </MapContainer>

      <div className="map-overlay-controls">
        <button
          type="button"
          className={`map-toggle-btn ${showAirfieldInfo ? 'active' : ''}`}
          onClick={() => setShowAirfieldInfo(prev => !prev)}
          disabled={!hasRoute}
          title="Toggle airfield info windows"
        >
          Airfield Windows
        </button>
        <button
          type="button"
          className={`map-toggle-btn ${showRangePopup ? 'active' : ''}`}
          onClick={() => setShowRangePopup(prev => !prev)}
          disabled={!hasRoute}
          title="Toggle route range popup"
        >
          Range Popup
        </button>
      </div>
    </div>
  );
}
