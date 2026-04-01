/**
 * ISA Standard Atmosphere constants and unit conversion factors.
 * Matches rj-mission-analysis/atmosphere.py exactly.
 */

// ISA sea-level conditions
export const GAMMA = 1.4;
export const R_AIR = 1716.49;        // ft·lbf/(slug·°R)
export const G = 32.174;             // ft/s²
export const T_SL = 518.67;          // °R (sea level temperature)
export const P_SL = 2116.22;         // psf (sea level pressure)
export const RHO_SL = 0.002377;      // slug/ft³ (sea level density)
export const LAPSE = 0.003566;       // °R/ft (troposphere lapse rate)
export const TROPO = 36089.0;        // ft (tropopause altitude)

// Unit conversion factors
export const NM_TO_FT = 6076.115;
export const KTS_TO_FPS = 1.68781;
export const NM_TO_KM = 1.852;
export const LB_TO_KG = 0.453592;
export const KTS_TO_KMH = 1.852;

// Earth radius
export const R_EARTH_NM = 3440.065;
