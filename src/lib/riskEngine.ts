import type {
  CCTVCamera,
  CrimeCategoryFilter,
  Incident,
  TimeFilterPeriod,
  Zone,
  ZoneCrimeRiskAnalytics,
} from "./types";

/** Input describing recent criminal activity within a zone. */
export interface ZoneRiskInput {
  /** Total incidents in the last 30 days */
  recentIncidentCount: number;
  /** Incidents marked critical or high severity */
  highSeverityCount: number;
  /** Weighted severity score 0–1 (Murder/critical weigh highest) */
  severityIndex: number;
}

export interface RiskScoreBreakdown {
  score: number;
  level: "low" | "medium" | "high";
  factors: {
    incidentContribution: number;
    timeContribution: number;
    cctvContribution: number;
    lightingContribution: number;
    aiBoost: number;
  };
}

export const SEVERITY_WEIGHTS: Record<string, number> = {
  low: 0.25,
  medium: 0.5,
  high: 0.78,
  critical: 1.0,
};

export function severityToWeight(severity: string): number {
  return SEVERITY_WEIGHTS[severity] ?? 0.5;
}

export function isNightHour(hour: number): boolean {
  const normalized = ((hour % 24) + 24) % 24;
  return normalized >= 20 || normalized <= 4;
}

export function formatHourLabel(hour: number): string {
  const normalized = ((hour % 24) + 24) % 24;
  if (normalized === 0) return "12:00 AM";
  if (normalized === 12) return "12:00 PM";
  if (normalized > 12) return `${normalized - 12}:00 PM`;
  return `${normalized}:00 AM`;
}

/**
 * Returns a night-time risk multiplier peaking between 22:00–03:00.
 */
export function getTimeRiskFactor(timeOfDay: number): number {
  const hour = ((timeOfDay % 24) + 24) % 24;

  if (hour >= 8 && hour <= 17) return 0.18;
  if (hour >= 18 && hour <= 20) return 0.45;
  if (hour >= 21 || hour <= 2) {
    const peakHour = 22;
    const distance = Math.min(Math.abs(hour - peakHour), Math.abs(hour - peakHour + 24));
    return 0.72 + (2 - Math.min(distance, 2)) * 0.14;
  }
  if (hour >= 3 && hour <= 5) return 0.62;
  return 0.35;
}

/**
 * Street lighting index derived from hour — drops sharply after sunset.
 * Supports both getZoneLighting(zone, timeOfDay) and getZoneLighting(timeOfDay)
 */
export function getZoneLighting(zoneOrTime: Zone | number, timeOfDay?: number): number {
  const hour = typeof zoneOrTime === "number" ? zoneOrTime : (timeOfDay ?? 22);
  const normalized = ((hour % 24) + 24) % 24;

  if (normalized >= 7 && normalized <= 18) return 85 + Math.sin(((normalized - 7) / 11) * Math.PI) * 10;
  if (normalized >= 19 && normalized <= 21) return 55 - (normalized - 19) * 12;
  if (normalized >= 22 || normalized <= 4) return Math.max(8, 22 - (normalized >= 22 ? normalized - 22 : normalized + 2) * 3);
  return 30 + normalized * 4;
}

export function calculateRiskScore(
  zoneData: ZoneRiskInput,
  timeOfDay: number,
  cctvCoverage: number,
  lighting: number
): number {
  return calculateRiskScoreDetailed(zoneData, timeOfDay, cctvCoverage, lighting).score;
}

