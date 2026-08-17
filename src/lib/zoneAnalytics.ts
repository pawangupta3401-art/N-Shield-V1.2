import type { CCTVCamera, Incident, Zone } from "./types";
import {
  calculateRiskScore,
  getZoneLighting,
  severityToWeight,
  type ZoneRiskInput,
} from "./riskEngine";
import { computeZoneCctvCoverage } from "./blindSpotIntelligence";

export interface ZoneAnalytics {
  zoneId: string;
  zoneName: string;
  incidentCount: number;
  highSeverityCount: number;
  cctvCoverage: number;
  riskScore: number;
  activePatrols: number;
  populationEstimate: number;
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

export function computeZoneAnalytics(
  zones: Zone[],
  incidents: Incident[],
  cameras: CCTVCamera[],
  timeOfDay: number,
): ZoneAnalytics[] {
  return zones.map((zone) => {
    const zoneInput = buildZoneRiskInput(zone.id, incidents);
    const cctvCoverage = computeZoneCctvCoverage(zone.id, cameras);
    const lighting = getZoneLighting(zone, timeOfDay);
    const riskScore = calculateRiskScore(
      zoneInput,
      timeOfDay,
      cctvCoverage,
      lighting,
    );

    return {
      zoneId: zone.id,
      zoneName: zone.name,
      incidentCount: zoneInput.recentIncidentCount,
      highSeverityCount: zoneInput.highSeverityCount,
      cctvCoverage,
      riskScore,
      activePatrols: zone.activePatrols,
      populationEstimate: zone.populationEstimate,
    };
  });
}

export function getCityOverviewStats(
  zones: Zone[],
  incidents: Incident[],
  cameras: CCTVCamera[],
  timeOfDay: number,
) {
  const zoneStats = computeZoneAnalytics(zones, incidents, cameras, timeOfDay);
  const operational = cameras.filter((camera) => camera.isOperational).length;
  const openIncidents = incidents.filter((incident) => incident.status === "open").length;

  return {
    totalIncidents: incidents.length,
    openIncidents,
    criticalIncidents: incidents.filter((incident) => incident.severity === "critical")
      .length,
    totalCameras: cameras.length,
    operationalCameras: operational,
    offlineCameras: cameras.length - operational,
    avgRiskScore: Math.round(
      zoneStats.reduce((sum, zone) => sum + zone.riskScore, 0) / zoneStats.length,
    ),
    totalPatrols: zones.reduce((sum, zone) => sum + zone.activePatrols, 0),
    zoneStats: zoneStats.sort((a, b) => b.riskScore - a.riskScore),
  };
}
