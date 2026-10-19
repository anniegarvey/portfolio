import { NextResponse } from "next/server";
import {
  ScheduleRequestSchema,
  UnsubscribeRequestSchema,
} from "@/lib/push/schema";
import { deleteSchedule, saveSchedule } from "@/lib/push/store";
import { isPushConfigured } from "@/lib/push/webPush";

export const dynamic = "force-dynamic";

// Replaces this device's upcoming reminders with the planner's latest list.
export async function PUT(request: Request) {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push is not set up" }, { status: 503 });
  }
  const parsed = ScheduleRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid schedule" }, { status: 400 });
  }
  await saveSchedule(parsed.data);
  return new NextResponse(null, { status: 204 });
}

export async function DELETE(request: Request) {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push is not set up" }, { status: 503 });
  }
  const parsed = UnsubscribeRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  await deleteSchedule(parsed.data.endpoint);
  return new NextResponse(null, { status: 204 });
}
