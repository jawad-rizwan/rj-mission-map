/**
 * ISA Standard Atmosphere model.
 * Direct port of rj-mission-analysis/atmosphere.py.
 */

import { GAMMA, R_AIR, G, T_SL, P_SL, RHO_SL, LAPSE, TROPO } from './constants';

export interface IsaResult {
  T: number;    // Temperature [°R]
  P: number;    // Pressure [psf]
  rho: number;  // Density [slug/ft³]
  a: number;    // Speed of sound [ft/s]
}

export function isa(hFt: number): IsaResult {
  let T: number, P: number, rho: number;

  if (hFt <= TROPO) {
    T = T_SL - LAPSE * hFt;
    P = P_SL * Math.pow(T / T_SL, 5.2561);
    rho = RHO_SL * Math.pow(T / T_SL, 4.2561);
  } else {
    const T_tr = T_SL - LAPSE * TROPO;
    const P_tr = P_SL * Math.pow(T_tr / T_SL, 5.2561);
    const rho_tr = RHO_SL * Math.pow(T_tr / T_SL, 4.2561);
    T = T_tr;
    const k = (-G / (R_AIR * T_tr)) * (hFt - TROPO);
    P = P_tr * Math.exp(k);
    rho = rho_tr * Math.exp(k);
  }

  const a = Math.sqrt(GAMMA * R_AIR * T);
  return { T, P, rho, a };
}

export function sigma(hFt: number): number {
  return isa(hFt).rho / RHO_SL;
}

export function tasFromMach(mach: number, hFt: number): number {
  return mach * isa(hFt).a;
}

export function dynamicPressureMach(mach: number, hFt: number): number {
  return 0.5 * GAMMA * isa(hFt).P * mach * mach;
}

export function thrustLapse(hFt: number, bpr: number = 9.0): number {
  const exp = bpr >= 5.0 ? 0.7 : 0.8;
  return Math.pow(sigma(hFt), exp);
}
