import type { CCTVCamera, Incident, Zone } from "./types";
import {
  calculateRiskScore,
  getZoneLighting,
  severityToWeight,
  type ZoneRiskInput,
} from "./riskEngine";

export interface CriticalBlindSpot {
  id: string;
  lat: number;
  lng: number;
  zoneId: string;
  zoneName: string;
  riskScore: number;
  cctvCoverage: number;
  lightingScore: number;
  priority: "critical" | "high";
  patrolWindow: string;
  reason: string;
}

export interface BlindSpotDetectionOptions {
  riskThreshold?: number;
  cctvThreshold?: number;
  lightingThreshold?: number;
  timeOfDay?: number;
}

const DEFAULT_OPTIONS: Required<BlindSpotDetectionOptions> = {
  riskThreshold: 75,
  cctvThreshold: 70,
  lightingThreshold: 50,
  timeOfDay: 22,
};

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

export function computeZoneCctvCoverage(
  zoneId: string,
  cameras: CCTVCamera[],
): number {
  const zoneCameras = cameras.filter((camera) => camera.zoneId === zoneId);
  if (zoneCameras.length === 0) return 0;
  const operational = zoneCameras.filter((camera) => camera.isOperational).length;
  return Math.round((operational / zoneCameras.length) * 100);
}

function jitterCoord(lat: number, lng: number, spread: number, seed: number) {
  const angle = seed * 2.399963;
  return {
    lat: lat + Math.cos(angle) * spread,
    lng: lng + Math.sin(angle) * spread,
  };
}

/**
 * Finds the intersection of High Crime Risk (>75) and Low CCTV Coverage (<70%).
 * Returns critical blind-spot coordinates for map warning rings.
 */
export function detectCriticalBlindSpots(
  incidents: Incident[],
  zones: Zone[],
  cameras: CCTVCamera[],
  options: BlindSpotDetectionOptions = {},
): CriticalBlindSpot[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const spots: CriticalBlindSpot[] = [];

  for (const zone of zones) {
    const zoneInput = buildZoneRiskInput(zone.id, incidents);
    const cctvCoverage = computeZoneCctvCoverage(zone.id, cameras);
    const lightingScore = getZoneLighting(zone, opts.timeOfDay);
    const riskScore = calculateRiskScore(
      zoneInput,
      opts.timeOfDay,
      cctvCoverage,
      lightingScore,
    );

    const isHighRisk = riskScore > opts.riskThreshold;
    const isLowCctv = cctvCoverage < opts.cctvThreshold;

    if (isHighRisk && isLowCctv) {
      spots.push({
        id: `bs-zone-${zone.id}`,
        lat: zone.lat,
        lng: zone.lng,
        zoneId: zone.id,
        zoneName: zone.name,
        riskScore,
        cctvCoverage,
        lightingScore: Math.round(lightingScore),
        priority: riskScore > 85 ? "critical" : "high",
        patrolWindow: "8 PM - 12 AM",
        reason: `Crime risk ${riskScore} with only ${cctvCoverage}% CCTV operational`,
      });

      for (let i = 0; i < 3; i++) {
        const { lat, lng } = jitterCoord(
          zone.lat,
          zone.lng,
          zone.radiusKm * 0.0012,
          i + riskScore,
        );
        spots.push({
          id: `bs-grid-${zone.id}-${i}`,
          lat,
          lng,
          zoneId: zone.id,
          zoneName: zone.name,
          riskScore,
          cctvCoverage,
          lightingScore: Math.round(lightingScore),
          priority: "high",
          patrolWindow: "8 PM - 12 AM",
          reason: "Coverage gap in high-crime corridor",
        });
      }
    }

    if (isHighRisk) {
      const offlineCameras = cameras.filter(
        (camera) => camera.zoneId === zone.id && !camera.isOperational,
      );
      for (const camera of offlineCameras) {
        spots.push({
          id: `bs-cam-${camera.id}`,
          lat: camera.lat,
          lng: camera.lng,
          zoneId: zone.id,
          zoneName: zone.name,
          riskScore,
          cctvCoverage,
          lightingScore: Math.round(lightingScore),
          priority: "critical",
          patrolWindow: "8 PM - 12 AM",
          reason: `Offline camera · ${camera.name}`,
        });
      }
    }
  }

  const seen = new Set<string>();
  return spots.filter((spot) => {
    const key = `${spot.lat.toFixed(4)}-${spot.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Night Safety Mode: poor lighting AND weak CCTV only. */
export function filterNightSafetyVulnerabilities(
  blindSpots: CriticalBlindSpot[],
  lightingThreshold = 50,
  cctvThreshold = 70,
): CriticalBlindSpot[] {
  return blindSpots.filter(
    (spot) =>
      spot.lightingScore < lightingThreshold && spot.cctvCoverage < cctvThreshold,
  );
}

export function getPatrolRecommendations(blindSpots: CriticalBlindSpot[]) {
  const zoneMap = new Map<string, CriticalBlindSpot>();

  for (const spot of blindSpots) {
    const existing = zoneMap.get(spot.zoneId);
    if (!existing || spot.riskScore > existing.riskScore) {
      zoneMap.set(spot.zoneId, spot);
    }
  }

  return Array.from(zoneMap.values()).sort((a, b) => b.riskScore - a.riskScore);
}
