import { NextResponse } from "next/server";
import { getMockMeta, zones } from "@/lib/mockData";
import type { ZonesResponse } from "@/lib/types";

export async function GET() {
  const response: ZonesResponse = {
    data: zones,
    meta: getMockMeta(zones.length),
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
