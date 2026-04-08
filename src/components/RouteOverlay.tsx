import { useMemo } from 'react';
import { Polyline, Tooltip } from 'react-leaflet';
import { greatCircleArc, haversineNm } from '../engine/geo';
import { useUnits } from '../hooks/useUnits';
import type { Airport } from '../data/airports';

interface Props {
  from: Airport;
  to: Airport;
  showPersistentLabel?: boolean;
}

export function RouteOverlay({ from, to, showPersistentLabel = true }: Props) {
  const { fmtDist } = useUnits();

  const arc = useMemo(
    () => greatCircleArc(from.lat, from.lon, to.lat, to.lon, 100),
    [from.lat, from.lon, to.lat, to.lon],
  );

  const distNm = useMemo(
    () => haversineNm(from.lat, from.lon, to.lat, to.lon),
    [from.lat, from.lon, to.lat, to.lon],
  );

  return (
    <>
      <Polyline
        positions={arc}
        pathOptions={{
          color: '#e74c3c',
          weight: 2.5,
          dashArray: '8, 6',
        }}
      >
        <Tooltip
          direction="top"
          sticky={!showPersistentLabel}
          permanent={showPersistentLabel}
          className={showPersistentLabel ? 'route-range-window' : undefined}
        >
          {from.iata} → {to.iata}: {fmtDist(distNm)}
        </Tooltip>
      </Polyline>
    </>
  );
}
