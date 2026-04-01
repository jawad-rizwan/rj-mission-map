/**
 * Geodesic calculations: haversine distance, destination point, great-circle arc.
 */

import { R_EARTH_NM } from './constants';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/** Haversine distance between two points [nm]. */
export function haversineNm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const φ1 = lat1 * DEG2RAD;
  const φ2 = lat2 * DEG2RAD;
  const Δφ = (lat2 - lat1) * DEG2RAD;
  const Δλ = (lon2 - lon1) * DEG2RAD;

  const a = Math.sin(Δφ / 2) ** 2
          + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R_EARTH_NM * c;
}

/** Destination point given start, bearing [deg], and distance [nm]. */
export function destinationPoint(
  lat: number, lon: number,
  distNm: number, bearingDeg: number,
): [number, number] {
  const φ1 = lat * DEG2RAD;
  const λ1 = lon * DEG2RAD;
  const θ = bearingDeg * DEG2RAD;
  const d = distNm / R_EARTH_NM;

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(d) + Math.cos(φ1) * Math.sin(d) * Math.cos(θ),
  );
  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(d) * Math.cos(φ1),
    Math.cos(d) - Math.sin(φ1) * Math.sin(φ2),
  );

  return [φ2 * RAD2DEG, λ2 * RAD2DEG];
}

/** Generate N points on a range ring (geodesic circle). */
export function rangeRingPoints(
  centerLat: number, centerLon: number,
  rangeNm: number,
  numPoints: number = 360,
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i < numPoints; i++) {
    const bearing = (i * 360) / numPoints;
    points.push(destinationPoint(centerLat, centerLon, rangeNm, bearing));
  }
  return points;
}

/** Generate points along a great-circle arc between two points. */
export function greatCircleArc(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
  numPoints: number = 100,
): [number, number][] {
  const φ1 = lat1 * DEG2RAD;
  const λ1 = lon1 * DEG2RAD;
  const φ2 = lat2 * DEG2RAD;
  const λ2 = lon2 * DEG2RAD;

  const d = 2 * Math.asin(Math.sqrt(
    Math.sin((φ2 - φ1) / 2) ** 2
    + Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2,
  ));

  if (d < 1e-10) return [[lat1, lon1]];

  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * RAD2DEG;
    const lon = Math.atan2(y, x) * RAD2DEG;
    points.push([lat, lon]);
  }
  return points;
}
