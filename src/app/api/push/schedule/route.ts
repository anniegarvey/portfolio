import { NextResponse } from "next/server";
import {
  scheduleRequestFor,
  UnsubscribeRequestSchema,
} from "@/lib/push/schema";
import { deleteSchedule, saveSchedule } from "@/lib/push/store";
import { isPushConfigured } from "@/lib/push/webPush";

export const dynamic = "force-dynamic";

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

// Replaces this device's upcoming reminders with the planner's latest list.
export async function PUT(request: Request) {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push is not set up" }, { status: 503 });
  }
  const parsed = scheduleRequestFor(Date.now()).safeParse(
    await readJson(request),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid schedule" }, { status: 400 });
  }
  if (!(await saveSchedule(parsed.data))) {
    return NextResponse.json({ error: "Too many devices" }, { status: 429 });
  }
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(request: Request) {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push is not set up" }, { status: 503 });
  }
  const parsed = UnsubscribeRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  await deleteSchedule(parsed.data.endpoint);
  return new NextResponse(null, { status: 204 });
}
