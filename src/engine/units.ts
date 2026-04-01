/**
 * Unit system types and display-layer conversion helpers.
 * Internal engine always uses Imperial (lb, nm, kts).
 */

import { NM_TO_KM, LB_TO_KG, KTS_TO_KMH } from './constants';

export type DistanceUnit = 'nm' | 'km';
export type WeightUnit = 'lb' | 'kg';
export type SpeedUnit = 'kts' | 'kmh';

export interface UnitSystem {
  distance: DistanceUnit;
  weight: WeightUnit;
  speed: SpeedUnit;
}

export const DEFAULT_UNITS: UnitSystem = {
  distance: 'nm',
  weight: 'lb',
  speed: 'kts',
};

export function convertDistance(nm: number, unit: DistanceUnit): number {
  return unit === 'km' ? nm * NM_TO_KM : nm;
}

export function convertWeight(lb: number, unit: WeightUnit): number {
  return unit === 'kg' ? lb * LB_TO_KG : lb;
}

export function convertSpeed(kts: number, unit: SpeedUnit): number {
  return unit === 'kmh' ? kts * KTS_TO_KMH : kts;
}

export function formatDistance(nm: number, unit: DistanceUnit): string {
  const val = convertDistance(nm, unit);
  return `${Math.round(val).toLocaleString()} ${unit}`;
}

export function formatWeight(lb: number, unit: WeightUnit): string {
  const val = convertWeight(lb, unit);
  return `${Math.round(val).toLocaleString()} ${unit}`;
}

export function formatSpeed(kts: number, unit: SpeedUnit): string {
  const val = convertSpeed(kts, unit);
  return `${Math.round(val).toLocaleString()} ${unit === 'kmh' ? 'km/h' : 'kts'}`;
}

/** Convert display-unit value back to internal lb. */
export function toLb(val: number, unit: WeightUnit): number {
  return unit === 'kg' ? val / LB_TO_KG : val;
}
