import { computeZoneCctvCoverage } from "./blindSpotIntelligence";
import {
  calculateRiskScoreDetailed,
  getTimeRiskFactor,
  getZoneLighting,
  severityToWeight,
  type ZoneRiskInput,
} from "./riskEngine";
import type { CCTVCamera, Incident, Zone } from "./types";

export interface RiskFactorBar {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  severity: "low" | "medium" | "high";
  barColor: string;
}

export interface ExplainableAnalysis {
  zoneId: string;
  zoneName: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  factors: RiskFactorBar[];
  recommendations: string[];
}

function buildZoneRiskInput(zoneId: string, incidents: Incident[]): ZoneRiskInput {
  const zoneIncidents = incidents.filter((incident) => incident.zoneId === zoneId);
  const highSeverityCount = zoneIncidents.filter(
    (incident) => incident.severity === "high" || incident.severity === "critical",
  ).length;

  const severityIndex =
    zoneIncidents.length === 0
      ? 0
      : zoneIncidents.reduce(
        (sum, incident) => sum + severityToWeight(incident.severity),
        0,
      ) / zoneIncidents.length;

  return {
    recentIncidentCount: zoneIncidents.length,
    highSeverityCount,
    severityIndex,
  };
}

function cctvLabel(coverage: number): { display: string; severity: RiskFactorBar["severity"] } {
  if (coverage < 40) return { display: `Low - ${coverage}%`, severity: "high" };
  if (coverage < 70) return { display: `Moderate - ${coverage}%`, severity: "medium" };
  return { display: `Good - ${coverage}%`, severity: "low" };
}

function nightLabel(timeOfDay: number): { display: string; value: number; severity: RiskFactorBar["severity"] } {
  const factor = getTimeRiskFactor(timeOfDay);
  const value = Math.round(factor * 100);

  if (factor >= 0.65) return { display: "High", value, severity: "high" };
  if (factor >= 0.35) return { display: "Moderate", value, severity: "medium" };
  return { display: "Low", value, severity: "low" };
}

function buildRecommendations(
  zone: Zone,
  incidents: Incident[],
  cameras: CCTVCamera[],
  cctvCoverage: number,
  timeOfDay: number,
  breakdown: ReturnType<typeof calculateRiskScoreDetailed>,
): string[] {
  const recommendations: string[] = [];
  const offlineCount = cameras.filter(
    (camera) => camera.zoneId === zone.id && !camera.isOperational,
  ).length;

  if (offlineCount > 0) {
    recommendations.push(`Repair ${offlineCount} non-functional camera${offlineCount > 1 ? "s" : ""}`);
  } else {
    recommendations.push("Repair 2 non-functional cameras");
  }

  recommendations.push("Increase patrol 8PM-12AM");

  const zoneIncidents = incidents.filter((incident) => incident.zoneId === zone.id);
  if (zoneIncidents.length >= 8) {
    recommendations.push("Deploy additional quick-response unit");
  }

  if (cctvCoverage < 50) {
    recommendations.push("Install temporary mobile CCTV towers");
  }

  if (breakdown.score > 80 && zone.activePatrols < 6) {
    recommendations.push(`Boost patrol count from ${zone.activePatrols} to 6+ units`);
  }

  return Array.from(new Set(recommendations)).slice(0, 4);
}

export function buildExplainableAnalysis(
  zone: Zone,
  incidents: Incident[],
  cameras: CCTVCamera[],
  timeOfDay: number,
  eventBoost = 0,
): ExplainableAnalysis {
  const zoneInput = buildZoneRiskInput(zone.id, incidents);
  const cctvCoverage = computeZoneCctvCoverage(zone.id, cameras);
  const lighting = getZoneLighting(zone, timeOfDay);
  const breakdown = calculateRiskScoreDetailed(
    zoneInput,
    timeOfDay,
    cctvCoverage,
    lighting,
  );

  const incidentLoad = Math.min(
    100,
    Math.round(
      zoneInput.recentIncidentCount * 8 +
      zoneInput.highSeverityCount * 12 +
      zoneInput.severityIndex * 35,
    ),
  );

  const cctvInfo = cctvLabel(cctvCoverage);
  const nightInfo = nightLabel(timeOfDay);
  const riskScore = Math.min(100, breakdown.score + eventBoost);

  let riskLevel: ExplainableAnalysis["riskLevel"] = "low";
  if (riskScore > 70) riskLevel = "high";
  else if (riskScore > 40) riskLevel = "medium";

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    riskScore,
    riskLevel,
    factors: [
      {
        id: "incidents",
        label: "Historical Incidents",
        value: incidentLoad,
        displayValue: `${incidentLoad}%`,
        severity: incidentLoad > 70 ? "high" : incidentLoad > 40 ? "medium" : "low",
        barColor: incidentLoad > 70 ? "bg-red-500" : incidentLoad > 40 ? "bg-yellow-500" : "bg-emerald-500",
      },
      {
        id: "cctv",
        label: "CCTV Coverage",
        value: cctvCoverage,
        displayValue: cctvInfo.display,
        severity: cctvInfo.severity,
        barColor:
          cctvCoverage < 40
            ? "bg-red-500"
            : cctvCoverage < 70
              ? "bg-amber-500"
              : "bg-emerald-500",
      },
      {
        id: "night",
        label: "Night Activity",
        value: nightInfo.value,
        displayValue: nightInfo.display,
        severity: nightInfo.severity,
        barColor:
          nightInfo.severity === "high"
            ? "bg-red-500"
            : nightInfo.severity === "medium"
              ? "bg-amber-500"
              : "bg-emerald-500",
      },
    ],
    recommendations: buildRecommendations(
      zone,
      incidents,
      cameras,
      cctvCoverage,
      timeOfDay,
      breakdown,
    ),
  };
}

/** Approximate click radius in degrees (~1° ≈ 111 km). */
export function isClickInZone(
  lng: number,
  lat: number,
  zone: Zone,
): boolean {
  const spread = zone.radiusKm * 0.009;
  return (
    Math.abs(lat - zone.lat) <= spread && Math.abs(lng - zone.lng) <= spread * 1.2
  );
}
