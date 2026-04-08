#!/usr/bin/env python3
from __future__ import annotations

import argparse
import math
import os
from dataclasses import dataclass
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib-rj-mission-map")

import matplotlib.pyplot as plt


GAMMA = 1.4
R_AIR = 1716.49
G = 32.174
T_SL = 518.67
P_SL = 2116.22
RHO_SL = 0.002377
LAPSE = 0.003566
TROPO = 36089.0
NM_TO_FT = 6076.115
KTS_TO_FPS = 1.68781


@dataclass(frozen=True)
class AircraftConfig:
    name: str
    seats: int
    we: float
    n_pilots: int
    n_flight_attendants: int
    person_weight: float
    max_payload: float
    fuel_tank_capacity: float
    mtow_limit: float
    cd0: float
    aspect_ratio: float
    oswald_e: float
    wing_area: float
    cruise_mach: float
    cruise_alt: float
    tsfc_cruise: float
    tsfc_loiter: float
    thrust_per_engine: float
    n_engines: int
    bpr: float
    trapped_fuel_factor: float
    alternate_range: float


ZRJ70 = AircraftConfig(
    name="ZRJ70",
    seats=76,
    we=44_174,
    n_pilots=2,
    n_flight_attendants=2,
    person_weight=197,
    max_payload=20_347,
    fuel_tank_capacity=19_000,
    mtow_limit=84_059,
    cd0=0.01853,
    aspect_ratio=7.8,
    oswald_e=0.727,
    wing_area=1016.58,
    cruise_mach=0.78,
    cruise_alt=35_000,
    tsfc_cruise=0.5167,
    tsfc_loiter=0.4134,
    thrust_per_engine=19_190,
    n_engines=2,
    bpr=9.0,
    trapped_fuel_factor=1.06,
    alternate_range=100,
)

ZRJ100 = AircraftConfig(
    name="ZRJ100",
    seats=100,
    we=47_104,
    n_pilots=2,
    n_flight_attendants=2,
    person_weight=197,
    max_payload=26_092,
    fuel_tank_capacity=19_000,
    mtow_limit=92_484,
    cd0=0.01920,
    aspect_ratio=7.8,
    oswald_e=0.727,
    wing_area=1016.58,
    cruise_mach=0.78,
    cruise_alt=35_000,
    tsfc_cruise=0.5167,
    tsfc_loiter=0.4134,
    thrust_per_engine=19_190,
    n_engines=2,
    bpr=9.0,
    trapped_fuel_factor=1.06,
    alternate_range=100,
)


def display_name(name: str) -> str:
    if name == "ZRJ70":
        return "ZRJ-70"
    if name == "ZRJ100":
        return "ZRJ-100"
    return name


def crew_weight(ac: AircraftConfig) -> float:
    return (ac.n_pilots + ac.n_flight_attendants) * ac.person_weight


def oew(ac: AircraftConfig) -> float:
    return ac.we + crew_weight(ac)


def induced_drag_factor(ac: AircraftConfig) -> float:
    return 1.0 / (math.pi * ac.aspect_ratio * ac.oswald_e)


def ld_max(ac: AircraftConfig) -> float:
    return 1.0 / (2.0 * math.sqrt(ac.cd0 * induced_drag_factor(ac)))


def total_thrust_sl(ac: AircraftConfig) -> float:
    return ac.thrust_per_engine * ac.n_engines


def isa(h_ft: float) -> tuple[float, float, float, float]:
    if h_ft <= TROPO:
      t = T_SL - LAPSE * h_ft
      p = P_SL * (t / T_SL) ** 5.2561
      rho = RHO_SL * (t / T_SL) ** 4.2561
    else:
      t_tr = T_SL - LAPSE * TROPO
      p_tr = P_SL * (t_tr / T_SL) ** 5.2561
      rho_tr = RHO_SL * (t_tr / T_SL) ** 4.2561
      t = t_tr
      k = (-G / (R_AIR * t_tr)) * (h_ft - TROPO)
      p = p_tr * math.exp(k)
      rho = rho_tr * math.exp(k)

    a = math.sqrt(GAMMA * R_AIR * t)
    return t, p, rho, a


def sigma(h_ft: float) -> float:
    return isa(h_ft)[2] / RHO_SL


def tas_from_mach(mach: float, h_ft: float) -> float:
    return mach * isa(h_ft)[3]


def dynamic_pressure_mach(mach: float, h_ft: float) -> float:
    return 0.5 * GAMMA * isa(h_ft)[1] * mach * mach


def thrust_lapse(h_ft: float, bpr: float = 9.0) -> float:
    exponent = 0.7 if bpr >= 5.0 else 0.8
    return sigma(h_ft) ** exponent


