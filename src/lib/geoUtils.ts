import type { EssentialService, ServiceCategory } from "./nearbyServicesData";

export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  label?: string;
}

// Default Fallback: Sitabuldi Center, Nagpur
export const DEFAULT_NAGPUR_USER_LOCATION: UserLocation = {
  lat: 21.1458,
  lng: 79.0882,
  label: "Nagpur Center (Sitabuldi)",
};

/**
 * Common Quick Locations across Nagpur for manual citizen switching
 */
export const POPULAR_NAGPUR_LOCATIONS: { name: string; lat: number; lng: number }[] = [
  { name: "Sitabuldi Metro Interchange", lat: 21.1489, lng: 79.0876 },
  { name: "Dharampeth (Zenda Chowk)", lat: 21.1415, lng: 79.0535 },
  { name: "Sadar Residency Road", lat: 21.1612, lng: 79.0788 },
  { name: "Medical Square (GMCH)", lat: 21.1274, lng: 79.0968 },
  { name: "Ramdaspeth Central", lat: 21.1384, lng: 79.0623 },
  { name: "IT Park Gayatri Nagar", lat: 21.1235, lng: 79.052 },
  { name: "Mahal Town Hall", lat: 21.144, lng: 79.111 },
  { name: "Pardi Bhandara Road", lat: 21.1186, lng: 79.0954 },
];

/**
 * Compute Haversine distance in meters between two coordinates
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Format distance in user-friendly format (e.g. "450 m away", "1.2 km away")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m away`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${km} km away`;
}

/**
 * Service with calculated distance attached
 */
export interface ServiceWithDistance extends EssentialService {
  distanceMeters: number;
  formattedDistance: string;
}

/**
 * Attach distance from citizen location and sort by nearest first
 */
export function getSortedNearbyServices(
  services: EssentialService[],
  userLocation: UserLocation,
  categoriesFilter?: ServiceCategory[]
): ServiceWithDistance[] {
  let filtered = services;

  if (categoriesFilter && categoriesFilter.length > 0) {
    const activeSet = new Set(categoriesFilter);
    filtered = services.filter((s) => activeSet.has(s.category));
  }

  const withDistances: ServiceWithDistance[] = filtered.map((service) => {
    const dist = calculateDistanceMeters(
      userLocation.lat,
      userLocation.lng,
      service.lat,
      service.lng
    );
    return {
      ...service,
      distanceMeters: dist,
      formattedDistance: formatDistance(dist),
    };
  });

  return withDistances.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Get nearest service for each selected category
 */
export function getNearestPerCategory(
  services: EssentialService[],
  userLocation: UserLocation
): Record<ServiceCategory, ServiceWithDistance | null> {
  const sorted = getSortedNearbyServices(services, userLocation);
  const result: Record<ServiceCategory, ServiceWithDistance | null> = {
    police: null,
    hospital: null,
    pharmacy: null,
    ambulance: null,
    fire_station: null,
    emergency_other: null,
  };

  for (const service of sorted) {
    if (!result[service.category]) {
      result[service.category] = service;
    }
  }

  return result;
}

/**
 * Build Google Maps Navigation URL from user location to service
 */
export function getGoogleMapsDirectionsUrl(
  userLocation: UserLocation,
  service: { lat: number; lng: number; name: string }
): string {
  const origin = `${userLocation.lat},${userLocation.lng}`;
  const destination = `${service.lat},${service.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

/**
 * Build a mobile phone call dialer link (e.g. "tel:+917122561245" or "tel:112")
 */
export function getPhoneDialerUrl(phoneNumber: string | null): string | null {
  if (!phoneNumber) return null;
  // Clean spaces, hyphens, and parentheses
  const cleaned = phoneNumber.replace(/[\s\-()]/g, "");
  return `tel:${cleaned}`;
}
