export interface AccidentHotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  accidentCount: number;
  riskLevel: "High" | "Medium" | "Low";
}

export interface ZoneYtdCrimeData {
  category: string;
  incidents: number;
  previousYear: number;
  resolutionRate: number; // percentage
}

export interface ZoneVulnerabilityMetric {
  metric: string;
  score: number; // 0 - 100 scale
  cityAverage: number;
}

export interface StrategicAction {
  id: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Urgent";
  targetTime: string;
  assignedUnit: string;
  impactEstimate: string;
}

export interface ZoneDetail {
  id: string;
  name: string;
  code: string;
  safetyScore: number;
  status: "Safe" | "Moderate Risk" | "High Risk";
  officerInCharge: string;
  contactNumber: string;
  populationEstimate: number;
  activePatrols: number;
  operationalCctvCount: number;
  totalCctvCount: number;
  recentIncidentsCount: number;
  accidentHotspots: AccidentHotspot[];
  ytdCrimes: ZoneYtdCrimeData[];
  vulnerabilities: ZoneVulnerabilityMetric[];
  actions: StrategicAction[];
}

export const ZONE_DETAILS_MOCK: Record<string, ZoneDetail> = {
  sitabuldi: {
    id: "sitabuldi",
    name: "Sitabuldi",
    code: "NGP-SIT",
    safetyScore: 68,
    status: "Moderate Risk",
    officerInCharge: "ACP Rajesh Wankhede",
    contactNumber: "+91 712 2561001",
    populationEstimate: 125000,
    activePatrols: 8,
    operationalCctvCount: 34,
    totalCctvCount: 42,
    recentIncidentsCount: 14,
    accidentHotspots: [
      {
        id: "ah-1",
        name: "Sitabuldi Interchange Square",
        lat: 21.1465,
        lng: 79.081,
        accidentCount: 38,
        riskLevel: "High",
      },
      {
        id: "ah-2",
        name: "Manewada Road Junction",
        lat: 21.144,
        lng: 79.086,
        accidentCount: 24,
        riskLevel: "Medium",
      },
      {
        id: "ah-3",
        name: "Cotton Market Flyover Ramp",
        lat: 21.149,
        lng: 79.083,
        accidentCount: 45,
        riskLevel: "High",
      },
      {
        id: "ah-4",
        name: "Tekdi Ganesh Mandir Gate",
        lat: 21.1478,
        lng: 79.0885,
        accidentCount: 18,
        riskLevel: "Low",
      },
      {
        id: "ah-5",
        name: "Variety Square Crossing",
        lat: 21.1435,
        lng: 79.0775,
        accidentCount: 31,
        riskLevel: "Medium",
      },
    ],
    ytdCrimes: [
      { category: "Assaults", incidents: 42, previousYear: 51, resolutionRate: 88 },
      { category: "Smuggling/Drugs", incidents: 19, previousYear: 15, resolutionRate: 74 },
      { category: "Chain-Snatching", incidents: 64, previousYear: 82, resolutionRate: 62 },
      { category: "Robbery", incidents: 28, previousYear: 35, resolutionRate: 79 },
    ],
    vulnerabilities: [
      { metric: "Poor Lighting", score: 65, cityAverage: 45 },
      { metric: "Low CCTV", score: 38, cityAverage: 40 },
      { metric: "High Footfall", score: 88, cityAverage: 55 },
      { metric: "Low Patrols", score: 48, cityAverage: 50 },
      { metric: "Commercial Density", score: 92, cityAverage: 60 },
    ],
    actions: [
      {
        id: "act-1",
        title: "Deploy 2 Additional Night Patrols",
        description: "Focus on Variety Square and Cotton Market alleys between 22:00 and 04:00.",
        priority: "Urgent",
        targetTime: "Tonight, 22:00 IST",
        assignedUnit: "Patrol Unit Delta-4",
        impactEstimate: "-35% midnight incident risk",
      },
      {
        id: "act-2",
        title: "Repair 14 Blind Spot Streetlights",
        description: "Fix non-functional LED fixtures along Tekdi Road and Railway Station west exit.",
        priority: "High",
        targetTime: "Within 24 Hours",
        assignedUnit: "NMC Municipal Works",
        impactEstimate: "-50% chain-snatching vulnerability",
      },
      {
        id: "act-3",
        title: "Install 4 AI Speed Violation Cameras",
        description: "Set up speed limit enforcement cameras at Cotton Market Flyover ramp.",
        priority: "Medium",
        targetTime: "Next 3 Days",
        assignedUnit: "Nagpur Traffic Cell",
        impactEstimate: "-40% flyover accident rate",
      },
    ],
  },
  dharampeth: {
    id: "dharampeth",
    name: "Dharampeth",
    code: "NGP-DHA",
    safetyScore: 92,
    status: "Safe",
    officerInCharge: "ACP Smita Deshmukh",
    contactNumber: "+91 712 2561002",
    populationEstimate: 98000,
    activePatrols: 6,
    operationalCctvCount: 48,
    totalCctvCount: 50,
    recentIncidentsCount: 3,
    accidentHotspots: [
      {
        id: "ah-d1",
        name: "Laxmi Nagar Square",
        lat: 21.136,
        lng: 79.062,
        accidentCount: 12,
        riskLevel: "Low",
      },
      {
        id: "ah-d2",
        name: "Law College Square",
        lat: 21.144,
        lng: 79.065,
        accidentCount: 15,
        riskLevel: "Medium",
      },
      {
        id: "ah-d3",
        name: "Coffee House Square",
        lat: 21.141,
        lng: 79.06,
        accidentCount: 8,
        riskLevel: "Low",
      },
    ],
    ytdCrimes: [
      { category: "Assaults", incidents: 8, previousYear: 12, resolutionRate: 95 },
      { category: "Smuggling/Drugs", incidents: 3, previousYear: 5, resolutionRate: 90 },
      { category: "Chain-Snatching", incidents: 14, previousYear: 22, resolutionRate: 78 },
      { category: "Robbery", incidents: 5, previousYear: 8, resolutionRate: 85 },
    ],
    vulnerabilities: [
      { metric: "Poor Lighting", score: 20, cityAverage: 45 },
      { metric: "Low CCTV", score: 15, cityAverage: 40 },
      { metric: "High Footfall", score: 72, cityAverage: 55 },
      { metric: "Low Patrols", score: 30, cityAverage: 50 },
      { metric: "Commercial Density", score: 75, cityAverage: 60 },
    ],
    actions: [
      {
        id: "act-d1",
        title: "Enhance Foot Patrol at High Street",
        description: "Maintain visible police presence outside West High Road cafes until 23:00.",
        priority: "Medium",
        targetTime: "Daily 19:00 - 23:00",
        assignedUnit: "Beat Officer Alpha-2",
        impactEstimate: "+15% public confidence",
      },
    ],
  },
  sadar: {
    id: "sadar",
    name: "Sadar",
    code: "NGP-SAD",
    safetyScore: 84,
    status: "Safe",
    officerInCharge: "Insp. Vikram Patil",
    contactNumber: "+91 712 2561003",
    populationEstimate: 110000,
    activePatrols: 7,
    operationalCctvCount: 40,
    totalCctvCount: 44,
    recentIncidentsCount: 5,
    accidentHotspots: [
      {
        id: "ah-s1",
        name: "Residency Road Crossing",
        lat: 21.161,
        lng: 79.078,
        accidentCount: 19,
        riskLevel: "Medium",
      },
      {
        id: "ah-s2",
        name: "Mount Road Signal",
        lat: 21.164,
        lng: 79.082,
        accidentCount: 14,
        riskLevel: "Low",
      },
      {
        id: "ah-s3",
        name: "Liberty Cinema Square",
        lat: 21.157,
        lng: 79.076,
        accidentCount: 22,
        riskLevel: "Medium",
      },
    ],
    ytdCrimes: [
      { category: "Assaults", incidents: 18, previousYear: 24, resolutionRate: 90 },
      { category: "Smuggling/Drugs", incidents: 9, previousYear: 14, resolutionRate: 82 },
      { category: "Chain-Snatching", incidents: 21, previousYear: 31, resolutionRate: 75 },
      { category: "Robbery", incidents: 11, previousYear: 16, resolutionRate: 84 },
    ],
    vulnerabilities: [
      { metric: "Poor Lighting", score: 32, cityAverage: 45 },
      { metric: "Low CCTV", score: 25, cityAverage: 40 },
      { metric: "High Footfall", score: 68, cityAverage: 55 },
      { metric: "Low Patrols", score: 35, cityAverage: 50 },
      { metric: "Commercial Density", score: 78, cityAverage: 60 },
    ],
    actions: [
      {
        id: "act-s1",
        title: "CCTV Blindspot Expansion",
        description: "Add 4 dome cameras along Mount Road behind Raj Bhavan complex.",
        priority: "Medium",
        targetTime: "This Week",
        assignedUnit: "CCTV Infra Wing",
        impactEstimate: "Eliminate 2 major blindspots",
      },
    ],
  },
  hudkeshwar: {
    id: "hudkeshwar",
    name: "Hudkeshwar",
    code: "NGP-HUD",
    safetyScore: 45,
    status: "High Risk",
    officerInCharge: "ACP Anjali Shinde",
    contactNumber: "+91 712 2561004",
    populationEstimate: 178000,
    activePatrols: 5,
    operationalCctvCount: 18,
    totalCctvCount: 30,
    recentIncidentsCount: 22,
    accidentHotspots: [
      {
        id: "ah-h1",
        name: "Hudkeshwar Ring Road Bypass",
        lat: 21.108,
        lng: 79.112,
        accidentCount: 52,
        riskLevel: "High",
      },
      {
        id: "ah-h2",
        name: "Pipla Road Junction",
        lat: 21.102,
        lng: 79.105,
        accidentCount: 39,
        riskLevel: "High",
      },
      {
        id: "ah-h3",
        name: "Mhalgi Nagar Square",
        lat: 21.114,
        lng: 79.118,
        accidentCount: 29,
        riskLevel: "Medium",
      },
    ],
    ytdCrimes: [
      { category: "Assaults", incidents: 58, previousYear: 44, resolutionRate: 72 },
      { category: "Smuggling/Drugs", incidents: 34, previousYear: 28, resolutionRate: 65 },
      { category: "Chain-Snatching", incidents: 71, previousYear: 60, resolutionRate: 54 },
      { category: "Robbery", incidents: 41, previousYear: 32, resolutionRate: 68 },
    ],
    vulnerabilities: [
      { metric: "Poor Lighting", score: 82, cityAverage: 45 },
      { metric: "Low CCTV", score: 75, cityAverage: 40 },
      { metric: "High Footfall", score: 45, cityAverage: 55 },
      { metric: "Low Patrols", score: 78, cityAverage: 50 },
      { metric: "Commercial Density", score: 40, cityAverage: 60 },
    ],
    actions: [
      {
        id: "act-h1",
        title: "Immediate Night Checkpoint Setup",
        description: "Establish static police picket at Ring Road Bypass between 21:00 and 03:00.",
        priority: "Urgent",
        targetTime: "Immediate",
        assignedUnit: "Rapid Response Unit-9",
        impactEstimate: "-45% highway robbery attempt",
      },
      {
        id: "act-h2",
        title: "Solar High-Mast Light Installation",
        description: "Deploy 8 temporary high-mast lights along unlit stretches of Pipla Road.",
        priority: "High",
        targetTime: "48 Hours",
        assignedUnit: "Smart City Infra Cell",
        impactEstimate: "Light up 2.4 km dark corridor",
      },
    ],
  },
  pardi: {
    id: "pardi",
    name: "Pardi",
    code: "NGP-PAR",
    safetyScore: 32,
    status: "High Risk",
    officerInCharge: "ACP Mahendra Gaikwad",
    contactNumber: "+91 712 2561005",
    populationEstimate: 142000,
    activePatrols: 6,
    operationalCctvCount: 16,
    totalCctvCount: 32,
    recentIncidentsCount: 31,
    accidentHotspots: [
      {
        id: "ah-p1",
        name: "Pardi Naka Freight Intersection",
        lat: 21.148,
        lng: 79.142,
        accidentCount: 68,
        riskLevel: "High",
      },
      {
        id: "ah-p2",
        name: "Bhandara Road Truck Terminal",
        lat: 21.155,
        lng: 79.151,
        accidentCount: 54,
        riskLevel: "High",
      },
      {
        id: "ah-p3",
        name: "Kapsi Octroi Post",
        lat: 21.141,
        lng: 79.135,
        accidentCount: 41,
        riskLevel: "High",
      },
    ],
    ytdCrimes: [
      { category: "Assaults", incidents: 64, previousYear: 58, resolutionRate: 68 },
      { category: "Smuggling/Drugs", incidents: 52, previousYear: 41, resolutionRate: 60 },
      { category: "Chain-Snatching", incidents: 85, previousYear: 76, resolutionRate: 48 },
      { category: "Robbery", incidents: 56, previousYear: 49, resolutionRate: 62 },
    ],
    vulnerabilities: [
      { metric: "Poor Lighting", score: 88, cityAverage: 45 },
      { metric: "Low CCTV", score: 82, cityAverage: 40 },
      { metric: "High Footfall", score: 50, cityAverage: 55 },
      { metric: "Low Patrols", score: 84, cityAverage: 50 },
      { metric: "Commercial Density", score: 70, cityAverage: 60 },
    ],
    actions: [
      {
        id: "act-p1",
        title: "Deploy Heavy Vehicle Traffic Control Unit",
        description: "Station 4 dedicated traffic marshals at Pardi Naka to regulate freight transit.",
        priority: "Urgent",
        targetTime: "Tomorrow Morning 07:00",
        assignedUnit: "Traffic Wing East",
        impactEstimate: "-40% heavy vehicle crashes",
      },
    ],
  },
  mankapur: {
    id: "mankapur",
    name: "Mankapur",
    code: "NGP-MAN",
    safetyScore: 78,
    status: "Moderate Risk",
    officerInCharge: "Insp. Rahul Kale",
    contactNumber: "+91 712 2561006",
    populationEstimate: 85000,
    activePatrols: 5,
    operationalCctvCount: 30,
    totalCctvCount: 35,
    recentIncidentsCount: 8,
    accidentHotspots: [
      {
        id: "ah-m1",
        name: "Mankapur Stadium Square",
        lat: 21.182,
        lng: 79.068,
        accidentCount: 22,
        riskLevel: "Medium",
      },
      {
        id: "ah-m2",
        name: "Ring Road Koradi Turn",
        lat: 21.188,
        lng: 79.074,
        accidentCount: 28,
        riskLevel: "Medium",
      },
    ],
    ytdCrimes: [
      { category: "Assaults", incidents: 22, previousYear: 28, resolutionRate: 85 },
      { category: "Smuggling/Drugs", incidents: 12, previousYear: 15, resolutionRate: 80 },
      { category: "Chain-Snatching", incidents: 30, previousYear: 42, resolutionRate: 70 },
      { category: "Robbery", incidents: 15, previousYear: 20, resolutionRate: 82 },
    ],
    vulnerabilities: [
      { metric: "Poor Lighting", score: 40, cityAverage: 45 },
      { metric: "Low CCTV", score: 35, cityAverage: 40 },
      { metric: "High Footfall", score: 60, cityAverage: 55 },
      { metric: "Low Patrols", score: 42, cityAverage: 50 },
      { metric: "Commercial Density", score: 55, cityAverage: 60 },
    ],
    actions: [
      {
        id: "act-m1",
        title: "Event Crowd Safety Deployment",
        description: "Position mobile surveillance van during major sports events at Mankapur Complex.",
        priority: "Medium",
        targetTime: "As per event schedule",
        assignedUnit: "Mobile Control Unit 2",
        impactEstimate: "100% event area coverage",
      },
    ],
  },
};

