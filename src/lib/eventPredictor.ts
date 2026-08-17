import type { CCTVCamera, CrimeType, Incident, Zone } from "./types";
import { computeZoneAnalytics } from "./zoneAnalytics";

export interface PredictedEvent {
  id: string;
  zoneId: string;
  zoneName: string;
  hour: number;
  probability: number;
  type: CrimeType;
  confidence: "low" | "medium" | "high";
}

export interface HourlyForecast {
  hour: number;
  label: string;
  totalProbability: number;
  predictedCount: number;
  topZone: string;
}

const CRIME_TYPES: CrimeType[] = ["Chain-snatching", "Robbery", "Murder"];

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/**
 * Simulated AI event predictor — uses zone risk + temporal patterns
 * to forecast likely incidents over the next 24 hours.
 */
export function predictEvents(
  zones: Zone[],
  incidents: Incident[],
  cameras: CCTVCamera[],
  fromHour: number,
): { events: PredictedEvent[]; hourly: HourlyForecast[] } {
  const events: PredictedEvent[] = [];
  const hourly: HourlyForecast[] = [];

  for (let offset = 1; offset <= 24; offset++) {
    const hour = (fromHour + offset) % 24;
    const zoneStats = computeZoneAnalytics(zones, incidents, cameras, hour);

    let hourTotal = 0;
    let topZone = zoneStats[0]?.zoneName ?? "—";

    for (const zone of zoneStats) {
      if (zone.riskScore > (zoneStats[0]?.riskScore ?? 0) * 0.95) {
        topZone = zone.zoneName;
      }

      const nightFactor = hour >= 20 || hour <= 5 ? 1.35 : hour >= 18 ? 1.1 : 0.75;
      const cctvGap = 1 - zone.cctvCoverage / 100;
      const baseProb = (zone.riskScore / 100) * nightFactor * (0.6 + cctvGap * 0.4);
      const probability = Math.min(0.92, Math.round(baseProb * 100) / 100);

      if (probability >= 0.35) {
        const type =
          zone.riskScore > 80
            ? "Robbery"
            : hour >= 20 || hour <= 4
              ? "Chain-snatching"
              : CRIME_TYPES[Math.floor(probability * 3) % 3]!;

        events.push({
          id: `pred-${zone.zoneId}-${hour}`,
          zoneId: zone.zoneId,
          zoneName: zone.zoneName,
          hour,
          probability,
          type,
          confidence:
            probability > 0.7 ? "high" : probability > 0.5 ? "medium" : "low",
        });
      }

      hourTotal += probability;
    }

    hourly.push({
      hour,
      label: formatHour(hour),
      totalProbability: Math.round(hourTotal * 10) / 10,
      predictedCount: Math.max(1, Math.round(hourTotal * 0.8)),
      topZone,
    });
  }

  return {
    events: events.sort((a, b) => b.probability - a.probability),
    hourly,
  };
}

export function getPeakRiskHours(hourly: HourlyForecast[], limit = 3) {
  return [...hourly].sort((a, b) => b.totalProbability - a.totalProbability).slice(0, limit);
}
