/**
 * Runway surface type definitions with friction multipliers.
 * Multipliers applied to base mu_roll and mu_brake from AircraftConfig.
 * Wet braking factor (0.6) matches Raymer Table 17.1.
 */

export interface SurfaceType {
  id: string;
  name: string;
  muRollFactor: number;
  muBrakeFactor: number;
}

export const SURFACE_TYPES: SurfaceType[] = [
  { id: 'dry',  name: 'Hard / Dry',       muRollFactor: 1.0,  muBrakeFactor: 1.0 },
  { id: 'wet',  name: 'Hard / Wet',       muRollFactor: 1.0,  muBrakeFactor: 0.6 },
  { id: 'snow', name: 'Compacted Snow',   muRollFactor: 1.33, muBrakeFactor: 0.4 },
  { id: 'ice',  name: 'Icy',              muRollFactor: 1.0,  muBrakeFactor: 0.2 },
];

export function getSurfaceType(id: string): SurfaceType {
  return SURFACE_TYPES.find(s => s.id === id) ?? SURFACE_TYPES[0];
}
