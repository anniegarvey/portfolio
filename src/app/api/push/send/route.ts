import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sendDueReminders } from "@/lib/push/send";
import {
  deleteSchedule,
  loadAllSchedules,
  replaceSchedule,
} from "@/lib/push/store";
import { isPushConfigured, webPushSender } from "@/lib/push/webPush";

export const dynamic = "force-dynamic";

// Compares hashes so the check takes the same time however much matches.
function isAuthorized(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!(secret && header)) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(header), digest(`Bearer ${secret}`));
}

// Called every few minutes by the scheduled GitHub Actions workflow. The
// shared secret stops anyone else from triggering sends.
export async function POST(request: Request) {
  if (!isAuthorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push is not set up" }, { status: 503 });
  }

  const { sent, failed } = await sendDueReminders(
    await loadAllSchedules(),
    Date.now(),
    { send: webPushSender, replace: replaceSchedule, remove: deleteSchedule },
  );
  // The counts show up in the workflow's log.
  return NextResponse.json({ sent, failed });
}
