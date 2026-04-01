import { ALL_AIRCRAFT, type AircraftKey } from '../engine/aircraft';
import { useAppState, useAppDispatch } from '../store/appState';

export function AircraftSelector() {
  const { aircraftKey } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <div className="control-group">
      <label className="control-label">Aircraft</label>
      <select
        className="aircraft-select"
        value={aircraftKey}
        onChange={e => dispatch({ type: 'SET_AIRCRAFT', key: e.target.value as AircraftKey })}
      >
        {Object.entries(ALL_AIRCRAFT).map(([key, ac]) => (
          <option key={key} value={key}>
            {ac.name} — {ac.seats} seat
          </option>
        ))}
      </select>
    </div>
  );
}
