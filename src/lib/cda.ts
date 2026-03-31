import type { CdAParams } from "./types";

const DEFAULT_AIR_DENSITY = 1.226; // kg/m^3
const DEFAULT_ROLLING_RESISTANCE = 0.004;
const DEFAULT_TOTAL_WEIGHT = 80; // kg (rider + bike)
const DEFAULT_GRADIENT = 0;
const DEFAULT_DRIVETRAIN_EFFICIENCY = 0.97;

/**
 * Calculate CdA (drag area) from power and speed.
 *
 * Power balance equation:
 *   P * efficiency = CdA * 0.5 * rho * v^3 + Crr * m * g * v + m * g * gradient * v
 *
 * Solving for CdA:
 *   CdA = (P * efficiency - Crr * m * g * v - m * g * gradient * v) / (0.5 * rho * v^3)
 */
export function calcCdA(params: CdAParams): number {
  const {
    power,
    speed,
    airDensity = DEFAULT_AIR_DENSITY,
    rollingResistance = DEFAULT_ROLLING_RESISTANCE,
    totalWeight = DEFAULT_TOTAL_WEIGHT,
    gradient = DEFAULT_GRADIENT,
    drivetrainEfficiency = DEFAULT_DRIVETRAIN_EFFICIENCY,
  } = params;

  if (speed === 0) return 0;

  const g = 9.81;
  const v = speed; // m/s

  const effectivePower = power * drivetrainEfficiency;
  const rollingForce = rollingResistance * totalWeight * g * v;
  const gradientForce = totalWeight * g * gradient * v;
  const aeroPower = effectivePower - rollingForce - gradientForce;

  const dragDenominator = 0.5 * airDensity * v ** 3;
  if (dragDenominator === 0) return 0;

  return aeroPower / dragDenominator;
}

/**
 * Calculate CdA from a lap time given distance and power.
 * Converts lap time (seconds) and distance (meters) to speed, then calculates CdA.
 */
export function calcCdAFromLapTime(
  lapTimeSeconds: number,
  distanceMeters: number,
  power: number,
  options?: Omit<CdAParams, "power" | "speed">,
): number {
  if (lapTimeSeconds === 0) return 0;
  const speed = distanceMeters / lapTimeSeconds;
  return calcCdA({ power, speed, ...options });
}
