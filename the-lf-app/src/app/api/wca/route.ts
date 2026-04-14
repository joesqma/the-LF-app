import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const wcaId = request.nextUrl.searchParams
    .get("wca_id")
    ?.trim()
    .toUpperCase();

  if (!wcaId) {
    return NextResponse.json({ error: "wca_id is required" }, { status: 400 });
  }

  const res = await fetch(
    `https://www.worldcubeassociation.org/api/v0/persons/${wcaId}`,
    { headers: { Accept: "application/json" } },
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "WCA profile not found" },
      { status: 404 },
    );
  }

  const data = (await res.json()) as {
    person: {
      name: string;
      wca_id: string;
      personal_records?: {
        "333"?: {
          single?: { best: number };
          average?: { best: number };
        };
      };
    };
  };

  const person = data.person;
  const r333 = person.personal_records?.["333"] ?? null;

  return NextResponse.json({
    name: person.name,
    wca_id: person.wca_id,
    best_single: r333?.single?.best ?? null,
    best_average: r333?.average?.best ?? null,
  });
}
