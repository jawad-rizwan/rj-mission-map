/**
 * Simplified mission model for real-time range computation.
 *
 * Approximates the full 9-segment FAR 121.645 mission from
 * rj-mission-analysis/mission.py in a single forward pass.
 *
 * Key simplifications:
 * - Climb: direct port of step-integration (35 steps, <0.05ms)
 * - Contingency: absorbed into an effective TSFC
 * - Reserves: computed in one forward pass from estimated post-cruise weight
 * - One refinement iteration on reserves for consistency
 */

import {
  type AircraftConfig,
  K, ldMax, totalThrustSL, crewWeight,
} from './aircraft';
import { isa, tasFromMach, dynamicPressureMach, thrustLapse } from './atmosphere';
import { RHO_SL, NM_TO_FT, KTS_TO_FPS } from './constants';
import { groundSpeedKts } from './wind';

// ── Result types ──────────────────────────────────────────────

export interface FuelBreakdown {
  fuelTO: number;
  fuelClimb: number;
  fuelCruiseContingency: number;
  reserveFuel: number;
  reserveBreakdown: {
    fuelLand1: number;
    fuelGA: number;
    fuelDivert: number;
    fuelHold: number;
    fuelLand2: number;
  };
}

export interface MissionResult {
  feasible: boolean;
  rangeNm: number;
  w0: number;
  ldCruise: number;
  fuelBreakdown: FuelBreakdown;
  tripFuel: number;
  totalReserve: number;
  climbDistNm: number;
  // Time
  flightTimeMin: number;       // Total trip time (TO + climb + cruise) [min]
  climbTimeMin: number;
  cruiseTimeMin: number;
  // Fuel consumption
  avgFuelFlowLbHr: number;     // Average cruise fuel flow [lb/hr]
  specificRangeNmLb: number;   // Cruise specific range [nm/lb] (fuel efficiency)
}

// ── Climb integration ─────────────────────────────────────────

interface ClimbResult {
  fuelBurned: number;
  distanceNm: number;
  timeSec: number;
  wEnd: number;
}

function computeClimb(
  ac: AircraftConfig,
  wStart: number,
  hStart: number = 0,
  hEnd?: number,
): ClimbResult {
  if (hEnd === undefined) hEnd = ac.cruiseAlt;

  const dh = 1000; // ft step size
  const acK = K(ac);
  const tSL = totalThrustSL(ac);
  let w = wStart;
  let totalFuel = 0;
  let totalDist = 0;
  let totalTime = 0;
  let h = hStart;

  while (h < hEnd) {
    const step = Math.min(dh, hEnd - h);
    const hMid = h + step / 2;

    // Climb speed
    let vFps: number;
    if (hMid < 10_000) {
      const { rho } = isa(hMid);
      vFps = 250 * KTS_TO_FPS * Math.sqrt(RHO_SL / rho);
    } else {
      vFps = tasFromMach(ac.cruiseMach, hMid);
    }

    // Available thrust
    const tAvail = tSL * thrustLapse(hMid, ac.bpr);

    // Drag
    const { rho } = isa(hMid);
    const q = 0.5 * rho * vFps * vFps;
    if (q <= 0) break;
    const cl = w / (q * ac.wingArea);
    const cd = ac.cd0 + acK * cl * cl;
    const drag = q * ac.wingArea * cd;

    // Rate of climb (Raymer Eq 17.39)
    const excess = tAvail - drag;
    if (excess <= 0) break;
    const roc = vFps * excess / w;

    // Time and fuel (Raymer Eq 17.51)
    const dt = step / roc;
    const fuelStep = (ac.tsfcCruise / 3600) * tAvail * dt;
    const distFt = vFps * dt;

    totalFuel += fuelStep;
    totalDist += distFt;
    totalTime += dt;
    w -= fuelStep;
    h += step;
  }

  return { fuelBurned: totalFuel, distanceNm: totalDist / NM_TO_FT, timeSec: totalTime, wEnd: w };
}

// ── Reserve fuel computation ──────────────────────────────────

