import { useMemo } from 'react';
import { Polygon } from 'react-leaflet';
import { ALL_AIRCRAFT } from '../engine/aircraft';
import { computeRange } from '../engine/mission';
import { rangeRingPoints } from '../engine/geo';
import { useAppState } from '../store/appState';
import type { Airport } from '../data/airports';

interface Props {
  airport: Airport;
}

export function RangeRing({ airport }: Props) {
  const { aircraftKey, payloadLb, fuelLb, windKts } = useAppState();
  const ac = ALL_AIRCRAFT[aircraftKey];

  const result = useMemo(
    () => computeRange(ac, payloadLb, fuelLb, windKts),
    [ac, payloadLb, fuelLb, windKts],
  );

  const positions = useMemo(() => {
    if (!result.feasible || result.rangeNm <= 0) return [];
    return rangeRingPoints(airport.lat, airport.lon, result.rangeNm);
  }, [airport.lat, airport.lon, result.feasible, result.rangeNm]);

  if (positions.length === 0) return null;

  return (
    <Polygon
      positions={positions}
      pathOptions={{
        color: '#3498db',
        weight: 2,
        fillColor: '#3498db',
        fillOpacity: 0.08,
        dashArray: undefined,
      }}
    />
  );
}
