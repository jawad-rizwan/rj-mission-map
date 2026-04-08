import { ALL_AIRCRAFT, oew } from '../engine/aircraft';
import { useAppState, useAppDispatch } from '../store/appState';
import { useUnits } from '../hooks/useUnits';

export function PayloadFuelSliders() {
  const { aircraftKey, payloadLb, fuelLb } = useAppState();
  const dispatch = useAppDispatch();
  const { fmtWeight } = useUnits();

  const ac = ALL_AIRCRAFT[aircraftKey];
  const base = oew(ac);
  const w0 = base + payloadLb + fuelLb;
  const maxFuel = Math.min(ac.fuelTankCapacity, ac.mtowLimit - base - payloadLb);
  const mtowPct = Math.min(100, (w0 / ac.mtowLimit) * 100);

  return (
    <div className="control-group">
      <label className="control-label">Payload & Fuel</label>

      <div className="slider-row">
        <span className="slider-label">Payload</span>
        <input
          type="range"
          min={0}
          max={ac.maxPayload}
          step={100}
          value={payloadLb}
          onChange={e => dispatch({ type: 'SET_PAYLOAD', value: Number(e.target.value) })}
        />
        <span className="slider-value">{fmtWeight(payloadLb)}</span>
      </div>

      <div className="slider-row">
        <span className="slider-label">Fuel</span>
        <input
          type="range"
          min={0}
          max={Math.max(0, maxFuel)}
          step={100}
          value={Math.min(fuelLb, Math.max(0, maxFuel))}
          onChange={e => dispatch({ type: 'SET_FUEL', value: Number(e.target.value) })}
        />
        <span className="slider-value">{fmtWeight(fuelLb)}</span>
      </div>

      <div className="mtow-bar">
        <div className="mtow-bar-label">
          <span>W0: {fmtWeight(w0)}</span>
          <span>MTOW: {fmtWeight(ac.mtowLimit)}</span>
        </div>
        <div className="mtow-bar-track">
          <div
            className="mtow-bar-fill"
            style={{
              width: `${mtowPct}%`,
              backgroundColor: mtowPct > 98 ? '#e74c3c' : mtowPct > 90 ? '#f39c12' : '#27ae60',
            }}
          />
        </div>
      </div>

      <div className="weight-breakdown">
        <span>OEW: {fmtWeight(base)}</span>
        <span>Max PLD: {fmtWeight(ac.maxPayload)}</span>
        <span>Tank: {fmtWeight(ac.fuelTankCapacity)}</span>
      </div>
    </div>
  );
}
