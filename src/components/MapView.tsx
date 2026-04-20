import { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { RangeRing } from './RangeRing';
import { DispatchRangeOverlay, useDispatchOverlayRings } from './DispatchRangeOverlay';
import { RouteOverlay } from './RouteOverlay';
import { AirportMarker } from './AirportMarker';
import { useAppState } from '../store/appState';
import { getAirportByIcao } from '../data/airports';

export function MapView() {
  const { departureIcao, arrivalIcao, windKts } = useAppState();
  const [showAirfieldInfo, setShowAirfieldInfo] = useState(true);
  const [showRangePopup, setShowRangePopup] = useState(true);
  const [showDispatchOverlay, setShowDispatchOverlay] = useState(false);

  const dep = departureIcao ? getAirportByIcao(departureIcao) : undefined;
  const arr = arrivalIcao ? getAirportByIcao(arrivalIcao) : undefined;
  const hasRoute = Boolean(dep && arr);
  const dispatchRings = useDispatchOverlayRings(dep, windKts);

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

        {dep && !showDispatchOverlay && <RangeRing airport={dep} />}
        {dep && showDispatchOverlay && <DispatchRangeOverlay airport={dep} />}
        {dep && <AirportMarker airport={dep} role="departure" showAirfieldInfo={hasRoute && showAirfieldInfo} />}
        {arr && <AirportMarker airport={arr} role="arrival" showAirfieldInfo={hasRoute && showAirfieldInfo} />}
        {dep && arr && <RouteOverlay from={dep} to={arr} showPersistentLabel={showRangePopup} />}
      </MapContainer>

      <div className="map-overlay-controls">
        <button
          type="button"
          className={`map-toggle-btn ${showDispatchOverlay ? 'active' : ''}`}
          onClick={() => setShowDispatchOverlay(prev => !prev)}
          disabled={!dep}
          title="Toggle ZRJ-70 and ZRJ-100 dispatch comparison rings"
        >
          Dispatch Overlay
        </button>
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

      {showDispatchOverlay && dep && dispatchRings.length > 0 && (
        <div className="dispatch-overlay-legend">
          <div className="dispatch-overlay-title">Dispatch Range Overlay</div>
          <div className="dispatch-overlay-subtitle">Wind {windKts >= 0 ? '+' : ''}{windKts} kt</div>
          {dispatchRings.map(ring => (
            <div key={ring.label} className="dispatch-overlay-row">
              <span
                className={`dispatch-overlay-swatch ${ring.dashArray ? 'dashed' : 'solid'}`}
                style={{ color: ring.color }}
              />
              <span className="dispatch-overlay-label">{ring.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
