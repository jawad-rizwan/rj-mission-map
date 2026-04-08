#!/usr/bin/env python3
from __future__ import annotations

import argparse
import math
import os
from dataclasses import dataclass
from pathlib import Path

os.environ.setdefault("MPLCONFIGDIR", "/tmp/matplotlib-rj-mission-map")

import matplotlib.pyplot as plt

import generate_payload_range as model


@dataclass
class Segment:
    name: str
    w_start: float
    w_end: float
    fuel_burned: float
    time_min: float
    distance_nm: float
    altitude_start: float
    altitude_end: float


@dataclass
class ProfileResult:
    aircraft_name: str
    profile_name: str
    payload_lb: float
    loaded_fuel_lb: float
    usable_fuel_lb: float
    total_range_nm: float
    trip_fuel_lb: float
    reserve_fuel_lb: float
    w0: float
    segments: list[Segment]


def compute_cruise_segment(
    ac: model.AircraftConfig,
    w_start: float,
    ground_range_nm: float,
    wind_kts: float,
    name: str,
) -> Segment:
    v_fps = model.tas_from_mach(ac.cruise_mach, ac.cruise_alt)
    v_tas_kts = v_fps / model.KTS_TO_FPS
    v_ground_kts = v_tas_kts + wind_kts
    if ground_range_nm <= 0 or v_ground_kts <= 0:
        return Segment(name, w_start, w_start, 0.0, 0.0, 0.0, ac.cruise_alt, ac.cruise_alt)

    q = model.dynamic_pressure_mach(ac.cruise_mach, ac.cruise_alt)
    cl = (w_start / ac.wing_area) / q
    cd = ac.cd0 + model.induced_drag_factor(ac) * cl * cl
    ld = cl / cd

    air_dist_nm = ground_range_nm * (v_tas_kts / v_ground_kts)
    w_ratio = math.exp(-(air_dist_nm * model.NM_TO_FT) * (ac.tsfc_cruise / 3600.0) / (v_fps * ld))
    w_end = w_start * w_ratio
    return Segment(
        name=name,
        w_start=w_start,
        w_end=w_end,
        fuel_burned=w_start - w_end,
        time_min=(ground_range_nm / v_ground_kts) * 60.0,
        distance_nm=ground_range_nm,
        altitude_start=ac.cruise_alt,
        altitude_end=ac.cruise_alt,
    )


def compute_loiter_segment(
    ac: model.AircraftConfig,
    w_start: float,
    endurance_min: float,
    name: str,
) -> Segment:
    if endurance_min <= 0:
        return Segment(name, w_start, w_start, 0.0, 0.0, 0.0, ac.cruise_alt, ac.cruise_alt)

    w_ratio = math.exp(-((endurance_min * 60.0) * (ac.tsfc_loiter / 3600.0)) / model.ld_max(ac))
    w_end = w_start * w_ratio
    return Segment(
        name=name,
        w_start=w_start,
        w_end=w_end,
        fuel_burned=w_start - w_end,
        time_min=endurance_min,
        distance_nm=0.0,
        altitude_start=ac.cruise_alt,
        altitude_end=ac.cruise_alt,
    )


def compute_landing_segment(w_start: float, name: str) -> Segment:
    w_end = w_start * 0.995
    return Segment(
        name=name,
        w_start=w_start,
        w_end=w_end,
        fuel_burned=w_start - w_end,
        time_min=2.0,
        distance_nm=0.0,
        altitude_start=0.0,
        altitude_end=0.0,
    )


def compute_climb_segment(
    ac: model.AircraftConfig,
    w_start: float,
    name: str,
) -> Segment:
    fuel, dist, time_sec, w_end = model.compute_climb(ac, w_start)
    return Segment(
        name=name,
        w_start=w_start,
        w_end=w_end,
        fuel_burned=fuel,
        time_min=time_sec / 60.0,
        distance_nm=dist,
        altitude_start=0.0,
        altitude_end=ac.cruise_alt,
    )