function computeReserves(
  ac: AircraftConfig,
  wAtReserveStart: number,
  windKts: number,
): { total: number; breakdown: FuelBreakdown['reserveBreakdown'] } {
  const acK = K(ac);
  const acLdMax = ldMax(ac);
  let w = wAtReserveStart;

  // Seg 5: Attempted landing (weight fraction 0.995)
  const fuelLand1 = w * 0.005;
  w -= fuelLand1;

  // Seg 6: Go-around climb
  const ga = computeClimb(ac, w);
  const fuelGA = ga.fuelBurned;
  const gaClimbDist = ga.distanceNm;
  w = ga.wEnd;

  // Seg 7: Divert 100nm (Breguet cruise, subtract go-around climb distance)
  const divertRange = Math.max(0, ac.alternateRange - gaClimbDist);
  const vFps = tasFromMach(ac.cruiseMach, ac.cruiseAlt);
  const vKts = vFps / KTS_TO_FPS;
  const vGroundKts = vKts + windKts;
  const q = dynamicPressureMach(ac.cruiseMach, ac.cruiseAlt);
  const cl = (w / ac.wingArea) / q;
  const cd = ac.cd0 + acK * cl * cl;
  const ld = cl / cd;

  let fuelDivert = 0;
  if (divertRange > 0 && vGroundKts > 0) {
    // Breguet: Wf = Wi * exp(-R * C / (V_ground * LD))
    // But fuel burn rate depends on TAS not ground speed.
    // Air distance = R * (V_TAS / V_ground)
    const airDistNm = divertRange * (vKts / vGroundKts);
    const wRatio = Math.exp(-(airDistNm * NM_TO_FT) * (ac.tsfcCruise / 3600) / (vFps * ld));
    fuelDivert = w * (1 - wRatio);
  }
  w -= fuelDivert;

  // Seg 8: 30-min regulatory hold at (L/D)max, loiter TSFC
  const holdSec = 30 * 60;
  const wRatioHold = Math.exp(-(holdSec * (ac.tsfcLoiter / 3600)) / acLdMax);
  const fuelHold = w * (1 - wRatioHold);
  w -= fuelHold;

  // Seg 9: Land
  const fuelLand2 = w * 0.005;

  return {
    total: fuelLand1 + fuelGA + fuelDivert + fuelHold + fuelLand2,
    breakdown: { fuelLand1, fuelGA, fuelDivert, fuelHold, fuelLand2 },
  };
}

// ── Main range computation ────────────────────────────────────

export function computeRange(
  ac: AircraftConfig,
  payloadLb: number,
  fuelLb: number,
  windKts: number = 0,
): MissionResult {
  const acK = K(ac);
  const acLdMax = ldMax(ac);
  const w0 = ac.we + crewWeight(ac) + payloadLb + fuelLb;

  const infeasible: MissionResult = {
    feasible: false, rangeNm: 0, w0,
    ldCruise: 0,
    fuelBreakdown: {
      fuelTO: 0, fuelClimb: 0, fuelCruiseContingency: 0, reserveFuel: 0,
      reserveBreakdown: { fuelLand1: 0, fuelGA: 0, fuelDivert: 0, fuelHold: 0, fuelLand2: 0 },
    },
    tripFuel: 0, totalReserve: 0, climbDistNm: 0,
    flightTimeMin: 0, climbTimeMin: 0, cruiseTimeMin: 0,
    avgFuelFlowLbHr: 0, specificRangeNmLb: 0,
  };

  // Total usable mission fuel
  const totalMissionFuel = fuelLb / ac.trappedFuelFactor;
  if (totalMissionFuel <= 0) return infeasible;

  // Seg 1: Warmup & Takeoff (weight fraction 0.97)
  const w1 = w0 * 0.97;
  const fuelTO = w0 - w1;

  // Seg 2: Climb to cruise altitude
  const climb = computeClimb(ac, w1);
  const fuelClimb = climb.fuelBurned;
  const climbDistNm = climb.distanceNm;
  const w2 = climb.wEnd;

  // Cruise L/D at top-of-climb weight
  const q = dynamicPressureMach(ac.cruiseMach, ac.cruiseAlt);
  const clCruise = (w2 / ac.wingArea) / q;
  const cdCruise = ac.cd0 + acK * clCruise * clCruise;
  const ldCruise = clCruise / cdCruise;

  // Ground speed
  const vGroundKts = groundSpeedKts(ac.cruiseMach, ac.cruiseAlt, windKts);
  if (vGroundKts <= 0) return infeasible;
  const vTasKts = tasFromMach(ac.cruiseMach, ac.cruiseAlt) / KTS_TO_FPS;

  // Effective TSFC absorbing 10% contingency loiter
  const contingencyFactor = 0.10 * (ac.tsfcLoiter / ac.tsfcCruise) * (ldCruise / acLdMax);
  const effectiveTSFC = ac.tsfcCruise * (1 + contingencyFactor);

  // Two-pass iteration: estimate reserves, compute range, refine reserves
  let reserveResult = computeReserves(ac, w2 * 0.85, windKts);
  let reserveFuel = reserveResult.total;

  for (let iter = 0; iter < 2; iter++) {
    const cruiseContingencyFuel = totalMissionFuel - fuelTO - fuelClimb - reserveFuel;
    if (cruiseContingencyFuel <= 0) return infeasible;

    const wAfterCC = w2 - cruiseContingencyFuel;
    if (wAfterCC <= 0) return infeasible;

    // Breguet range: fuel burn depends on air distance (TAS), but range is ground distance
    // Air-distance fuel: W2 * (1 - exp(-R_air * C / (V_TAS * LD)))
    // R_ground = R_air * (V_ground / V_TAS)
    // So: R_air = (V_TAS / effectiveTSFC) * LD * ln(W2 / wAfterCC)
    const airRangeNm = (vTasKts / effectiveTSFC) * ldCruise * Math.log(w2 / wAfterCC);
    const groundRangeNm = airRangeNm * (vGroundKts / vTasKts);
    const rangeNm = climbDistNm + groundRangeNm;

    if (iter < 1) {
      // Refine: update reserve estimate with actual post-cruise weight
      const wAtLanding = wAfterCC;
      reserveResult = computeReserves(ac, wAtLanding, windKts);
      reserveFuel = reserveResult.total;
    } else {
      // Flight time: TO (5 min) + climb + cruise
      const toTimeMin = 5;
      const climbTimeMin = climb.timeSec / 60;
      const cruiseTimeMin = vGroundKts > 0 ? (groundRangeNm / vGroundKts) * 60 : 0;
      const flightTimeMin = toTimeMin + climbTimeMin + cruiseTimeMin;

      // Fuel consumption: average cruise fuel flow and specific range
      const cruiseHr = cruiseTimeMin / 60;
      const avgFuelFlowLbHr = cruiseHr > 0 ? cruiseContingencyFuel / cruiseHr : 0;
      const specificRangeNmLb = cruiseContingencyFuel > 0
        ? groundRangeNm / cruiseContingencyFuel : 0;

      return {
        feasible: true,
        rangeNm: Math.max(0, rangeNm),
        w0,
        ldCruise,
        fuelBreakdown: {
          fuelTO,
          fuelClimb,
          fuelCruiseContingency: cruiseContingencyFuel,
          reserveFuel,
          reserveBreakdown: reserveResult.breakdown,
        },
        tripFuel: fuelTO + fuelClimb + cruiseContingencyFuel,
        totalReserve: reserveFuel,
        climbDistNm,
        flightTimeMin,
        climbTimeMin,
        cruiseTimeMin,
        avgFuelFlowLbHr,
        specificRangeNmLb,
      };
    }
  }

  return infeasible;
}

