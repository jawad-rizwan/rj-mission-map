/**
 * Runway database for airports served by ZRJ regional jets.
 * Each entry represents the longest runway at the given airport.
 * All lengths and widths in feet; surface is "asphalt" or "concrete".
 */

export interface Runway {
  icao: string;
  designation: string;    // e.g. "09L/27R"
  lengthFt: number;
  widthFt: number;
  surface: string;        // "asphalt", "concrete", etc.
}

export const RUNWAYS: Runway[] = [
  // ── Major US Hubs ───────────────────────────────────────────────────────
  { icao: "KATL", designation: "10/28",   lengthFt: 12390, widthFt: 150, surface: "concrete" },
  { icao: "KORD", designation: "10C/28C", lengthFt: 13000, widthFt: 200, surface: "concrete" },
  { icao: "KLAX", designation: "07L/25R", lengthFt: 12091, widthFt: 150, surface: "asphalt" },
  { icao: "KDFW", designation: "17C/35C", lengthFt: 13401, widthFt: 200, surface: "concrete" },
  { icao: "KDEN", designation: "16R/34L", lengthFt: 16000, widthFt: 200, surface: "concrete" },
  { icao: "KJFK", designation: "13R/31L", lengthFt: 14511, widthFt: 200, surface: "asphalt" },
  { icao: "KSFO", designation: "28R/10L", lengthFt: 11870, widthFt: 200, surface: "asphalt" },
  { icao: "KLAS", designation: "08L/26R", lengthFt: 14510, widthFt: 150, surface: "asphalt" },
  { icao: "KPHX", designation: "08/26",   lengthFt: 11489, widthFt: 150, surface: "asphalt" },
  { icao: "KIAH", designation: "15R/33L", lengthFt: 12001, widthFt: 150, surface: "concrete" },
  { icao: "KMIA", designation: "09/27",   lengthFt: 13016, widthFt: 200, surface: "asphalt" },
  { icao: "KBOS", designation: "04R/22L", lengthFt: 10083, widthFt: 150, surface: "asphalt" },
  { icao: "KMSP", designation: "12R/30L", lengthFt: 11006, widthFt: 200, surface: "concrete" },
  { icao: "KDTW", designation: "04R/22L", lengthFt: 12003, widthFt: 200, surface: "concrete" },
  { icao: "KFLL", designation: "10L/28R", lengthFt: 9000,  widthFt: 150, surface: "asphalt" },
  { icao: "KSEA", designation: "16L/34R", lengthFt: 11901, widthFt: 150, surface: "concrete" },
  { icao: "KEWR", designation: "04L/22R", lengthFt: 11000, widthFt: 150, surface: "asphalt" },
  { icao: "KEYW", designation: "09/27",   lengthFt: 5076,  widthFt: 100, surface: "asphalt" },
  { icao: "KMCO", designation: "18R/36L", lengthFt: 12005, widthFt: 200, surface: "concrete" },
  { icao: "KCLT", designation: "18R/36L", lengthFt: 10000, widthFt: 150, surface: "concrete" },
  { icao: "KPHL", designation: "09R/27L", lengthFt: 10506, widthFt: 200, surface: "asphalt" },
  { icao: "KBWI", designation: "10/28",   lengthFt: 10502, widthFt: 150, surface: "asphalt" },
  { icao: "KDCA", designation: "01/19",   lengthFt: 7169,  widthFt: 150, surface: "asphalt" },
  { icao: "KMDW", designation: "04R/22L", lengthFt: 6522,  widthFt: 150, surface: "asphalt" },
  { icao: "KSLC", designation: "16R/34L", lengthFt: 12003, widthFt: 150, surface: "asphalt" },
  { icao: "KSAN", designation: "09/27",   lengthFt: 9401,  widthFt: 200, surface: "asphalt" },
  { icao: "KTPA", designation: "01L/19R", lengthFt: 11002, widthFt: 150, surface: "asphalt" },
  { icao: "KSTL", designation: "12R/30L", lengthFt: 11019, widthFt: 200, surface: "concrete" },
  { icao: "KPIT", designation: "10R/28L", lengthFt: 11500, widthFt: 200, surface: "concrete" },
  { icao: "KCMH", designation: "10L/28R", lengthFt: 10125, widthFt: 150, surface: "asphalt" },
  { icao: "KIND", designation: "05L/23R", lengthFt: 11200, widthFt: 150, surface: "asphalt" },
  { icao: "KCLE", designation: "06L/24R", lengthFt: 9956,  widthFt: 150, surface: "asphalt" },
  { icao: "KMKE", designation: "01L/19R", lengthFt: 9690,  widthFt: 200, surface: "concrete" },
  { icao: "KAUS", designation: "17R/35L", lengthFt: 12248, widthFt: 150, surface: "asphalt" },
  { icao: "KBNA", designation: "02R/20L", lengthFt: 11030, widthFt: 150, surface: "asphalt" },
  { icao: "KRDU", designation: "05L/23R", lengthFt: 10000, widthFt: 150, surface: "asphalt" },
  { icao: "KSMF", designation: "16R/34L", lengthFt: 8601,  widthFt: 150, surface: "concrete" },
  { icao: "KPDX", designation: "10L/28R", lengthFt: 11000, widthFt: 150, surface: "asphalt" },
  { icao: "KSAT", designation: "12R/30L", lengthFt: 8505,  widthFt: 150, surface: "asphalt" },
  { icao: "KMCI", designation: "01L/19R", lengthFt: 10801, widthFt: 150, surface: "concrete" },
  { icao: "KABQ", designation: "08/26",   lengthFt: 13793, widthFt: 150, surface: "asphalt" },
  { icao: "KONT", designation: "08L/26R", lengthFt: 12197, widthFt: 200, surface: "concrete" },
  { icao: "KOAK", designation: "12/30",   lengthFt: 10520, widthFt: 150, surface: "asphalt" },
  { icao: "KSJC", designation: "12R/30L", lengthFt: 11000, widthFt: 150, surface: "asphalt" },
  { icao: "PANC", designation: "07R/25L", lengthFt: 10897, widthFt: 200, surface: "asphalt" },
  { icao: "PHNL", designation: "08L/26R", lengthFt: 12357, widthFt: 200, surface: "asphalt" },

  // ── Canada ──────────────────────────────────────────────────────────────
  { icao: "CYYZ", designation: "05/23",   lengthFt: 11120, widthFt: 200, surface: "asphalt" },
  { icao: "CYUL", designation: "06R/24L", lengthFt: 11000, widthFt: 200, surface: "asphalt" },
  { icao: "CYVR", designation: "08L/26R", lengthFt: 11500, widthFt: 200, surface: "asphalt" },
  { icao: "CYYC", designation: "17L/35R", lengthFt: 14000, widthFt: 200, surface: "asphalt" },
  { icao: "CYOW", designation: "14/32",   lengthFt: 10000, widthFt: 200, surface: "asphalt" },
  { icao: "CYEG", designation: "12/30",   lengthFt: 11000, widthFt: 200, surface: "asphalt" },
  { icao: "CYRB", designation: "17/35",   lengthFt: 6500,  widthFt: 200, surface: "gravel" },
  { icao: "CYWG", designation: "13/31",   lengthFt: 11000, widthFt: 200, surface: "asphalt" },
  { icao: "CYQB", designation: "06/24",   lengthFt: 9000,  widthFt: 200, surface: "asphalt" },
  { icao: "CYHZ", designation: "05/23",   lengthFt: 8800,  widthFt: 200, surface: "asphalt" },
  { icao: "CYQR", designation: "13/31",   lengthFt: 6900,  widthFt: 150, surface: "asphalt" },
  { icao: "CYXE", designation: "09/27",   lengthFt: 8300,  widthFt: 200, surface: "asphalt" },
  { icao: "CYYT", designation: "11/29",   lengthFt: 8502,  widthFt: 200, surface: "asphalt" },
  { icao: "CYYJ", designation: "09/27",   lengthFt: 7000,  widthFt: 200, surface: "asphalt" },
  { icao: "CYFC", designation: "09/27",   lengthFt: 6000,  widthFt: 150, surface: "asphalt" },
  { icao: "CYSB", designation: "04/22",   lengthFt: 6600,  widthFt: 150, surface: "asphalt" },
  { icao: "CYQM", designation: "06/24",   lengthFt: 6000,  widthFt: 150, surface: "asphalt" },
  { icao: "CYAM", designation: "04/22",   lengthFt: 6000,  widthFt: 150, surface: "asphalt" },

  // ── Europe ──────────────────────────────────────────────────────────────
  { icao: "EGLL", designation: "09R/27L", lengthFt: 12799, widthFt: 164, surface: "asphalt" },
  { icao: "LFPG", designation: "09R/27L", lengthFt: 13829, widthFt: 148, surface: "asphalt" },
  { icao: "EDDF", designation: "07C/25C", lengthFt: 13123, widthFt: 148, surface: "concrete" },
  { icao: "EHAM", designation: "18R/36L", lengthFt: 12467, widthFt: 148, surface: "asphalt" },
  { icao: "LEMD", designation: "18L/36R", lengthFt: 14272, widthFt: 197, surface: "asphalt" },
  { icao: "LIRF", designation: "16R/34L", lengthFt: 12795, widthFt: 197, surface: "asphalt" },
  { icao: "LSZH", designation: "16/34",   lengthFt: 12139, widthFt: 197, surface: "concrete" },
  { icao: "EIDW", designation: "10/28",   lengthFt: 8652,  widthFt: 148, surface: "asphalt" },
  { icao: "EKCH", designation: "04R/22L", lengthFt: 11811, widthFt: 148, surface: "asphalt" },
  { icao: "ENGM", designation: "01L/19R", lengthFt: 11811, widthFt: 148, surface: "asphalt" },
  { icao: "ESSA", designation: "01R/19L", lengthFt: 10830, widthFt: 148, surface: "asphalt" },
  { icao: "EFHK", designation: "04R/22L", lengthFt: 11286, widthFt: 197, surface: "asphalt" },
  { icao: "EPWA", designation: "11/29",   lengthFt: 11483, widthFt: 197, surface: "concrete" },
  { icao: "LOWW", designation: "11/29",   lengthFt: 11811, widthFt: 148, surface: "asphalt" },
  { icao: "LKPR", designation: "06/24",   lengthFt: 12191, widthFt: 148, surface: "concrete" },
  { icao: "LPPT", designation: "03/21",   lengthFt: 12484, widthFt: 148, surface: "asphalt" },
  { icao: "LEBL", designation: "07R/25L", lengthFt: 10499, widthFt: 148, surface: "asphalt" },
  { icao: "LGAV", designation: "03R/21L", lengthFt: 13123, widthFt: 148, surface: "concrete" },
  { icao: "LIRQ", designation: "05/23",   lengthFt: 5118,  widthFt: 98,  surface: "asphalt" },

  // ── Latin America ───────────────────────────────────────────────────────
  { icao: "MMMX", designation: "05R/23L", lengthFt: 12966, widthFt: 148, surface: "asphalt" },
  { icao: "SBGR", designation: "09R/27L", lengthFt: 12139, widthFt: 148, surface: "asphalt" },
  { icao: "SCEL", designation: "17R/35L", lengthFt: 10499, widthFt: 148, surface: "asphalt" },
  { icao: "SKBO", designation: "13L/31R", lengthFt: 12467, widthFt: 148, surface: "asphalt" },
  { icao: "SEQM", designation: "18/36",   lengthFt: 13451, widthFt: 148, surface: "asphalt" },
  { icao: "SPJC", designation: "15/33",   lengthFt: 11506, widthFt: 148, surface: "asphalt" },
  { icao: "SAEZ", designation: "11/29",   lengthFt: 10827, widthFt: 148, surface: "concrete" },

  // ── Asia / Pacific ──────────────────────────────────────────────────────
  { icao: "RJTT", designation: "16R/34L", lengthFt: 9843,  widthFt: 197, surface: "asphalt" },
  { icao: "VHHH", designation: "07R/25L", lengthFt: 12467, widthFt: 197, surface: "asphalt" },
  { icao: "WSSS", designation: "02C/20C", lengthFt: 13123, widthFt: 200, surface: "asphalt" },
  { icao: "RKSI", designation: "15L/33R", lengthFt: 12303, widthFt: 200, surface: "asphalt" },
  { icao: "VTBS", designation: "01R/19L", lengthFt: 13123, widthFt: 197, surface: "asphalt" },
  { icao: "RPLL", designation: "06/24",   lengthFt: 7415,  widthFt: 197, surface: "concrete" },
  { icao: "WMKK", designation: "14L/32R", lengthFt: 14764, widthFt: 200, surface: "asphalt" },

  // ── Middle East ─────────────────────────────────────────────────────────
  { icao: "OMDB", designation: "12R/30L", lengthFt: 13123, widthFt: 197, surface: "asphalt" },
  { icao: "OEJN", designation: "16L/34R", lengthFt: 12467, widthFt: 197, surface: "asphalt" },
  { icao: "OTHH", designation: "16R/34L", lengthFt: 15912, widthFt: 197, surface: "asphalt" },

  // ── Africa ──────────────────────────────────────────────────────────────
  { icao: "FAOR", designation: "03L/21R", lengthFt: 14495, widthFt: 200, surface: "asphalt" },
  { icao: "HKJK", designation: "06/24",   lengthFt: 13507, widthFt: 150, surface: "asphalt" },
  { icao: "HAAB", designation: "07R/25L", lengthFt: 12467, widthFt: 148, surface: "asphalt" },
];

/**
 * Returns all runways for a given ICAO code.
 */
export function getRunwaysByIcao(icao: string): Runway[] {
  return RUNWAYS.filter(r => r.icao === icao);
}

/**
 * Returns the longest runway at the given airport, or null if not found.
 */
export function longestRunway(icao: string): Runway | null {
  const rwys = getRunwaysByIcao(icao);
  if (rwys.length === 0) return null;
  return rwys.reduce((a, b) => (a.lengthFt > b.lengthFt ? a : b));
}
