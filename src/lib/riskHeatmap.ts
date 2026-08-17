import type { CCTVCamera, Incident, Zone } from "./types";
import {
  calculateRiskScore,
  getZoneLighting,
  severityToWeight,
  type ZoneRiskInput,
} from "./riskEngine";

export interface RiskHeatmapPoint {
  id: string;
  lat: number;
  lng: number;
  weight: number;
  score: number;
  zoneId: string;
  zoneName: string;
}

function computeZoneCctvCoverage(
  zoneId: string,
  cameras: CCTVCamera[],
): number {
  const zoneCameras = cameras.filter((camera) => camera.zoneId === zoneId);
  if (zoneCameras.length === 0) return 0;
  const operational = zoneCameras.filter((camera) => camera.isOperational).length;
  return Math.round((operational / zoneCameras.length) * 100);
}

function buildZoneRiskInput(zoneId: string, incidents: Incident[]): ZoneRiskInput {
  const zoneIncidents = incidents.filter((incident) => incident.zoneId === zoneId);
  const highSeverityCount = zoneIncidents.filter(
    (incident) => incident.severity === "high" || incident.severity === "critical",
  ).length;

  const severityIndex =
    zoneIncidents.length === 0
      ? 0
      : zoneIncidents.reduce((sum, incident) => sum + severityToWeight(incident.severity), 0) /
        zoneIncidents.length;

  return {
    recentIncidentCount: zoneIncidents.length,
    highSeverityCount,
    severityIndex,
  };
}

function jitterCoord(lat: number, lng: number, spread: number, seed: number) {
  const angle = seed * 2.399963;
  const radius = spread * (0.35 + (seed % 7) * 0.1);
  return {
    lat: lat + Math.cos(angle) * radius,
    lng: lng + Math.sin(angle) * radius,
  };
}

/**
 * Builds weighted heatmap points from incidents + zone risk grids.
 * Night hours expand point spread and amplify weights for dramatic visual shift.
 */
export function buildRiskHeatmapPoints(
  incidents: Incident[],
  zones: Zone[],
  cameras: CCTVCamera[],
  timeOfDay: number,
  eventBoosts: Record<string, number> = {},
): RiskHeatmapPoint[] {
  const points: RiskHeatmapPoint[] = [];
  const isNight = timeOfDay >= 20 || timeOfDay <= 5;
  const nightMultiplier = isNight ? 1.55 : 1;
  const spreadMultiplier = isNight ? 1.85 : 1;

  for (const zone of zones) {
    const zoneInput = buildZoneRiskInput(zone.id, incidents);
    const cctvCoverage = computeZoneCctvCoverage(zone.id, cameras);
    const lighting = getZoneLighting(zone, timeOfDay);
    const baseScore = calculateRiskScore(zoneInput, timeOfDay, cctvCoverage, lighting);
    const zoneScore = Math.min(100, baseScore + (eventBoosts[zone.id] ?? 0));

    const gridDensity = zone.id === "zone-pardi" ? 14 : 10;
    for (let i = 0; i < gridDensity; i++) {
      const { lat, lng } = jitterCoord(
        zone.lat,
        zone.lng,
        zone.radiusKm * 0.0018 * spreadMultiplier,
        i + zoneScore,
      );

      points.push({
        id: `grid-${zone.id}-${i}`,
        lat,
        lng,
        weight: Math.min(100, zoneScore * nightMultiplier),
        score: zoneScore,
        zoneId: zone.id,
        zoneName: zone.name,
      });
    }
  }

  for (const incident of incidents) {
    const zone = zones.find((z) => z.id === incident.zoneId);
    if (!zone) continue;

    const zoneInput = buildZoneRiskInput(zone.id, incidents);
    const cctvCoverage = computeZoneCctvCoverage(zone.id, cameras);
    const lighting = getZoneLighting(zone, timeOfDay);

    const incidentBoost = severityToWeight(incident.severity) * 18;
    const score = Math.min(
      100,
      calculateRiskScore(zoneInput, timeOfDay, cctvCoverage, lighting) +
        incidentBoost +
        (eventBoosts[zone.id] ?? 0),
    );

    points.push({
      id: `inc-${incident.id}`,
      lat: incident.lat,
      lng: incident.lng,
      weight: Math.min(100, score * nightMultiplier),
      score,
      zoneId: incident.zoneId,
      zoneName: zone.name,
    });

    for (let ring = 1; ring <= (isNight ? 3 : 2); ring++) {
      const { lat, lng } = jitterCoord(
        incident.lat,
        incident.lng,
        0.0025 * ring * spreadMultiplier,
        ring * score,
      );
      points.push({
        id: `inc-${incident.id}-halo-${ring}`,
        lat,
        lng,
        weight: Math.min(100, score * nightMultiplier * (1 - ring * 0.18)),
        score,
        zoneId: incident.zoneId,
        zoneName: zone.name,
      });
    }
  }

  return points;
}

export function getAggregateRiskStats(points: RiskHeatmapPoint[]) {
  if (points.length === 0) {
    return { avg: 0, high: 0, medium: 0, low: 0 };
  }

  const uniqueScores = new Map<string, number>();
  for (const point of points) {
    if (!point.id.startsWith("inc-") || point.id.includes("-halo-")) continue;
    uniqueScores.set(point.zoneId, Math.max(uniqueScores.get(point.zoneId) ?? 0, point.score));
  }

  const zoneScores = zonesFromPoints(points);
  const scores = zoneScores.map((z) => z.score);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  return {
    avg,
    high: scores.filter((s) => s > 70).length,
    medium: scores.filter((s) => s > 40 && s <= 70).length,
    low: scores.filter((s) => s <= 40).length,
  };
}

function zonesFromPoints(points: RiskHeatmapPoint[]) {
  const map = new Map<string, { zoneName: string; score: number }>();
  for (const point of points) {
    if (!point.id.startsWith("grid-")) continue;
    const existing = map.get(point.zoneId);
    if (!existing || point.score > existing.score) {
      map.set(point.zoneId, { zoneName: point.zoneName, score: point.score });
    }
  }
  return Array.from(map.entries()).map(([zoneId, data]) => ({
    zoneId,
    ...data,
  }));
}

export function getTopRiskZones(points: RiskHeatmapPoint[], limit = 3) {
  return zonesFromPoints(points)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