def compute_reserve_segments(
    ac: model.AircraftConfig,
    w_start: float,
    wind_kts: float,
) -> list[Segment]:
    segments: list[Segment] = []

    attempted = compute_landing_segment(w_start, "Attempted Landing")
    segments.append(attempted)

    go_around = compute_climb_segment(ac, attempted.w_end, "Go-Around Climb")
    segments.append(go_around)

    divert_range = max(0.0, ac.alternate_range - go_around.distance_nm)
    divert = compute_cruise_segment(ac, go_around.w_end, divert_range, wind_kts, f"Divert to Alternate ({divert_range:.0f} nm)")
    segments.append(divert)

    hold = compute_loiter_segment(ac, divert.w_end, 30.0, "Regulatory Hold (30 min)")
    segments.append(hold)

    segments.append(compute_landing_segment(hold.w_end, "Land"))
    return segments


def build_profile(
    ac: model.AircraftConfig,
    payload_lb: float,
    fuel_lb: float,
    wind_kts: float,
    profile_name: str,
) -> ProfileResult | None:
    w0 = model.oew(ac) + payload_lb + fuel_lb
    usable_fuel_lb = fuel_lb / ac.trapped_fuel_factor
    if usable_fuel_lb <= 0:
        return None

    warmup = Segment(
        name="Warmup & Takeoff",
        w_start=w0,
        w_end=w0 * 0.97,
        fuel_burned=w0 * 0.03,
        time_min=5.0,
        distance_nm=0.0,
        altitude_start=0.0,
        altitude_end=0.0,
    )
    climb = compute_climb_segment(ac, warmup.w_end, "Climb to FL350")

    q = model.dynamic_pressure_mach(ac.cruise_mach, ac.cruise_alt)
    cl_cruise = (climb.w_end / ac.wing_area) / q
    cd_cruise = ac.cd0 + model.induced_drag_factor(ac) * cl_cruise * cl_cruise
    ld_cruise = cl_cruise / cd_cruise

    v_ground_kts = model.ground_speed_kts(ac, wind_kts)
    if v_ground_kts <= 0:
        return None
    v_tas_kts = model.tas_from_mach(ac.cruise_mach, ac.cruise_alt) / model.KTS_TO_FPS
    contingency_factor = 0.10 * (ac.tsfc_loiter / ac.tsfc_cruise) * (ld_cruise / model.ld_max(ac))
    effective_tsfc = ac.tsfc_cruise * (1.0 + contingency_factor)

    reserve_segments = compute_reserve_segments(ac, climb.w_end * 0.85, wind_kts)
    reserve_fuel_lb = sum(segment.fuel_burned for segment in reserve_segments)
    cruise_contingency_fuel = 0.0
    cruise_ground_range_nm = 0.0
    w_after_cc = climb.w_end

    for _ in range(2):
        cruise_contingency_fuel = usable_fuel_lb - warmup.fuel_burned - climb.fuel_burned - reserve_fuel_lb
        if cruise_contingency_fuel <= 0:
            return None

        w_after_cc = climb.w_end - cruise_contingency_fuel
        if w_after_cc <= 0:
            return None

        air_range_nm = (v_tas_kts / effective_tsfc) * ld_cruise * math.log(climb.w_end / w_after_cc)
        cruise_ground_range_nm = air_range_nm * (v_ground_kts / v_tas_kts)
        reserve_segments = compute_reserve_segments(ac, w_after_cc, wind_kts)
        reserve_fuel_lb = sum(segment.fuel_burned for segment in reserve_segments)

    destination_range_nm = max(0.0, cruise_ground_range_nm)
    total_range_nm = climb.distance_nm + destination_range_nm

    cruise = compute_cruise_segment(ac, climb.w_end, destination_range_nm, wind_kts, f"Cruise to Destination ({destination_range_nm:.0f} nm)")
    contingency_fuel_lb = max(0.0, cruise_contingency_fuel - cruise.fuel_burned)
    contingency = Segment(
        name=f"Contingency ({cruise.time_min * 0.10:.1f} min)",
        w_start=cruise.w_end,
        w_end=max(0.0, cruise.w_end - contingency_fuel_lb),
        fuel_burned=contingency_fuel_lb,
        time_min=cruise.time_min * 0.10,
        distance_nm=0.0,
        altitude_start=ac.cruise_alt,
        altitude_end=ac.cruise_alt,
    )

    reserve_segments = compute_reserve_segments(ac, contingency.w_end, wind_kts)
    reserve_fuel_lb = sum(segment.fuel_burned for segment in reserve_segments)

    segments = [warmup, climb, cruise, contingency, *reserve_segments]
    trip_fuel_lb = sum(segment.fuel_burned for segment in segments[:4])
    return ProfileResult(
        aircraft_name=ac.name,
        profile_name=profile_name,
        payload_lb=payload_lb,
        loaded_fuel_lb=fuel_lb,
        usable_fuel_lb=usable_fuel_lb,
        total_range_nm=total_range_nm,
        trip_fuel_lb=trip_fuel_lb,
        reserve_fuel_lb=reserve_fuel_lb,
        w0=w0,
        segments=segments,
    )


