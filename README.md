# RJ Mission Map

Interactive range analysis and mission simulation tool for the ZRJ aircraft family (ZRJ50, ZRJ70, ZRJ100).

## Features

- **Dynamic range rings** — geodesic range circles on a Leaflet map that update in real-time as you adjust payload and fuel
- **Aircraft selector** — switch between ZRJ50 (50-seat, scope-clause limited), ZRJ70 (76-seat), and ZRJ100 (100-seat EU variant)
- **Linked payload/fuel sliders** — coupled by the MTOW constraint with a visual weight bar
- **Mission mode** — select departure and arrival airports (490 airports, IATA/ICAO search) to check GO/NO-GO feasibility
- **Great-circle routing** — route overlay with haversine distance computation
- **Wind component** — headwind/tailwind slider (+/-100 kts) that adjusts the Breguet range equation
- **Unit toggle** — switch between nm/km, lb/kg, kts/km/h at any time

## Performance Engine

The range computation is a simplified single-pass approximation of the full 9-segment FAR 121.645 mission profile from the [rj-mission-analysis](../rj-mission-analysis) repository:

| Segment | Method |
|---------|--------|
| Warmup & Takeoff | Weight fraction 0.97 |
| Climb to FL350 | Step-integration (35 x 1000 ft, thrust lapse + drag polar) |
| Cruise | Breguet range equation with drag-polar L/D |
| Contingency | 10% cruise time, absorbed into effective TSFC |
| Reserves | Go-around climb + 100 nm divert + 30 min hold + landing |

**Validation against full mission analysis:**

| Variant | Engine Result | Reference | Error |
|---------|--------------|-----------|-------|
| ZRJ50 @ 65,000 lb | 588 nm | 587 nm | +0.2% |
| ZRJ70 @ 84,059 lb | 1,803 nm | 1,803 nm | 0.0% |
| ZRJ100 @ 92,484 lb | 1,505 nm | 1,504 nm | +0.1% |

## Aircraft Data

All constants sourced from `rj-mission-analysis` (canonical upstream):

| | ZRJ50 | ZRJ70 | ZRJ100 |
|---|---|---|---|
| Seats | 50 | 76 | 100 |
| OEW | 44,765 lb | 44,962 lb | 47,892 lb |
| MTOW | 65,000 lb | 84,059 lb | 92,484 lb |
| Fuel tank | 19,000 lb | 19,000 lb | 19,000 lb |
| Max fuel @ full payload | 8,885 lb | 18,750 lb | 18,500 lb |
| Cruise | M0.78 @ FL350 | M0.78 @ FL350 | M0.78 @ FL350 |
| (L/D)max | 15.50 | 15.50 | 15.23 |
| Engine | 2x PW1200G GTF, 38,380 lb total thrust |

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Payload-Range Chart

Generate a standalone payload-range PNG for `ZRJ70` and `ZRJ100` with:

```bash
python3 scripts/generate_payload_range.py
```

Default output:

```text
charts/payload_range_zrj70_zrj100.png
```

## Mission Profile Charts

Generate Raymer-style mission-profile PNGs for the mission-map model with:

```bash
python3 scripts/generate_mission_profile.py
```

Default outputs:

```text
charts/mission_profile_zrj70_max_payload.png
charts/mission_profile_zrj100_max_payload.png
```

## Project Structure

```
src/
├── engine/          # Pure TypeScript performance engine (zero React deps)
│   ├── aircraft.ts  # ZRJ50/70/100 config data
│   ├── atmosphere.ts # ISA standard atmosphere
│   ├── mission.ts   # Range computation (simplified FAR 121.645)
│   ├── geo.ts       # Haversine, great-circle, range ring points
│   ├── wind.ts      # Wind model
│   └── units.ts     # Unit conversion
├── data/
│   └── airports.ts  # 490 airports with search
├── components/      # React UI components
├── hooks/           # Custom hooks
└── store/           # App state (Context + useReducer)
```

## Related Repositories

- [rj-mission-analysis](../rj-mission-analysis) — Chapter 17 physics-based mission analysis
- [rj-flight-performance](../rj-flight-performance) — Complete flight performance toolkit (Raymer Ch. 17)

## Wind Model Roadmap

- **Phase 1 (current):** Global headwind/tailwind scalar slider
- **Phase 2:** Vector wind (direction + magnitude) producing asymmetric range rings
- **Phase 3:** NOAA GFS atmospheric data integration at FL350

## References

- Raymer, D. P. *Aircraft Design: A Conceptual Approach*, 7th Ed., AIAA, 2024
- FAR 121.645 — Fuel requirements: international operations