def ground_speed_kts(ac: AircraftConfig, wind_kts: float) -> float:
    return tas_from_mach(ac.cruise_mach, ac.cruise_alt) / KTS_TO_FPS + wind_kts


def compute_climb(ac: AircraftConfig, w_start: float, h_start: float = 0.0, h_end: float | None = None) -> tuple[float, float, float, float]:
    if h_end is None:
        h_end = ac.cruise_alt

    dh = 1000.0
    ac_k = induced_drag_factor(ac)
    t_sl = total_thrust_sl(ac)
    w = w_start
    total_fuel = 0.0
    total_dist = 0.0
    total_time = 0.0
    h = h_start

    while h < h_end:
        step = min(dh, h_end - h)
        h_mid = h + step / 2.0

        if h_mid < 10_000:
            rho = isa(h_mid)[2]
            v_fps = 250.0 * KTS_TO_FPS * math.sqrt(RHO_SL / rho)
        else:
            v_fps = tas_from_mach(ac.cruise_mach, h_mid)

        t_avail = t_sl * thrust_lapse(h_mid, ac.bpr)
        rho = isa(h_mid)[2]
        q = 0.5 * rho * v_fps * v_fps
        if q <= 0:
            break
        cl = w / (q * ac.wing_area)
        cd = ac.cd0 + ac_k * cl * cl
        drag = q * ac.wing_area * cd

        excess = t_avail - drag
        if excess <= 0:
            break
        roc = v_fps * excess / w
        dt = step / roc
        fuel_step = (ac.tsfc_cruise / 3600.0) * t_avail * dt
        dist_ft = v_fps * dt

        total_fuel += fuel_step
        total_dist += dist_ft
        total_time += dt
        w -= fuel_step
        h += step

    return total_fuel, total_dist / NM_TO_FT, total_time, w


def compute_reserves(ac: AircraftConfig, w_at_reserve_start: float, wind_kts: float) -> float:
    ac_k = induced_drag_factor(ac)
    ac_ld_max = ld_max(ac)
    w = w_at_reserve_start

    fuel_land1 = w * 0.005
    w -= fuel_land1

    fuel_ga, ga_climb_dist, _ga_time, w = compute_climb(ac, w)

    divert_range = max(0.0, ac.alternate_range - ga_climb_dist)
    v_fps = tas_from_mach(ac.cruise_mach, ac.cruise_alt)
    v_kts = v_fps / KTS_TO_FPS
    v_ground_kts = v_kts + wind_kts
    q = dynamic_pressure_mach(ac.cruise_mach, ac.cruise_alt)
    cl = (w / ac.wing_area) / q
    cd = ac.cd0 + ac_k * cl * cl
    ld = cl / cd

    fuel_divert = 0.0
    if divert_range > 0 and v_ground_kts > 0:
        air_dist_nm = divert_range * (v_kts / v_ground_kts)
        w_ratio = math.exp(-(air_dist_nm * NM_TO_FT) * (ac.tsfc_cruise / 3600.0) / (v_fps * ld))
        fuel_divert = w * (1 - w_ratio)
    w -= fuel_divert

    hold_sec = 30 * 60
    w_ratio_hold = math.exp(-(hold_sec * (ac.tsfc_loiter / 3600.0)) / ac_ld_max)
    fuel_hold = w * (1 - w_ratio_hold)
    w -= fuel_hold

    fuel_land2 = w * 0.005
    return fuel_land1 + fuel_ga + fuel_divert + fuel_hold + fuel_land2


def compute_range(ac: AircraftConfig, payload_lb: float, fuel_lb: float, wind_kts: float = 0.0) -> float | None:
    w0 = oew(ac) + payload_lb + fuel_lb
    total_mission_fuel = fuel_lb / ac.trapped_fuel_factor
    if total_mission_fuel <= 0:
        return None

    w1 = w0 * 0.97
    fuel_to = w0 - w1

    fuel_climb, climb_dist_nm, climb_time_sec, w2 = compute_climb(ac, w1)

    ac_k = induced_drag_factor(ac)
    q = dynamic_pressure_mach(ac.cruise_mach, ac.cruise_alt)
    cl_cruise = (w2 / ac.wing_area) / q
    cd_cruise = ac.cd0 + ac_k * cl_cruise * cl_cruise
    ld_cruise = cl_cruise / cd_cruise

    v_ground_kts = ground_speed_kts(ac, wind_kts)
    if v_ground_kts <= 0:
        return None
    v_tas_kts = tas_from_mach(ac.cruise_mach, ac.cruise_alt) / KTS_TO_FPS

    contingency_factor = 0.10 * (ac.tsfc_loiter / ac.tsfc_cruise) * (ld_cruise / ld_max(ac))
    effective_tsfc = ac.tsfc_cruise * (1 + contingency_factor)

    reserve_fuel = compute_reserves(ac, w2 * 0.85, wind_kts)

    for iteration in range(2):
        cruise_contingency_fuel = total_mission_fuel - fuel_to - fuel_climb - reserve_fuel
        if cruise_contingency_fuel <= 0:
            return None

        w_after_cc = w2 - cruise_contingency_fuel
        if w_after_cc <= 0:
            return None

        air_range_nm = (v_tas_kts / effective_tsfc) * ld_cruise * math.log(w2 / w_after_cc)
        ground_range_nm = air_range_nm * (v_ground_kts / v_tas_kts)
        range_nm = climb_dist_nm + ground_range_nm

        if iteration == 0:
            reserve_fuel = compute_reserves(ac, w_after_cc, wind_kts)
        else:
            return max(0.0, range_nm)

    return None


