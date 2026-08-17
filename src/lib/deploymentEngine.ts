import type { ZoneAnalytics } from "./zoneAnalytics";

export const TOTAL_POLICE_UNITS = 10;

export const ZONE_LABELS = ["A", "B", "C", "D", "E"] as const;

export interface PoliceUnit {
  id: string;
  label: string;
}

export interface DeploymentChartRow {
  zoneId: string;
  zoneLabel: string;
  zoneName: string;
  riskScore: number;
  currentCoverage: number;
  expectedRiskReduction: number;
  deployedUnits: number;
}

export function createPoliceUnits(count = TOTAL_POLICE_UNITS): PoliceUnit[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `unit-${index + 1}`,
    label: `Unit ${index + 1}`,
  }));
}

/** Patrol + CCTV composite coverage score (0–100). */
export function computeZoneCoverage(
  zone: ZoneAnalytics,
  deployedUnits: number,
): number {
  const patrolBoost = Math.min(55, deployedUnits * 11);
  const cctvFactor = zone.cctvCoverage * 0.45;
  return Math.min(100, Math.round(patrolBoost + cctvFactor));
}

/** Each patrol unit reduces effective risk by ~7–12% depending on zone risk. */
export function computeRiskReduction(
  zone: ZoneAnalytics,
  deployedUnits: number,
): number {
  if (deployedUnits === 0) return 0;
  const unitImpact = zone.riskScore > 75 ? 11 : zone.riskScore > 50 ? 9 : 7;
  return Math.min(92, Math.round(deployedUnits * unitImpact));
}

export function buildChartData(
  zoneStats: ZoneAnalytics[],
  deployments: Record<string, number>,
): DeploymentChartRow[] {
  return zoneStats.map((zone, index) => {
    const deployed = deployments[zone.zoneId] ?? 0;
    return {
      zoneId: zone.zoneId,
      zoneLabel: `Zone ${ZONE_LABELS[index] ?? String.fromCharCode(65 + index)}`,
      zoneName: zone.zoneName,
      riskScore: zone.riskScore,
      currentCoverage: computeZoneCoverage(zone, deployed),
      expectedRiskReduction: computeRiskReduction(zone, deployed),
      deployedUnits: deployed,
    };
  });
}

/**
 * AI distributes units proportionally by risk score.
 * Higher-risk zones receive more patrol cars.
 */
export function computeAiDeployment(
  zoneStats: ZoneAnalytics[],
  totalUnits: number,
): Record<string, number> {
  const sorted = [...zoneStats].sort((a, b) => b.riskScore - a.riskScore);
  const totalRisk = sorted.reduce((sum, zone) => sum + zone.riskScore, 0) || 1;

  const raw = sorted.map((zone) => ({
    zoneId: zone.zoneId,
    weight: zone.riskScore / totalRisk,
    allocation: (zone.riskScore / totalRisk) * totalUnits,
  }));

  const floorAlloc: Record<string, number> = {};
  let assigned = 0;

  for (const item of raw) {
    const count = Math.floor(item.allocation);
    floorAlloc[item.zoneId] = count;
    assigned += count;
  }

  let remaining = totalUnits - assigned;
  const remainderOrder = [...raw].sort(
    (a, b) => (b.allocation % 1) - (a.allocation % 1),
  );

  for (const item of remainderOrder) {
    if (remaining <= 0) break;
    floorAlloc[item.zoneId] = (floorAlloc[item.zoneId] ?? 0) + 1;
    remaining -= 1;
  }

  return floorAlloc;
}

/** Assigns unit IDs to zones based on deployment counts. */
export function assignmentsFromDeployment(
  units: PoliceUnit[],
  deployment: Record<string, number>,
  zoneIds: string[],
): Record<string, string | null> {
  const assignments: Record<string, string | null> = Object.fromEntries(
    units.map((unit) => [unit.id, null]),
  );

  let unitIndex = 0;
  for (const zoneId of zoneIds) {
    const count = deployment[zoneId] ?? 0;
    for (let i = 0; i < count && unitIndex < units.length; i++) {
      assignments[units[unitIndex]!.id] = zoneId;
      unitIndex += 1;
    }
  }

  return assignments;
}