/** Get zone details by ID with realistic fallback */
export function getZoneDetailById(id: string): ZoneDetail {
  const normalizedId = id.toLowerCase().replace("zone-", "");
  return (
    ZONE_DETAILS_MOCK[normalizedId] || {
      id: normalizedId,
      name: normalizedId.charAt(0).toUpperCase() + normalizedId.slice(1),
      code: `NGP-${normalizedId.slice(0, 3).toUpperCase()}`,
      safetyScore: 65,
      status: "Moderate Risk",
      officerInCharge: "ACP Duty Officer",
      contactNumber: "+91 712 2561000",
      populationEstimate: 100000,
      activePatrols: 5,
      operationalCctvCount: 25,
      totalCctvCount: 30,
      recentIncidentsCount: 12,
      accidentHotspots: [
        {
          id: `ah-${normalizedId}-1`,
          name: `${normalizedId} Central Square`,
          lat: 21.1458,
          lng: 79.0882,
          accidentCount: 25,
          riskLevel: "Medium",
        },
      ],
      ytdCrimes: [
        { category: "Assaults", incidents: 25, previousYear: 30, resolutionRate: 80 },
        { category: "Smuggling/Drugs", incidents: 15, previousYear: 20, resolutionRate: 75 },
        { category: "Chain-Snatching", incidents: 40, previousYear: 50, resolutionRate: 65 },
        { category: "Robbery", incidents: 20, previousYear: 25, resolutionRate: 75 },
      ],
      vulnerabilities: [
        { metric: "Poor Lighting", score: 50, cityAverage: 45 },
        { metric: "Low CCTV", score: 45, cityAverage: 40 },
        { metric: "High Footfall", score: 60, cityAverage: 55 },
        { metric: "Low Patrols", score: 50, cityAverage: 50 },
        { metric: "Commercial Density", score: 60, cityAverage: 60 },
      ],
      actions: [
        {
          id: `act-${normalizedId}-1`,
          title: "Increase Night Patrol Coverage",
          description: "Deploy additional mobile patrol team during peak vulnerability hours.",
          priority: "High",
          targetTime: "22:00 IST",
          assignedUnit: "Patrol Unit Bravo",
          impactEstimate: "-30% night risk",
        },
      ],
    }
  );
}
