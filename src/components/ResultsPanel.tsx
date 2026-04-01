import { useMemo } from 'react';
import { ALL_AIRCRAFT } from '../engine/aircraft';
import { computeRange } from '../engine/mission';
import { useAppState } from '../store/appState';
import { useUnits } from '../hooks/useUnits';

export function ResultsPanel() {
  const { aircraftKey, payloadLb, fuelLb, windKts } = useAppState();
  const { fmtDist, fmtWeight } = useUnits();

  const ac = ALL_AIRCRAFT[aircraftKey];
  const result = useMemo(
    () => computeRange(ac, payloadLb, fuelLb, windKts),
    [ac, payloadLb, fuelLb, windKts],
  );

  if (!result.feasible) {
    return (
      <div className="control-group results-panel">
        <label className="control-label">Results</label>
        <div className="result-row" style={{ color: '#e74c3c' }}>
          Insufficient fuel for mission profile
        </div>
      </div>
    );
  }

  return (
    <div className="control-group results-panel">
      <label className="control-label">Results</label>
      <div className="result-row">
        <span>Range</span>
        <span className="result-value">{fmtDist(result.rangeNm)}</span>
      </div>
      <div className="result-row">
        <span>Cruise L/D</span>
        <span className="result-value">{result.ldCruise.toFixed(2)}</span>
      </div>
      <div className="result-row">
        <span>Trip Fuel</span>
        <span className="result-value">{fmtWeight(result.tripFuel)}</span>
      </div>
      <div className="result-row">
        <span>Reserve Fuel</span>
        <span className="result-value">{fmtWeight(result.totalReserve)}</span>
      </div>
      <div className="result-row">
        <span>Climb Dist</span>
        <span className="result-value">{fmtDist(result.climbDistNm)}</span>
      </div>
      <div className="result-row sub">
        <span>TO</span>
        <span>{fmtWeight(result.fuelBreakdown.fuelTO)}</span>
      </div>
      <div className="result-row sub">
        <span>Climb</span>
        <span>{fmtWeight(result.fuelBreakdown.fuelClimb)}</span>
      </div>
      <div className="result-row sub">
        <span>Cruise+Cont</span>
        <span>{fmtWeight(result.fuelBreakdown.fuelCruiseContingency)}</span>
      </div>
    </div>
  );
}