export function calculateRiskScoreDetailed(
  zoneData: ZoneRiskInput,
  timeOfDay: number,
  cctvCoverage: number,
  lighting: number
): RiskScoreBreakdown {
  const clampedCctv = Math.min(100, Math.max(0, cctvCoverage));
  const clampedLighting = Math.min(100, Math.max(0, lighting));

  const incidentLoad = Math.min(
    1,
    zoneData.recentIncidentCount * 0.08 +
      zoneData.highSeverityCount * 0.12 +
      zoneData.severityIndex * 0.35
  );

  const timeFactor = getTimeRiskFactor(timeOfDay);
  const cctvDeficit = (100 - clampedCctv) / 100;
  const lightingDeficit = (100 - clampedLighting) / 100;

  const rawScore =
    (incidentLoad * 0.38 +
      timeFactor * 0.27 +
      cctvDeficit * 0.22 +
      lightingDeficit * 0.13) *
    100;

  const score = Math.round(Math.min(100, Math.max(0, rawScore)));

  let level: "low" | "medium" | "high" = "low";
  if (score >= 70) level = "high";
  else if (score >= 40) level = "medium";

  return {
    score,
    level,
    factors: {
      incidentContribution: Math.round(incidentLoad * 0.38 * 100),
      timeContribution: Math.round(timeFactor * 0.27 * 100),
      cctvContribution: Math.round(cctvDeficit * 0.22 * 100),
      lightingContribution: Math.round(lightingDeficit * 0.13 * 100),
      aiBoost: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Crime Category & Time-Based Filters & Analytics Engine
// ---------------------------------------------------------------------------

export function filterIncidentsByTime(
  incidents: Incident[],
  timeFilter: TimeFilterPeriod
): { current: Incident[]; previous: Incident[] } {
  const now = new Date();
  let daysCurrent = 30;
  let daysPrevious = 30;

  switch (timeFilter) {
    case "Today":
      daysCurrent = 1;
      daysPrevious = 1;
      break;
    case "Last 7 Days":
      daysCurrent = 7;
      daysPrevious = 7;
      break;
    case "Last 30 Days":
      daysCurrent = 30;
      daysPrevious = 30;
      break;
    case "Last 6 Months":
      daysCurrent = 180;
      daysPrevious = 180;
      break;
    case "All Time":
    default:
      return {
        current: incidents,
        previous: incidents.slice(0, Math.floor(incidents.length * 0.7)),
      };
  }

  const currentCutoff = new Date(now.getTime() - daysCurrent * 24 * 60 * 60 * 1000);
  const previousCutoff = new Date(
    now.getTime() - (daysCurrent + daysPrevious) * 24 * 60 * 60 * 1000
  );

  const current = incidents.filter((inc) => new Date(inc.timestamp) >= currentCutoff);
  const previous = incidents.filter((inc) => {
    const t = new Date(inc.timestamp);
    return t >= previousCutoff && t < currentCutoff;
  });

  return { current, previous };
}

export function filterIncidentsByCategory(
  incidents: Incident[],
  categoryFilter: CrimeCategoryFilter
): Incident[] {
  if (categoryFilter === "All Crime") return incidents;

  return incidents.filter((inc) => {
    if (categoryFilter === "Theft") {
      return inc.type === "Theft" || inc.type === "Chain-snatching";
    }
    if (categoryFilter === "Robbery") {
      return inc.type === "Robbery";
    }
    if (categoryFilter === "Assault") {
      return inc.type === "Assault" || inc.type === "Murder";
    }
    if (categoryFilter === "Vehicle Theft") {
      return inc.type === "Vehicle Theft";
    }
    if (categoryFilter === "Burglary") {
      return inc.type === "Burglary";
    }
    if (categoryFilter === "Other") {
      return (
        inc.type === "Accident" ||
        inc.type === "Cybercrime" ||
        inc.type === "Harassment" ||
        inc.type === "Smuggling" ||
        inc.type === "Other"
      );
    }
    return inc.type === categoryFilter;
  });
}

export function computeZoneCrimeRisk(
  zone: Zone,
  allZoneIncidents: Incident[],
  timeFilter: TimeFilterPeriod,
  categoryFilter: CrimeCategoryFilter,
  cameras: CCTVCamera[],
  simulatedHour: number = 22
): ZoneCrimeRiskAnalytics {
  const zoneIncidents = allZoneIncidents.filter((inc) => inc.zoneId === zone.id);
  const historicalCount = zoneIncidents.length;

  const { current: timeFilteredIncidents, previous: previousPeriodIncidents } =
    filterIncidentsByTime(zoneIncidents, timeFilter);

  const currentCategoryIncidents = filterIncidentsByCategory(
    timeFilteredIncidents,
    categoryFilter
  );
  const previousCategoryIncidents = filterIncidentsByCategory(
    previousPeriodIncidents,
    categoryFilter
  );

  const recentCount = currentCategoryIncidents.length;
  const prevCount = previousCategoryIncidents.length;

  let crimeTrendPercentage = 0;
  if (prevCount > 0) {
    crimeTrendPercentage = Math.round(((recentCount - prevCount) / prevCount) * 100);
  } else if (recentCount > 0) {
    crimeTrendPercentage = recentCount * 15;
  }

  const zoneCameras = cameras.filter((c) => c.zoneId === zone.id);
  const operationalCount = zoneCameras.filter((c) => c.isOperational).length;
  const totalCctv = Math.max(zoneCameras.length, 1);
  const cctvCoveragePercent = Math.round((operationalCount / totalCctv) * 100);

  let cctvCoverageStatus: "Good" | "Moderate" | "Poor" = "Moderate";
  if (cctvCoveragePercent >= 75) cctvCoverageStatus = "Good";
  else if (cctvCoveragePercent < 45 || zoneCameras.length <= 1) cctvCoverageStatus = "Poor";

  const isNightTime = simulatedHour >= 20 || simulatedHour <= 4;
  let nightRiskLevel: "High" | "Medium" | "Low" = "Low";
  if (isNightTime && (recentCount >= 4 || cctvCoverageStatus === "Poor")) {
    nightRiskLevel = "High";
  } else if (isNightTime || recentCount >= 3) {
    nightRiskLevel = "Medium";
  }

  let baseScore = 20;
  const incidentScore = Math.min(45, recentCount * 7.5);
  const trendScore = crimeTrendPercentage > 0 ? Math.min(20, crimeTrendPercentage * 0.4) : 0;
  const cctvPenalty = cctvCoverageStatus === "Poor" ? 20 : cctvCoverageStatus === "Moderate" ? 10 : 0;
  const nightPenalty = nightRiskLevel === "High" ? 15 : nightRiskLevel === "Medium" ? 8 : 0;

  let calculatedScore = Math.round(baseScore + incidentScore + trendScore + cctvPenalty + nightPenalty);
  calculatedScore = Math.max(10, Math.min(96, calculatedScore));

  let riskLevel: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  let circleColorHex = "#10B981"; // Green
  let circleFillOpacity = 0.35;
  let circleRadiusMeters = Math.max(1200, zone.radiusKm * 400);

  if (calculatedScore >= 70) {
    riskLevel = "HIGH";
    circleColorHex = "#EF4444"; // Red
    circleFillOpacity = 0.48;
    circleRadiusMeters = Math.max(1800, zone.radiusKm * 620);
  } else if (calculatedScore >= 40) {
    riskLevel = "MEDIUM";
    circleColorHex = "#F59E0B"; // Orange
    circleFillOpacity = 0.40;
    circleRadiusMeters = Math.max(1500, zone.radiusKm * 520);
  }

  const isEmergingHotspot = crimeTrendPercentage >= 15;
  const isCriticalPriority = riskLevel === "HIGH" && cctvCoverageStatus === "Poor";

  let status: ZoneCrimeRiskAnalytics["status"] = "SAFE & STABLE";
  if (isCriticalPriority) {
    status = "CRITICAL PRIORITY";
  } else if (isEmergingHotspot && riskLevel !== "LOW") {
    status = "EMERGING HOTSPOT";
  } else if (riskLevel === "HIGH") {
    status = "HIGH PRIORITY";
  } else if (riskLevel === "MEDIUM") {
    status = "MODERATE";
  }

  const highRiskReasons: string[] = [];
  if (recentCount >= 3) highRiskReasons.push("Recent incidents increased in selected timeframe");
  if (historicalCount >= 10) highRiskReasons.push("Historical crime rate in this sector is elevated");
  if (cctvCoverageStatus === "Poor") highRiskReasons.push("CCTV coverage is insufficient (coverage gaps / offline units)");
  if (nightRiskLevel === "High") highRiskReasons.push("Night-time vulnerability & low pedestrian footfall");
  if (crimeTrendPercentage > 0) highRiskReasons.push(`Crime velocity surging (+${crimeTrendPercentage}% change)`);

  if (highRiskReasons.length === 0) {
    highRiskReasons.push("Low incident frequency across all patrol shifts", "Consistent CCTV coverage and active patrol presence");
  }

  let aiRecommendation = "Maintain routine perimeter patrol shifts.";
  if (isCriticalPriority) {
    aiRecommendation = "CRITICAL DIRECTIVE: Deploy immediate quick-response interceptor unit and establish mobile CCTV surveillance tower during 8 PM – 12 AM.";
  } else if (isEmergingHotspot) {
    aiRecommendation = `EMERGING THREAT: Crime surge detected (+${crimeTrendPercentage}%). Deploy 2 additional PCR vans and intensify vehicle frisking at entry corridors.`;
  } else if (riskLevel === "HIGH") {
    aiRecommendation = "Deploy additional patrol units during 8 PM – 12 AM and conduct targeted foot patrols in commercial transit corridors.";
  } else if (riskLevel === "MEDIUM") {
    aiRecommendation = "Schedule high-visibility motorcycle patrol rounds during evening market hours (6 PM – 10 PM).";
  }

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    code: zone.code,
    lat: zone.lat,
    lng: zone.lng,
    riskScore: calculatedScore,
    riskLevel,
    recentIncidentsCount: recentCount,
    historicalIncidentsCount: historicalCount,
    crimeTrendPercentage,
    cctvCoverageStatus,
    cctvCoveragePercent,
    nightRiskLevel,
    status,
    isEmergingHotspot,
    isCriticalPriority,
    highRiskReasons,
    aiRecommendation,
    circleRadiusMeters,
    circleColorHex,
    circleFillOpacity,
  };
}

export function computeAllZonesCrimeRisk(
  zones: Zone[],
  incidents: Incident[],
  timeFilter: TimeFilterPeriod,
  categoryFilter: CrimeCategoryFilter,
  cameras: CCTVCamera[],
  simulatedHour: number = 22
): ZoneCrimeRiskAnalytics[] {
  return zones.map((z) =>
    computeZoneCrimeRisk(z, incidents, timeFilter, categoryFilter, cameras, simulatedHour)
  );
}
