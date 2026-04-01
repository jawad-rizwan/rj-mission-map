import { useCallback } from 'react';
import { useAppState } from '../store/appState';
import {
  formatDistance, formatWeight, formatSpeed,
  convertDistance, convertWeight, convertSpeed,
} from '../engine/units';

export function useUnits() {
  const { unitSystem } = useAppState();

  const fmtDist = useCallback(
    (nm: number) => formatDistance(nm, unitSystem.distance),
    [unitSystem.distance],
  );

  const fmtWeight = useCallback(
    (lb: number) => formatWeight(lb, unitSystem.weight),
    [unitSystem.weight],
  );

  const fmtSpeed = useCallback(
    (kts: number) => formatSpeed(kts, unitSystem.speed),
    [unitSystem.speed],
  );

  const convDist = useCallback(
    (nm: number) => convertDistance(nm, unitSystem.distance),
    [unitSystem.distance],
  );

  const convWeight = useCallback(
    (lb: number) => convertWeight(lb, unitSystem.weight),
    [unitSystem.weight],
  );

  const convSpeed = useCallback(
    (kts: number) => convertSpeed(kts, unitSystem.speed),
    [unitSystem.speed],
  );

  return {
    unitSystem,
    fmtDist,
    fmtWeight,
    fmtSpeed,
    convDist,
    convWeight,
    convSpeed,
    distLabel: unitSystem.distance,
    weightLabel: unitSystem.weight,
    speedLabel: unitSystem.speed === 'kmh' ? 'km/h' : 'kts',
  };
}
