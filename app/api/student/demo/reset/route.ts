import { NextResponse } from "next/server";

import { isDemoStudentFallbackEnabled, resetDemoStudentFallback } from "@/src/student-demo/demo-store";

export async function POST() {
  if (!isDemoStudentFallbackEnabled()) {
    return NextResponse.json({ error: "Demo reset is unavailable" }, { status: 404 });
  }

  resetDemoStudentFallback();

  return NextResponse.json({ ok: true });
}
