/**
 * Wind model for Breguet range adjustment.
 *
 * Phase 1: Global scalar headwind/tailwind slider.
 * Wind adjusts ground speed: V_ground = V_TAS + windKts
 * (positive = tailwind, negative = headwind)
 */

import { KTS_TO_FPS } from './constants';
import { tasFromMach } from './atmosphere';

/** Compute ground speed [kts] given cruise conditions and wind. */
export function groundSpeedKts(
  cruiseMach: number,
  cruiseAlt: number,
  windKts: number,
): number {
  const vTasFps = tasFromMach(cruiseMach, cruiseAlt);
  const vTasKts = vTasFps / KTS_TO_FPS;
  return vTasKts + windKts;
}
