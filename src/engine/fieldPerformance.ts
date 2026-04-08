/**
 * Field Performance Engine — Takeoff & Landing Analysis.
 * Direct port of rj-flight-performance/perf/takeoff.py & landing.py.
 * Raymer Ch.17 equations with FAR 25 factors.
 */

import { G } from './constants';
import { isaWithDeviation, densityAltitude, thrustAtAltitude } from './atmosphere';
import { type AircraftConfig, totalThrustSL, K as acK } from './aircraft';

// ── V-speeds ─────────────────────────────────────────────────────

function vStall(W: number, S: number, rho: number, clMax: number): number {
  return Math.sqrt((2 * W) / (rho * S * clMax));
}

// ── Ground Roll (Raymer Eq. 17.102-17.104) ──────────────────────

function groundRollToV(
  W: number, S: number, T: number, cd0: number,
  clGround: number, k: number, mu: number, rho: number,
  Vi: number, Vf: number,
): number {
  const KT = (T / W) - mu;
  const KA = (rho / (2.0 * W / S)) * (mu * clGround - cd0 - k * clGround * clGround);

  if (Math.abs(KA) < 1e-10) {
    return (Vf * Vf - Vi * Vi) / (2.0 * G * KT);
  }
  return (1.0 / (2.0 * G * KA)) * Math.log(
    (KT + KA * Vf * Vf) / (KT + KA * Vi * Vi),
  );
}

// ── Rotation ─────────────────────────────────────────────────────

const T_ROTATE = 3.0; // seconds

function rotationDistance(vR: number): number {
  return vR * T_ROTATE;
}

// ── Transition (Eq. 17.105-17.112) ──────────────────────────────

interface TransitionResult {
  vTR: number;
  R: number;
  gammaRad: number;
  sTR: number;
  hTR: number;
}

function transitionSegment(
  W: number, S: number, rho: number, clMaxTO: number,
  TW: number, cd0: number, k: number,
): TransitionResult {
  const Vs = vStall(W, S, rho, clMaxTO);
  const vTR = 1.15 * Vs;
  const n = 1.2;
  const R = vTR * vTR / (G * (n - 1)); // Eq. 17.107

  const CLTR = n * clMaxTO / (1.15 * 1.15);
  const CDTR = cd0 + k * CLTR * CLTR;
  const LDclimb = CLTR / CDTR;

  const sinGamma = Math.max(0, Math.min(1, TW - 1 / Math.max(LDclimb, 1)));
  const gamma = Math.asin(sinGamma);

  return {
    vTR,
    R,
    gammaRad: gamma,
    sTR: R * Math.sin(gamma),
    hTR: R * (1 - Math.cos(gamma)),
  };
}

// ── Climb to clear obstacle (Eq. 17.112) ────────────────────────

function climbDistance(hObstacle: number, hTR: number, gamma: number): number {
  if (hTR >= hObstacle) return 0;
  return (hObstacle - hTR) / Math.tan(gamma);
}

// ── Total Takeoff Distance (all-engines) ─────────────────────────

interface TakeoffResult {
  vStallTO: number;
  vR: number;
  v2: number;
  sGroundRoll: number;
  sRotation: number;
  sTransition: number;
  sClimb: number;
  todr: number;
  todrFactored: number; // × 1.15 FAR 25.113(a)
}