def compute_payload_range_curve(ac: AircraftConfig, wind_kts: float = 0.0, samples: int = 41) -> list[tuple[float, float, float]]:
    points: list[tuple[float, float, float]] = []
    base = oew(ac)

    for i in range(samples):
        ratio = 0.0 if samples == 1 else i / (samples - 1)
        payload_lb = ac.max_payload * (1 - ratio)
        fuel_lb = min(ac.fuel_tank_capacity, ac.mtow_limit - base - payload_lb)
        if fuel_lb <= 0:
            continue

        range_nm = compute_range(ac, payload_lb, fuel_lb, wind_kts)
        if range_nm is None:
            continue
        points.append((payload_lb, fuel_lb, range_nm))

    return points


def plot_payload_range(output_path: Path, wind_kts: float, samples: int) -> None:
    curves = [
        (display_name("ZRJ70"), ZRJ70, "#1f77b4"),
        (display_name("ZRJ100"), ZRJ100, "#ff7f0e"),
    ]
    data = [(label, ac, color, compute_payload_range_curve(ac, wind_kts, samples)) for label, ac, color in curves]

    plt.style.use("default")
    fig, ax = plt.subplots(figsize=(9.2, 5.8), dpi=180)
    fig.patch.set_facecolor("white")
    ax.set_facecolor("#fbfcfd")

    for label, ac, color, points in data:
        if not points:
            continue

        payloads = [point[0] for point in points]
        ranges = [point[2] for point in points]
        ax.plot(ranges, payloads, color=color, linewidth=2.5, label=label)
        ax.scatter([ranges[0], ranges[-1]], [payloads[0], payloads[-1]], color=color, s=26, zorder=3)
        ax.annotate(
            f"{label} max payload",
            (ranges[0], payloads[0]),
            xytext=(8, 8),
            textcoords="offset points",
            color=color,
            fontsize=8,
            bbox={"boxstyle": "round,pad=0.2", "fc": "white", "ec": "none", "alpha": 0.9},
        )
        ferry_offset = (-12, 10) if label == "ZRJ70" else (-12, 6)
        ax.annotate(
            f"{label} ferry",
            (ranges[-1], payloads[-1]),
            xytext=ferry_offset,
            textcoords="offset points",
            ha="right",
            va="bottom",
            color=color,
            fontsize=8,
            bbox={"boxstyle": "round,pad=0.2", "fc": "white", "ec": "none", "alpha": 0.9},
        )

    ax.set_title("Payload-Range Diagram", fontsize=14, fontweight="bold")
    ax.set_xlabel("Range (nm)")
    ax.set_ylabel("Payload (lb)")
    ax.grid(True, color="#d8dee6", linewidth=0.8)
    ax.legend(frameon=False)

    ax.text(
        0.01,
        0.01,
        f"Still-air mission-map model, FAR 121-style reserves, wind = {wind_kts:.0f} kt",
        transform=ax.transAxes,
        fontsize=8,
        color="#58606b",
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(output_path, bbox_inches="tight")
    plt.close(fig)


def parse_args() -> argparse.Namespace:
    repo_root = Path(__file__).resolve().parent.parent
    default_output = repo_root / "charts" / "payload_range_zrj70_zrj100.png"

    parser = argparse.ArgumentParser(description="Generate a payload-range diagram for ZRJ70 and ZRJ100.")
    parser.add_argument("--wind-kts", type=float, default=0.0, help="Headwind/tailwind applied to both aircraft.")
    parser.add_argument("--samples", type=int, default=41, help="Number of payload samples per aircraft.")
    parser.add_argument("--output", type=Path, default=default_output, help="Output PNG path.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    plot_payload_range(args.output, args.wind_kts, args.samples)
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
