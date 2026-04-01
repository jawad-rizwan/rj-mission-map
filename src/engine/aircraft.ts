/**
 * Aircraft configuration data for the ZRJ family.
 * Canonical source: rj-mission-analysis/data/ZRJ{50,70,100}.py
 */

export interface AircraftConfig {
  name: string;
  description: string;
  seats: number;

  // Weights [lb]
  we: number;              // Empty weight (Ch. 15, excl. crew)
  nPilots: number;
  nFlightAttendants: number;
  personWeight: number;    // lb per crew member incl. bag
  maxPayload: number;      // Design payload [lb]
  fuelTankCapacity: number; // Max fuel that can physically fit [lb]
  mtowLimit: number;       // Structural/regulatory MTOW cap [lb]

  // Aerodynamics
  cd0: number;
  aspectRatio: number;
  oswaldE: number;
  wingArea: number;        // ft²

  // Cruise
  cruiseMach: number;
  cruiseAlt: number;       // ft

  // Engine
  tsfcCruise: number;      // 1/hr
  tsfcLoiter: number;      // 1/hr
  thrustPerEngine: number; // lbf SLS
  nEngines: number;
  bpr: number;

  // Fuel
  trappedFuelFactor: number;

  // Mission
  designRange: number;     // nm
  alternateRange: number;  // nm
}

// Derived properties (computed once, not stored)
export function crewWeight(ac: AircraftConfig): number {
  return (ac.nPilots + ac.nFlightAttendants) * ac.personWeight;
}

export function totalThrustSL(ac: AircraftConfig): number {
  return ac.thrustPerEngine * ac.nEngines;
}

export function K(ac: AircraftConfig): number {
  return 1.0 / (Math.PI * ac.aspectRatio * ac.oswaldE);
}

export function ldMax(ac: AircraftConfig): number {
  return 1.0 / (2.0 * Math.sqrt(ac.cd0 * K(ac)));
}

export function oew(ac: AircraftConfig): number {
  return ac.we + crewWeight(ac);
}

// ── Aircraft definitions ──────────────────────────────────────

export const ZRJ50: AircraftConfig = {
  name: 'ZRJ50',
  description: '50-seat high-wing regional jet (NA variant, scope-clause limited)',
  seats: 50,
  we: 45_032,
  nPilots: 2,
  nFlightAttendants: 1,
  personWeight: 197,
  maxPayload: 11_350,
  fuelTankCapacity: 19_465,
  mtowLimit: 65_000,
  cd0: 0.01843,
  aspectRatio: 7.8,
  oswaldE: 0.727,
  wingArea: 1016.58,
  cruiseMach: 0.78,
  cruiseAlt: 35_000,
  tsfcCruise: 0.5167,
  tsfcLoiter: 0.4134,
  thrustPerEngine: 19_190,
  nEngines: 2,
  bpr: 9.0,
  trappedFuelFactor: 1.06,
  designRange: 1800,
  alternateRange: 100,
};

export const ZRJ70: AircraftConfig = {
  name: 'ZRJ70',
  description: '76-seat high-wing regional jet (NA variant)',
  seats: 76,
  we: 45_032,
  nPilots: 2,
  nFlightAttendants: 2,
  personWeight: 197,
  maxPayload: 20_347,
  fuelTankCapacity: 19_465,
  mtowLimit: 86_000,
  cd0: 0.01843,
  aspectRatio: 7.8,
  oswaldE: 0.727,
  wingArea: 1016.58,
  cruiseMach: 0.78,
  cruiseAlt: 35_000,
  tsfcCruise: 0.5167,
  tsfcLoiter: 0.4134,
  thrustPerEngine: 19_190,
  nEngines: 2,
  bpr: 9.0,
  trappedFuelFactor: 1.06,
  designRange: 1800,
  alternateRange: 100,
};

export const ZRJ100: AircraftConfig = {
  name: 'ZRJ100',
  description: '100-seat high-wing regional jet (EU variant)',
  seats: 100,
  we: 47_527,
  nPilots: 2,
  nFlightAttendants: 2,
  personWeight: 197,
  maxPayload: 26_092,
  fuelTankCapacity: 19_465,
  mtowLimit: 100_000,
  cd0: 0.01910,
  aspectRatio: 7.8,
  oswaldE: 0.727,
  wingArea: 1016.58,
  cruiseMach: 0.78,
  cruiseAlt: 35_000,
  tsfcCruise: 0.5167,
  tsfcLoiter: 0.4134,
  thrustPerEngine: 19_190,
  nEngines: 2,
  bpr: 9.0,
  trappedFuelFactor: 1.06,
  designRange: 1200,
  alternateRange: 100,
};

export const ALL_AIRCRAFT: Record<string, AircraftConfig> = {
  ZRJ50,
  ZRJ70,
  ZRJ100,
};

export type AircraftKey = keyof typeof ALL_AIRCRAFT;