function totalTakeoffDistance(
  W: number, S: number, T: number, cd0: number, clGround: number,
  k: number, mu: number, rho: number, clMaxTO: number, hObstacle: number,
): TakeoffResult {
  const Vs = vStall(W, S, rho, clMaxTO);
  const vR = 1.1 * Vs;
  const v2 = 1.2 * Vs;
  const TW = T / W;

  const sG = groundRollToV(W, S, T, cd0, clGround, k, mu, rho, 0, vR);
  const sR = rotationDistance(vR);

  const trans = transitionSegment(W, S, rho, clMaxTO, TW, cd0, k);
  let sTR: number;
  let sC: number;

  if (trans.hTR >= hObstacle) {
    // Obstacle cleared during transition — truncate arc
    const theta = Math.acos(Math.max(-1, Math.min(1, 1 - hObstacle / trans.R)));
    sTR = trans.R * Math.sin(theta);
    sC = 0;
  } else {
    sTR = trans.sTR;
    sC = trans.gammaRad > 0.01
      ? climbDistance(hObstacle, trans.hTR, trans.gammaRad)
      : 0;
  }

  const todr = sG + sR + sTR + sC;

  return {
    vStallTO: Vs,
    vR,
    v2,
    sGroundRoll: sG,
    sRotation: sR,
    sTransition: sTR,
    sClimb: sC,
    todr,
    todrFactored: 1.15 * todr,
  };
}

// ── Braking Distance ─────────────────────────────────────────────

function brakingDistanceFromV(
  W: number, S: number, V: number, muBrake: number,
  rho: number, cd0: number, clGround: number, k: number,
  Tidle: number = 0, Treverse: number = 0,
): number {
  const Tnet = Tidle - Treverse;
  const KT = (Tnet / W) - muBrake;
  const KA = (rho / (2.0 * W / S)) * (muBrake * clGround - cd0 - k * clGround * clGround);

  if (Math.abs(KA) < 1e-10) {
    return -V * V / (2.0 * G * KT);
  }
  return Math.abs(
    (1.0 / (2.0 * G * KA)) * Math.log(KT / (KT + KA * V * V)),
  );
}

// ── Accelerate-Stop Distance ─────────────────────────────────────

const T_REACT = 2.0; // pilot reaction time [s]

function accelerateStopDistance(
  W: number, S: number, T: number, cd0: number, clGround: number,
  k: number, muRoll: number, muBrake: number, rho: number,
  vEF: number,
): number {
  const sAccel = groundRollToV(W, S, T, cd0, clGround, k, muRoll, rho, 0, vEF);
  const sReact = vEF * T_REACT;
  const sBrake = brakingDistanceFromV(W, S, vEF, muBrake, rho, cd0, clGround, k);
  return sAccel + sReact + sBrake;
}

// ── Accelerate-Go Distance (OEI) ────────────────────────────────

function accelerateGoDistance(
  W: number, S: number, T: number, cd0: number, clGround: number,
  k: number, muRoll: number, rho: number, clMaxTO: number,
  hObstacle: number, vEF: number, nEngines: number,
): number {
  const Vs = vStall(W, S, rho, clMaxTO);
  const vR = 1.1 * Vs;

  // Phase 1: all-engine acceleration 0 → V_EF
  const s1 = groundRollToV(W, S, T, cd0, clGround, k, muRoll, rho, 0, vEF);

  // Phase 2: OEI acceleration V_EF → V_R
  const TOEI = T * (nEngines - 1) / nEngines;
  const cd0OEI = cd0 + 0.005; // windmilling drag increment
  const s2 = vEF < vR
    ? groundRollToV(W, S, TOEI, cd0OEI, clGround, k, muRoll, rho, vEF, vR)
    : 0;

  // Rotation
  const sR = rotationDistance(vR);

  // Transition + climb (OEI)
  const TWOEI = TOEI / W;
  const trans = transitionSegment(W, S, rho, clMaxTO, TWOEI, cd0OEI, k);
  let sTR: number;
  let sC: number;

  if (trans.hTR >= hObstacle) {
    const theta = Math.acos(Math.max(-1, Math.min(1, 1 - hObstacle / trans.R)));
    sTR = trans.R * Math.sin(theta);
    sC = 0;
  } else {
    sTR = trans.sTR;
    sC = trans.gammaRad > 0.01
      ? climbDistance(hObstacle, trans.hTR, trans.gammaRad)
      : 0;
  }

  return s1 + s2 + sR + sTR + sC;
}

// ── V1 / BFL (bisection) ────────────────────────────────────────

interface BflResult {
  v1: number;
  bfl: number;
}

