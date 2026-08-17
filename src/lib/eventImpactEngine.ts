import type { Zone } from "./types";

export interface PublicEventInput {
  eventName: string;
  zoneId: string;
  location: string;
  expectedCrowd: number;
  durationHours: number;
}

export interface PublicEventSimulation extends PublicEventInput {
  zoneName: string;
  riskBoost: number;
  projectedScore: number;
  warningMessage: string;
}

const SIMULATION_DELAY_MS = 2200;

export function computeEventRiskBoost(
  expectedCrowd: number,
  durationHours: number,
): number {
  const crowdFactor = Math.min(1, expectedCrowd / 25000);
  const durationFactor = Math.min(1, durationHours / 8);
  return Math.round(12 + crowdFactor * 28 + durationFactor * 18);
}

export function buildEventWarning(eventName: string, zoneName: string): string {
  return `Warning: Crowd-related risks and traffic congestion detected. Rerouting patrols advised.`;
}

export async function simulatePublicEventImpact(
  input: PublicEventInput,
  zones: Zone[],
  baseRiskScore: number,
): Promise<PublicEventSimulation> {
  await new Promise((resolve) => setTimeout(resolve, SIMULATION_DELAY_MS));

  const zone = zones.find((item) => item.id === input.zoneId);
  const zoneName = zone?.name ?? input.location;
  const riskBoost = computeEventRiskBoost(input.expectedCrowd, input.durationHours);
  const projectedScore = Math.min(100, baseRiskScore + riskBoost);

  return {
    ...input,
    zoneName,
    riskBoost,
    projectedScore,
    warningMessage: buildEventWarning(input.eventName, zoneName),
  };
}
