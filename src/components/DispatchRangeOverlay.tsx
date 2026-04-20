import { useMemo } from 'react';
import { Polygon } from 'react-leaflet';
import { ALL_AIRCRAFT, type AircraftConfig, type AircraftKey, oew } from '../engine/aircraft';
import { computeRange } from '../engine/mission';
import { rangeRingPoints } from '../engine/geo';
import { useAppState } from '../store/appState';
import type { Airport } from '../data/airports';

interface Props {
  airport: Airport;
}

interface DispatchRingDefinition {
  aircraftKey: AircraftKey;
  profile: 'max-payload' | 'ferry';
  label: string;
  color: string;
  dashArray?: string;
  weight: number;
  payloadLb: number;
  fuelLb: number;
}

interface DispatchRing extends DispatchRingDefinition {
  rangeNm: number;
  positions: [number, number][];
}

const DISPATCH_RING_DEFINITIONS: Omit<DispatchRingDefinition, 'payloadLb' | 'fuelLb'>[] = [
  {
    aircraftKey: 'ZRJ70',
    profile: 'max-payload',
    label: 'ZRJ-70 Max Payload Dispatch',
    color: '#42a5f5',
    weight: 3,
  },
  {
    aircraftKey: 'ZRJ70',
    profile: 'ferry',
    label: 'ZRJ-70 Dispatch Ferry',
    color: '#42a5f5',
    dashArray: '10 8',
    weight: 2.5,
  },
  {
    aircraftKey: 'ZRJ100',
    profile: 'max-payload',
    label: 'ZRJ-100 Max Payload Dispatch',
    color: '#ff9f43',
    weight: 3,
  },
  {
    aircraftKey: 'ZRJ100',
    profile: 'ferry',
    label: 'ZRJ-100 Dispatch Ferry',
    color: '#ff9f43',
    dashArray: '10 8',
    weight: 2.5,
  },
];

function dispatchFuelForPayload(ac: AircraftConfig, payloadLb: number): number {
  return Math.max(0, Math.min(ac.fuelTankCapacity, ac.mtowLimit - oew(ac) - payloadLb));
}

function buildDispatchRingDefinitions(): DispatchRingDefinition[] {
  return DISPATCH_RING_DEFINITIONS.map(definition => {
    const ac = ALL_AIRCRAFT[definition.aircraftKey];
    const payloadLb = definition.profile === 'ferry' ? 0 : ac.maxPayload;
    return {
      ...definition,
      payloadLb,
      fuelLb: dispatchFuelForPayload(ac, payloadLb),
    };
  });
}

const dispatchRingDefinitions = buildDispatchRingDefinitions();

export function useDispatchOverlayRings(airport: Airport | undefined, windKts: number): DispatchRing[] {
  return useMemo(() => {
    if (!airport) return [];

    return dispatchRingDefinitions.flatMap(definition => {
      const ac = ALL_AIRCRAFT[definition.aircraftKey];
      const result = computeRange(ac, definition.payloadLb, definition.fuelLb, windKts);
      if (!result.feasible || result.rangeNm <= 0) return [];

      return [{
        ...definition,
        rangeNm: result.rangeNm,
        positions: rangeRingPoints(airport.lat, airport.lon, result.rangeNm),
      }];
    });
  }, [airport?.lat, airport?.lon, windKts]);
}

export function DispatchRangeOverlay({ airport }: Props) {
  const { windKts } = useAppState();
  const rings = useDispatchOverlayRings(airport, windKts);

  return (
    <>
      {rings.map(ring => (
        <Polygon
          key={ring.label}
          positions={ring.positions}
          interactive={false}
          pathOptions={{
            color: ring.color,
            weight: ring.weight,
            fill: false,
            fillOpacity: 0,
            dashArray: ring.dashArray,
          }}
        />
      ))}
    </>
  );
}