function findV1andBFL(
  W: number, S: number, T: number, cd0: number, clGround: number,
  k: number, muRoll: number, muBrake: number, rho: number,
  clMaxTO: number, hObstacle: number, nEngines: number,
): BflResult {
  const Vs = vStall(W, S, rho, clMaxTO);
  const vR = 1.1 * Vs;
  const vMCG = 0.85 * Vs; // typical twin-jet estimate

  let vLo = 0.5 * Vs;
  let vHi = vR;

  for (let i = 0; i < 60; i++) {
    const vMid = 0.5 * (vLo + vHi);
    const asd = accelerateStopDistance(W, S, T, cd0, clGround, k, muRoll, muBrake, rho, vMid);
    const agd = accelerateGoDistance(W, S, T, cd0, clGround, k, muRoll, rho, clMaxTO, hObstacle, vMid, nEngines);

    if (asd < agd) {
      vLo = vMid;
    } else {
      vHi = vMid;
    }
    if (Math.abs(asd - agd) < 1.0) break;
  }

  const v1Balanced = 0.5 * (vLo + vHi);
  const v1 = Math.max(v1Balanced, vMCG);

  const asdFinal = accelerateStopDistance(W, S, T, cd0, clGround, k, muRoll, muBrake, rho, v1);
  const agdFinal = accelerateGoDistance(W, S, T, cd0, clGround, k, muRoll, rho, clMaxTO, hObstacle, v1, nEngines);

  return { v1, bfl: Math.max(asdFinal, agdFinal) };
}

// ── Landing ──────────────────────────────────────────────────────

interface LandingResult {
  vStallL: number;
  vApproach: number;
  vTD: number;
  sApproach: number;
  sFlare: number;
  sFreeRoll: number;
  sBraking: number;
  ldTotal: number;
  ldrFar: number;    // / 0.6 FAR 25.125
  ldrFarWet: number; // × 1.15 additional
}

const T_FREE = 3.0;           // free-roll seconds
const GLIDESLOPE_DEG = 3.0;   // standard approach angle

function totalLandingDistance(
  W: number, S: number, rho: number, clMaxL: number, cd0: number,
  clGround: number, k: number, muBrake: number, hObstacle: number,
): LandingResult {
  const Vs = vStall(W, S, rho, clMaxL);
  const vApp = 1.3 * Vs;
  const vTD = 1.15 * Vs;
  const vFlare = 1.23 * Vs;

  const gammaA = GLIDESLOPE_DEG * Math.PI / 180;
  const n = 1.2;
  const R = vFlare * vFlare / (G * (n - 1));

  // Flare
  const hF = R * (1 - Math.cos(gammaA));
  const sFlare = R * Math.sin(gammaA);

  // Approach (from obstacle to flare initiation)
  const sApproach = hF < hObstacle
    ? (hObstacle - hF) / Math.tan(gammaA)
    : 0;

  // Free roll
  const sFreeRoll = vTD * T_FREE;

  // Braking
  const sBraking = brakingDistanceFromV(W, S, vTD, muBrake, rho, cd0, clGround, k);

  const ldTotal = sApproach + sFlare + sFreeRoll + sBraking;
  const ldrFar = ldTotal / 0.6;        // FAR 25.125
  const ldrFarWet = ldrFar * 1.15;     // wet correction

  return {
    vStallL: Vs,
    vApproach: vApp,
    vTD,
    sApproach,
    sFlare,
    sFreeRoll,
    sBraking,
    ldTotal,
    ldrFar,
    ldrFarWet,
  };
}

// ── Public Interface ─────────────────────────────────────────────

export interface FieldPerfResult {
  // V-speeds [ft/s]
  vStallTO: number;
  vR: number;
  v2: number;
  vStallL: number;
  vApproach: number;
  vTD: number;

  // Takeoff segments [ft]
  toGroundRoll: number;
  toRotation: number;
  toTransition: number;
  toClimb: number;
  todr: number;
  todrFactored: number;

