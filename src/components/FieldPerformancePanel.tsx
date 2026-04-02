import { useMemo } from 'react';
import { useAppState } from '../store/appState';
import { ALL_AIRCRAFT, oew } from '../engine/aircraft';
import { getAirportByIcao } from '../data/airports';
import { longestRunway } from '../data/runways';
import { getSurfaceType } from '../data/surfaceTypes';
import { computeFieldPerformance, checkRunway, type FieldPerfResult, type RunwayCheckResult } from '../engine/fieldPerformance';
import { computeRouteMetrics } from '../engine/mission';
import { haversineNm } from '../engine/geo';
import { KTS_TO_FPS } from '../engine/constants';

function fmtFt(ft: number): string {
  return `${Math.round(ft).toLocaleString()} ft`;
}

function fmtKts(fps: number): string {
  return `${Math.round(fps / KTS_TO_FPS)} kt`;
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`feasibility-badge ${ok ? 'go' : 'no-go'}`}
      style={{ fontSize: '0.75rem', padding: '2px 10px', letterSpacing: 1 }}
    >
      {label}
    </span>
  );
}

function MarginRow({ label, margin }: { label: string; margin: number }) {
  const color = margin >= 0 ? '#27ae60' : '#e74c3c';
  return (
    <div className="result-row" style={{ fontSize: '0.75rem' }}>
      <span>{label}</span>
      <span style={{ color, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {margin >= 0 ? '+' : ''}{Math.round(margin).toLocaleString()} ft
      </span>
    </div>
  );
}

export function FieldPerformancePanel() {
  const state = useAppState();
  const { aircraftKey, payloadLb, fuelLb, windKts, departureIcao, arrivalIcao, deltaIsaC, surfaceTypeId } = state;

  const ac = ALL_AIRCRAFT[aircraftKey];
  const dep = departureIcao ? getAirportByIcao(departureIcao) : undefined;
  const arr = arrivalIcao ? getAirportByIcao(arrivalIcao) : undefined;

  const surface = getSurfaceType(surfaceTypeId);
  const takeoffWeight = oew(ac) + payloadLb + fuelLb;

  // Derive landing weight from route if possible
  const routeDistNm = useMemo(() => {
    if (!dep || !arr) return null;
    return haversineNm(dep.lat, dep.lon, arr.lat, arr.lon);
  }, [dep, arr]);

  const routeMetrics = useMemo(() => {
    if (routeDistNm === null) return null;
    return computeRouteMetrics(ac, payloadLb, fuelLb, routeDistNm, windKts);
  }, [ac, payloadLb, fuelLb, routeDistNm, windKts]);

  const landingWeight = routeMetrics
    ? takeoffWeight - routeMetrics.fuelRequired
    : 0.9 * takeoffWeight;

  // Departure field perf
  const depPerf: FieldPerfResult | null = useMemo(() => {
    if (!dep) return null;
    return computeFieldPerformance(
      ac, takeoffWeight, landingWeight,
      dep.elevation_ft, deltaIsaC,
      surface.muRollFactor, surface.muBrakeFactor,
    );
  }, [ac, takeoffWeight, landingWeight, dep, deltaIsaC, surface]);

  // Arrival field perf (at arrival elevation)
  const arrPerf: FieldPerfResult | null = useMemo(() => {
    if (!arr) return null;
    return computeFieldPerformance(
      ac, takeoffWeight, landingWeight,
      arr.elevation_ft, deltaIsaC,
      surface.muRollFactor, surface.muBrakeFactor,
    );
  }, [ac, takeoffWeight, landingWeight, arr, deltaIsaC, surface]);

  const depRunway = dep ? longestRunway(dep.icao) : null;
  const arrRunway = arr ? longestRunway(arr.icao) : null;

  const depCheck: RunwayCheckResult | null = useMemo(() => {
    if (!depPerf || !depRunway) return null;
    return checkRunway(depPerf, depRunway.lengthFt);
  }, [depPerf, depRunway]);

  const arrCheck: RunwayCheckResult | null = useMemo(() => {
    if (!arrPerf || !arrRunway) return null;
    return checkRunway(arrPerf, arrRunway.lengthFt);
  }, [arrPerf, arrRunway]);

  if (!dep) return null;

  return (
    <div className="control-group results-panel">
      <label className="control-label">Field Performance</label>

      {/* ── Takeoff at departure ── */}
      {depPerf && (
        <>
          <div className="result-section-label">Takeoff — {dep.iata}</div>
          <div className="result-row">
            <span>TOFL (FAR)</span>
            <span className="result-value">{fmtFt(depPerf.todrFactored)}</span>
          </div>
          <div className="result-row">
            <span>BFL</span>
            <span className="result-value">{fmtFt(depPerf.bfl)}</span>
          </div>
          {depRunway && (
            <div className="result-row">
              <span>Runway ({depRunway.designation})</span>
              <span className="result-value">{fmtFt(depRunway.lengthFt)}</span>
            </div>
          )}
          {depCheck && (
            <div style={{ textAlign: 'center', margin: '6px 0' }}>
              <Badge ok={depCheck.takeoffOk} label={depCheck.takeoffOk ? 'TO: GO' : 'TO: NO-GO'} />
              <MarginRow label="TO margin" margin={depCheck.toMarginFt} />
            </div>
          )}
          <div className="result-row sub">
            <span>V1 / VR / V2</span>
            <span>{fmtKts(depPerf.v1)} / {fmtKts(depPerf.vR)} / {fmtKts(depPerf.v2)}</span>
          </div>
          <div className="result-row sub">
            <span>Density Alt</span>
            <span>{fmtFt(depPerf.densityAltFt)}</span>
          </div>
        </>
      )}

      {/* ── Landing at arrival ── */}
      {arrPerf && arr && (
        <>
          <div className="result-section-label" style={{ marginTop: 12 }}>Landing — {arr.iata}</div>
          <div className="result-row">
            <span>LDR (dry, FAR)</span>
            <span className="result-value">{fmtFt(arrPerf.ldrFar)}</span>
          </div>
          <div className="result-row">
            <span>LDR (wet, FAR)</span>
            <span className="result-value">{fmtFt(arrPerf.ldrFarWet)}</span>
          </div>
          {arrRunway && (
            <div className="result-row">
              <span>Runway ({arrRunway.designation})</span>
              <span className="result-value">{fmtFt(arrRunway.lengthFt)}</span>
            </div>
          )}
          {arrCheck && (
            <div style={{ textAlign: 'center', margin: '6px 0' }}>
              <Badge
                ok={surfaceTypeId === 'wet' || surfaceTypeId === 'snow' || surfaceTypeId === 'ice'
                  ? arrCheck.landingWetOk
                  : arrCheck.landingDryOk}
                label={
                  (surfaceTypeId === 'wet' || surfaceTypeId === 'snow' || surfaceTypeId === 'ice'
                    ? arrCheck.landingWetOk
                    : arrCheck.landingDryOk)
                    ? 'LDG: GO'
                    : 'LDG: NO-GO'
                }
              />
              <MarginRow
                label="LDG margin (dry)"
                margin={arrCheck.ldMarginDryFt}
              />
              <MarginRow
                label="LDG margin (wet)"
                margin={arrCheck.ldMarginWetFt}
              />
            </div>
          )}
          <div className="result-row sub">
            <span>Vapp / VTD</span>
            <span>{fmtKts(arrPerf.vApproach)} / {fmtKts(arrPerf.vTD)}</span>
          </div>
          <div className="result-row sub">
            <span>Landing Wt</span>
            <span>{Math.round(landingWeight).toLocaleString()} lb</span>
          </div>
        </>
      )}

      {!depRunway && dep && (
        <div style={{ fontSize: '0.7rem', color: '#7f8c8d', marginTop: 6, fontStyle: 'italic' }}>
          No runway data for {dep.iata} — showing distances only
        </div>
      )}
    </div>
  );
}
