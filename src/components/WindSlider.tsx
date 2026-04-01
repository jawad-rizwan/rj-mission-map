import { useAppState, useAppDispatch } from '../store/appState';

export function WindSlider() {
  const { windKts } = useAppState();
  const dispatch = useAppDispatch();

  const label =
    windKts === 0
      ? 'No wind'
      : windKts > 0
        ? `${windKts} kt tailwind`
        : `${Math.abs(windKts)} kt headwind`;

  return (
    <div className="control-group">
      <label className="control-label">Wind Component</label>
      <div className="slider-row">
        <span className="slider-label" style={{ color: '#e74c3c', fontSize: '0.75rem' }}>HW</span>
        <input
          type="range"
          min={-100}
          max={100}
          step={5}
          value={windKts}
          onChange={e => dispatch({ type: 'SET_WIND', value: Number(e.target.value) })}
        />
        <span className="slider-label" style={{ color: '#27ae60', fontSize: '0.75rem' }}>TW</span>
      </div>
      <div className="wind-label">{label}</div>
    </div>
  );
}
