import { useMemo } from 'react';
import { AirportSearch } from './AirportSearch';
import { ALL_AIRCRAFT } from '../engine/aircraft';
import { haversineNm } from '../engine/geo';
import { checkFeasibility } from '../engine/mission';
import { getAirportByIcao, type Airport } from '../data/airports';
import { useAppState, useAppDispatch } from '../store/appState';
import { useUnits } from '../hooks/useUnits';

export function MissionPanel() {
  const { aircraftKey, payloadLb, fuelLb, windKts, departureIcao, arrivalIcao } = useAppState();
  const dispatch = useAppDispatch();
  const { fmtDist } = useUnits();

  const ac = ALL_AIRCRAFT[aircraftKey];
  const dep = departureIcao ? getAirportByIcao(departureIcao) : undefined;
  const arr = arrivalIcao ? getAirportByIcao(arrivalIcao) : undefined;

  const distNm = useMemo(() => {
    if (!dep || !arr) return null;
    return haversineNm(dep.lat, dep.lon, arr.lat, arr.lon);
  }, [dep, arr]);

  const feasibility = useMemo(() => {
    if (distNm === null) return null;
    return checkFeasibility(ac, payloadLb, fuelLb, distNm, windKts);
  }, [ac, payloadLb, fuelLb, distNm, windKts]);

  return (
    <div className="control-group mission-panel">
      <label className="control-label">Mission</label>

      <AirportSearch
        label="Departure"
        value={dep}
        onChange={(a: Airport | null) => dispatch({ type: 'SET_DEPARTURE', icao: a?.icao ?? null })}
      />

      <AirportSearch
        label="Arrival"
        value={arr}
        onChange={(a: Airport | null) => dispatch({ type: 'SET_ARRIVAL', icao: a?.icao ?? null })}
      />

      {distNm !== null && feasibility && (
        <div className="feasibility-result">
          <div className="feasibility-distance">
            Distance: {fmtDist(distNm)}
          </div>
          <div className={`feasibility-badge ${feasibility.feasible ? 'go' : 'no-go'}`}>
            {feasibility.feasible ? 'GO' : 'NO-GO'}
          </div>
          <div className="feasibility-margin">
            Margin: {feasibility.rangeMargin > 0 ? '+' : ''}{fmtDist(feasibility.rangeMargin)}
          </div>
        </div>
      )}
    </div>
  );
}
