"use client";

import { useEffect, useState } from "react";
import type { CCTVCamera, Incident, Zone } from "@/lib/types";

export function useIntelligenceData() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [cameras, setCameras] = useState<CCTVCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [incidentsRes, zonesRes, cctvRes] = await Promise.all([
          fetch("/api/incidents"),
          fetch("/api/zones"),
          fetch("/api/cctv"),
        ]);

        if (!incidentsRes.ok || !zonesRes.ok || !cctvRes.ok) {
          throw new Error("Failed to load intelligence data");
        }

        const [incidentsJson, zonesJson, cctvJson] = await Promise.all([
          incidentsRes.json(),
          zonesRes.json(),
          cctvRes.json(),
        ]);

        if (!cancelled) {
          setIncidents(incidentsJson.data ?? []);
          setZones(zonesJson.data ?? []);
          setCameras(cctvJson.data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { incidents, zones, cameras, loading, error };
}