  // BFL [ft]
  v1: number;
  bfl: number;

  // Landing segments [ft]
  ldApproach: number;
  ldFlare: number;
  ldFreeRoll: number;
  ldBraking: number;
  ldTotal: number;
  ldrFar: number;
  ldrFarWet: number;

  // Environment
  densityAltFt: number;
  rho: number;
  thrustAvailable: number;
}

export function computeFieldPerformance(
  ac: AircraftConfig,
  takeoffWeightLb: number,
  landingWeightLb: number,
  elevationFt: number,
  deltaIsaC: number,
  muRollFactor: number,
  muBrakeFactor: number,
): FieldPerfResult {
  const atm = isaWithDeviation(elevationFt, deltaIsaC);
  const rho = atm.rho;
  const T = thrustAtAltitude(totalThrustSL(ac), elevationFt, ac.bpr, deltaIsaC);
  const k = acK(ac);
  const muRoll = ac.muRoll * muRollFactor;
  const muBrake = ac.muBrake * muBrakeFactor;
  const da = densityAltitude(elevationFt, deltaIsaC);

  // Takeoff
  const to = totalTakeoffDistance(
    takeoffWeightLb, ac.wingArea, T, ac.cd0, ac.clGround,
    k, muRoll, rho, ac.clMaxTO, ac.hObstacleTO,
  );

  // BFL
  const bflResult = findV1andBFL(
    takeoffWeightLb, ac.wingArea, T, ac.cd0, ac.clGround,
    k, muRoll, muBrake, rho, ac.clMaxTO, ac.hObstacleTO, ac.nEngines,
  );

  // Landing
  const ld = totalLandingDistance(
    landingWeightLb, ac.wingArea, rho, ac.clMaxL, ac.cd0,
    ac.clGround, k, muBrake, ac.hObstacleL,
  );

  return {
    vStallTO: to.vStallTO,
    vR: to.vR,
    v2: to.v2,
    vStallL: ld.vStallL,
    vApproach: ld.vApproach,
    vTD: ld.vTD,

    toGroundRoll: to.sGroundRoll,
    toRotation: to.sRotation,
    toTransition: to.sTransition,
    toClimb: to.sClimb,
    todr: to.todr,
    todrFactored: to.todrFactored,

    v1: bflResult.v1,
    bfl: bflResult.bfl,

    ldApproach: ld.sApproach,
    ldFlare: ld.sFlare,
    ldFreeRoll: ld.sFreeRoll,
    ldBraking: ld.sBraking,
    ldTotal: ld.ldTotal,
    ldrFar: ld.ldrFar,
    ldrFarWet: ld.ldrFarWet,

    densityAltFt: da,
    rho,
    thrustAvailable: T,
  };
}

export interface RunwayCheckResult {
  todrFactored: number;
  bfl: number;
  ldrFar: number;
  ldrFarWet: number;
  runwayLengthFt: number;
  takeoffOk: boolean;
  landingDryOk: boolean;
  landingWetOk: boolean;
  toMarginFt: number;
  ldMarginDryFt: number;
  ldMarginWetFt: number;
}

export function checkRunway(
  perf: FieldPerfResult,
  runwayLengthFt: number,
): RunwayCheckResult {
  const criticalTO = Math.max(perf.todrFactored, perf.bfl);
  return {
    todrFactored: perf.todrFactored,
    bfl: perf.bfl,
    ldrFar: perf.ldrFar,
    ldrFarWet: perf.ldrFarWet,
    runwayLengthFt,
    takeoffOk: criticalTO <= runwayLengthFt,
    landingDryOk: perf.ldrFar <= runwayLengthFt,
    landingWetOk: perf.ldrFarWet <= runwayLengthFt,
    toMarginFt: runwayLengthFt - criticalTO,
    ldMarginDryFt: runwayLengthFt - perf.ldrFar,
    ldMarginWetFt: runwayLengthFt - perf.ldrFarWet,
  };
}
