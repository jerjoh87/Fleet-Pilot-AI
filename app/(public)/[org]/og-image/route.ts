import { getPublicTenant } from "@/lib/data/public-data";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

export async function GET(_request: Request, { params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const tenant = await getPublicTenant(org);
  const name = escapeXml(tenant?.name ?? "FleetPilot AI");
  const hero = escapeXml(tenant?.heroTitle ?? "Premium vehicles, booked in minutes.");
  const serviceArea = escapeXml(tenant?.serviceArea || "Local vehicle rentals");
  const brand = tenant?.brandColor ?? "#166534";
  const initial = name.slice(0, 1);

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#f8fafc"/>
    <rect x="72" y="72" width="76" height="76" rx="20" fill="${brand}"/>
    <text x="110" y="124" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="white">${initial}</text>
    <text x="172" y="111" font-family="Arial, sans-serif" font-size="38" font-weight="800" fill="#0f172a">${name}</text>
    <text x="172" y="146" font-family="Arial, sans-serif" font-size="24" fill="#475569">${serviceArea}</text>
    <foreignObject x="72" y="238" width="920" height="190">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font: 900 68px/1.04 Arial, sans-serif; color: #0f172a; letter-spacing: 0;">${hero}</div>
    </foreignObject>
    <text x="72" y="484" font-family="Arial, sans-serif" font-size="30" fill="#334155">Browse, book, and manage reservations online.</text>
    <rect x="72" y="554" width="72" height="8" rx="4" fill="${brand}"/>
    <text x="162" y="566" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="${brand}">Powered by FleetPilot AI</text>
  </svg>`;

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=3600"
    }
  });
}
