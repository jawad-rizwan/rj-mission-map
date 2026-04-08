import { useAppState, useAppDispatch } from '../store/appState';

function ToggleButton<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="toggle-group">
      {options.map(opt => (
        <button
          key={opt.value}
          className={`toggle-btn ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function UnitToggle() {
  const { unitSystem } = useAppState();
  const dispatch = useAppDispatch();

  return (
    <div className="control-group unit-toggles">
      <label className="control-label">Units</label>
      <div className="toggle-row">
        <ToggleButton
          options={[
            { value: 'nm' as const, label: 'nm' },
            { value: 'km' as const, label: 'km' },
          ]}
          value={unitSystem.distance}
          onChange={v => dispatch({ type: 'SET_DISTANCE_UNIT', value: v })}
        />
        <ToggleButton
          options={[
            { value: 'lb' as const, label: 'lb' },
            { value: 'kg' as const, label: 'kg' },
          ]}
          value={unitSystem.weight}
          onChange={v => dispatch({ type: 'SET_WEIGHT_UNIT', value: v })}
        />
        <ToggleButton
          options={[
            { value: 'kts' as const, label: 'kts' },
            { value: 'kmh' as const, label: 'km/h' },
          ]}
          value={unitSystem.speed}
          onChange={v => dispatch({ type: 'SET_SPEED_UNIT', value: v })}
        />
      </div>
    </div>
  );
}