// ── Feasibility check for a specific route ────────────────────

export interface FeasibilityResult {
  feasible: boolean;
  maxRange: number;
  requiredRange: number;
  rangeMargin: number;
  mission: MissionResult;
}

export function checkFeasibility(
  ac: AircraftConfig,
  payloadLb: number,
  fuelLb: number,
  distanceNm: number,
  windKts: number = 0,
): FeasibilityResult {
  const mission = computeRange(ac, payloadLb, fuelLb, windKts);
  return {
    feasible: mission.feasible && mission.rangeNm >= distanceNm,
    maxRange: mission.rangeNm,
    requiredRange: distanceNm,
    rangeMargin: mission.rangeNm - distanceNm,
    mission,
  };
}

// ── Route-specific computation ────────────────────────────────

export interface RouteResult {
  flightTimeMin: number;
  climbTimeMin: number;
  cruiseTimeMin: number;
  fuelRequired: number;      // Total mission fuel for this route [lb]
  cruiseFuel: number;
}

/**
 * Compute flight time and fuel for a specific route distance.
 * Uses the same climb + Breguet model but for a known distance
 * instead of burning all available fuel.
 */
export function computeRouteMetrics(
  ac: AircraftConfig,
  payloadLb: number,
  fuelLb: number,
  routeDistNm: number,
  windKts: number = 0,
): RouteResult | null {
  const acK = K(ac);
  const w0 = ac.we + crewWeight(ac) + payloadLb + fuelLb;

  // Seg 1: TO
  const w1 = w0 * 0.97;
  const fuelTO = w0 - w1;

  // Seg 2: Climb
  const climb = computeClimb(ac, w1);
  const w2 = climb.wEnd;
  const climbTimeMin = climb.timeSec / 60;

  // Cruise distance = route distance minus climb distance credit
  const cruiseDistNm = Math.max(0, routeDistNm - climb.distanceNm);

  // Ground speed and TAS
  const vGroundKts = groundSpeedKts(ac.cruiseMach, ac.cruiseAlt, windKts);
  if (vGroundKts <= 0) return null;
  const vTasKts = tasFromMach(ac.cruiseMach, ac.cruiseAlt) / KTS_TO_FPS;
  const vTasFps = tasFromMach(ac.cruiseMach, ac.cruiseAlt);

  // Cruise L/D
  const q = dynamicPressureMach(ac.cruiseMach, ac.cruiseAlt);
  const cl = (w2 / ac.wingArea) / q;
  const cd = ac.cd0 + acK * cl * cl;
  const ld = cl / cd;

  // Air distance for this ground distance
  const airDistNm = cruiseDistNm * (vTasKts / vGroundKts);

  // Breguet: fuel = W2 * (1 - exp(-R_air * C / (V_TAS * LD)))
  const wRatio = Math.exp(-(airDistNm * NM_TO_FT) * (ac.tsfcCruise / 3600) / (vTasFps * ld));
  const cruiseFuel = w2 * (1 - wRatio);

  // Times
  const cruiseTimeMin = (cruiseDistNm / vGroundKts) * 60;
  const toTimeMin = 5;
  const flightTimeMin = toTimeMin + climbTimeMin + cruiseTimeMin;

  return {
    flightTimeMin,
    climbTimeMin,
    cruiseTimeMin,
    fuelRequired: fuelTO + climb.fuelBurned + cruiseFuel,
    cruiseFuel,
  };
}