def case_definition(ac: model.AircraftConfig, mode: str) -> tuple[float, float, str]:
    if mode == "ferry":
        return 0.0, ac.fuel_tank_capacity, "Ferry"

    payload_lb = ac.max_payload
    fuel_lb = min(ac.fuel_tank_capacity, ac.mtow_limit - model.oew(ac) - payload_lb)
    return payload_lb, fuel_lb, "Max Payload Dispatch"


def plot_profile(result: ProfileResult, ac: model.AircraftConfig, output_path: Path, wind_kts: float) -> None:
    cruise_alt = ac.cruise_alt
    segs = result.segments

    x_points = [0.0]
    alt_points = [0.0]
    for seg in segs:
        x_points.append(x_points[-1] + 1.0)
        alt_points.append(seg.altitude_end)

    fig, ax = plt.subplots(figsize=(12, 4.6), dpi=180)
    fig.patch.set_facecolor("white")

    ax.plot(x_points, alt_points, "-", color="#333333", linewidth=2.0, zorder=3)
    ax.fill_between(x_points, alt_points, alpha=0.08, color="#4878CF")

    for idx in range(len(segs)):
        x_mid = (x_points[idx] + x_points[idx + 1]) / 2.0
        a_mid = (alt_points[idx] + alt_points[idx + 1]) / 2.0
        ax.annotate(
            str(idx + 1),
            (x_mid, a_mid),
            fontsize=8,
            fontweight="bold",
            ha="center",
            va="center",
            color="white",
            zorder=5,
            bbox={"boxstyle": "circle,pad=0.25", "fc": "#4878CF", "ec": "none"},
        )

    short_labels = {
        "Warmup & Takeoff": "Warmup\n& T/O",
        "Attempted Landing": "Missed\nApproach",
        "Go-Around Climb": "Go-Around\nClimb",
        "Land": "Land",
        "Climb to FL350": "Climb",
        "Regulatory Hold (30 min)": "Regulatory\nHold",
    }
    for idx, seg in enumerate(segs):
        x_mid = (x_points[idx] + x_points[idx + 1]) / 2.0
        label = short_labels.get(seg.name, seg.name)
        if seg.name.startswith("Cruise to Destination"):
            label = f"Cruise\n({seg.distance_nm:.0f} nm)"
        elif seg.name.startswith("Divert to Alternate"):
            label = f"Divert\n({seg.distance_nm:.0f} nm)"
        elif seg.name.startswith("Contingency"):
            label = "Contingency"

        ax.text(x_mid, -cruise_alt * 0.13, label, ha="center", va="top", fontsize=6.5, color="#333333")

    for idx, seg in enumerate(segs):
        x_mid = (x_points[idx] + x_points[idx + 1]) / 2.0
        a_top = max(alt_points[idx], alt_points[idx + 1])
        info = []
        if seg.distance_nm > 0:
            info.append(f"{seg.distance_nm:,.0f} nm")
        if seg.time_min > 0:
            info.append(f"{seg.time_min:,.0f} min")
        info.append(f"{seg.fuel_burned:,.0f} lb")
        ax.text(
            x_mid,
            a_top + cruise_alt * 0.05,
            "\n".join(info),
            ha="center",
            va="bottom",
            fontsize=5.5,
            color="#555555",
            linespacing=1.25,
        )

    summary = (
        f"W0 = {result.w0:,.0f} lb    "
        f"Payload = {result.payload_lb:,.0f} lb    "
        f"Loaded Fuel = {result.loaded_fuel_lb:,.0f} lb    "
        f"Range = {result.total_range_nm:,.0f} nm"
    )
    footer = (
        f"Trip Fuel = {result.trip_fuel_lb:,.0f} lb    "
        f"Reserve = {result.reserve_fuel_lb:,.0f} lb    "
        f"Usable Fuel = {result.usable_fuel_lb:,.0f} lb"
    )
    ax.text(
        0.5,
        -0.15,
        f"{summary}\n{footer}",
        transform=ax.transAxes,
        fontsize=7,
        va="top",
        ha="center",
        family="monospace",
        bbox={"boxstyle": "round,pad=0.4", "fc": "#f5f5f5", "ec": "#cccccc"},
    )

    ax.axhline(cruise_alt, color="#999999", linestyle=":", linewidth=0.8, alpha=0.5)
    ax.text(x_points[-1] + 0.15, cruise_alt, f"FL{int(cruise_alt / 100)}", fontsize=7, va="center", color="#999999")
    ax.axvline(4.0, color="#d62728", linestyle="--", linewidth=0.8, alpha=0.4)
    ax.text(4.02, cruise_alt * 1.18, "Reserve start", fontsize=6.5, color="#d62728", rotation=90, va="top")

    ax.set_xlim(-0.3, x_points[-1] + 0.8)
    ax.set_ylim(-cruise_alt * 0.28, cruise_alt * 1.35)
    ax.set_ylabel("Altitude [ft]")
    ax.set_title(f"Mission Profile — {result.aircraft_name} ({result.profile_name})", fontweight="bold")
    ax.set_xticks([])
    ax.set_xlabel("(not to scale)")
    ax.grid(axis="y", alpha=0.2)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["bottom"].set_visible(False)

    wind_label = "No wind" if abs(wind_kts) < 1e-9 else f"Wind {wind_kts:+.0f} kt"
    ax.text(
        0.99,
        0.02,
        f"{wind_label}, M{ac.cruise_mach:.2f}, FAR 121.645-style dispatch model",
        transform=ax.transAxes,
        ha="right",
        va="bottom",
        fontsize=6.5,
        color="#666666",
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.tight_layout()
    fig.savefig(output_path, bbox_inches="tight")
    plt.close(fig)


def parse_args() -> argparse.Namespace:
    repo_root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description="Generate mission-profile PNGs for the mission-map aircraft model.")
    parser.add_argument("--aircraft", nargs="+", choices=["ZRJ70", "ZRJ100"], default=["ZRJ70", "ZRJ100"])
    parser.add_argument("--mode", choices=["max-payload", "ferry"], default="max-payload")
    parser.add_argument("--wind-kts", type=float, default=0.0)
    parser.add_argument("--output-dir", type=Path, default=repo_root / "charts")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    aircraft_map = {"ZRJ70": model.ZRJ70, "ZRJ100": model.ZRJ100}

    for aircraft_key in args.aircraft:
        ac = aircraft_map[aircraft_key]
        payload_lb, fuel_lb, profile_name = case_definition(ac, args.mode)
        result = build_profile(ac, payload_lb, fuel_lb, args.wind_kts, profile_name)
        if result is None:
            raise SystemExit(f"Could not generate a mission profile for {aircraft_key}.")

        suffix = args.mode.replace("-", "_")
        output_path = args.output_dir / f"mission_profile_{aircraft_key.lower()}_{suffix}.png"
        plot_profile(result, ac, output_path, args.wind_kts)
        print(f"Wrote {output_path}")


if __name__ == "__main__":
    main()
