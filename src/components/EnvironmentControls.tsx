import { useAppState, useAppDispatch } from '../store/appState';
import { SURFACE_TYPES } from '../data/surfaceTypes';
import { densityAltitude } from '../engine/atmosphere';
import { getAirportByIcao } from '../data/airports';

export function EnvironmentControls() {
  const { deltaIsaC, surfaceTypeId, departureIcao } = useAppState();
  const dispatch = useAppDispatch();

  const dep = departureIcao ? getAirportByIcao(departureIcao) : undefined;
  const elevFt = dep?.elevation_ft ?? 0;
  const da = densityAltitude(elevFt, deltaIsaC);

  const isaLabel =
    deltaIsaC === 0
      ? 'ISA'
      : deltaIsaC > 0
        ? `ISA +${deltaIsaC}\u00B0C`
        : `ISA ${deltaIsaC}\u00B0C`;

  return (
    <div className="control-group">
      <label className="control-label">Environment</label>

      <div className="slider-row">
        <span className="slider-label" style={{ fontSize: '0.7rem' }}>-40</span>
        <input
          type="range"
          min={-40}
          max={40}
          step={1}
          value={deltaIsaC}
          onChange={e => dispatch({ type: 'SET_DELTA_ISA', value: Number(e.target.value) })}
        />
        <span className="slider-label" style={{ fontSize: '0.7rem' }}>+40</span>
      </div>
      <div className="wind-label">{isaLabel}</div>

      {dep && (
        <div style={{ fontSize: '0.7rem', color: '#95a5a6', textAlign: 'center', marginTop: 2 }}>
          DA: {Math.round(da).toLocaleString()} ft (elev {elevFt.toLocaleString()} ft)
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <span className="search-label">Surface Condition</span>
        <select
          className="aircraft-select"
          value={surfaceTypeId}
          onChange={e => dispatch({ type: 'SET_SURFACE_TYPE', id: e.target.value })}
        >
          {SURFACE_TYPES.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
