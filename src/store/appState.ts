import { createContext, useContext, type Dispatch } from 'react';
import { type AircraftKey, ALL_AIRCRAFT, oew } from '../engine/aircraft';
import { type UnitSystem, DEFAULT_UNITS } from '../engine/units';

export interface AppState {
  aircraftKey: AircraftKey;
  payloadLb: number;
  fuelLb: number;
  windKts: number;
  departureIcao: string | null;
  arrivalIcao: string | null;
  unitSystem: UnitSystem;
}

export type AppAction =
  | { type: 'SET_AIRCRAFT'; key: AircraftKey }
  | { type: 'SET_PAYLOAD'; value: number }
  | { type: 'SET_FUEL'; value: number }
  | { type: 'SET_WIND'; value: number }
  | { type: 'SET_DEPARTURE'; icao: string | null }
  | { type: 'SET_ARRIVAL'; icao: string | null }
  | { type: 'SET_DISTANCE_UNIT'; value: UnitSystem['distance'] }
  | { type: 'SET_WEIGHT_UNIT'; value: UnitSystem['weight'] }
  | { type: 'SET_SPEED_UNIT'; value: UnitSystem['speed'] };

function clampFuelPayload(
  key: AircraftKey,
  payloadLb: number,
  fuelLb: number,
): { payloadLb: number; fuelLb: number } {
  const ac = ALL_AIRCRAFT[key];
  const base = oew(ac);
  const p = Math.max(0, Math.min(payloadLb, ac.maxPayload));
  const maxFuel = Math.min(ac.fuelTankCapacity, ac.mtowLimit - base - p);
  const f = Math.max(0, Math.min(fuelLb, maxFuel));
  return { payloadLb: p, fuelLb: f };
}

export function initialState(): AppState {
  const key: AircraftKey = 'ZRJ70';
  const ac = ALL_AIRCRAFT[key];
  const { payloadLb, fuelLb } = clampFuelPayload(key, ac.maxPayload, ac.fuelTankCapacity);
  return {
    aircraftKey: key,
    payloadLb,
    fuelLb,
    windKts: 0,
    departureIcao: null,
    arrivalIcao: null,
    unitSystem: DEFAULT_UNITS,
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_AIRCRAFT': {
      const ac = ALL_AIRCRAFT[action.key];
      const { payloadLb, fuelLb } = clampFuelPayload(
        action.key, ac.maxPayload, ac.fuelTankCapacity,
      );
      return { ...state, aircraftKey: action.key, payloadLb, fuelLb };
    }
    case 'SET_PAYLOAD': {
      const { payloadLb, fuelLb } = clampFuelPayload(
        state.aircraftKey, action.value, state.fuelLb,
      );
      return { ...state, payloadLb, fuelLb };
    }
    case 'SET_FUEL': {
      const { payloadLb, fuelLb } = clampFuelPayload(
        state.aircraftKey, state.payloadLb, action.value,
      );
      return { ...state, payloadLb, fuelLb };
    }
    case 'SET_WIND':
      return { ...state, windKts: Math.max(-100, Math.min(100, action.value)) };
    case 'SET_DEPARTURE':
      return { ...state, departureIcao: action.icao };
    case 'SET_ARRIVAL':
      return { ...state, arrivalIcao: action.icao };
    case 'SET_DISTANCE_UNIT':
      return { ...state, unitSystem: { ...state.unitSystem, distance: action.value } };
    case 'SET_WEIGHT_UNIT':
      return { ...state, unitSystem: { ...state.unitSystem, weight: action.value } };
    case 'SET_SPEED_UNIT':
      return { ...state, unitSystem: { ...state.unitSystem, speed: action.value } };
    default:
      return state;
  }
}

export const AppStateContext = createContext<AppState>(initialState());
export const AppDispatchContext = createContext<Dispatch<AppAction>>(() => {});

export function useAppState() {
  return useContext(AppStateContext);
}

export function useAppDispatch() {
  return useContext(AppDispatchContext);
}
