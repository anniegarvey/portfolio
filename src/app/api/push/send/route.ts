import { NextResponse } from "next/server";
import { sendDueReminders } from "@/lib/push/send";
import {
  deleteSchedule,
  loadAllSchedules,
  saveSchedule,
} from "@/lib/push/store";
import { isPushConfigured, webPushSender } from "@/lib/push/webPush";

export const dynamic = "force-dynamic";

// Called every few minutes by the scheduled GitHub Actions workflow. The
// shared secret stops anyone else from triggering sends.
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push is not set up" }, { status: 503 });
  }

  const { sent, failed, updates } = await sendDueReminders(
    await loadAllSchedules(),
    Date.now(),
    webPushSender,
  );
  await Promise.all(
    updates.map(({ endpoint, schedule }) =>
      schedule ? saveSchedule(schedule) : deleteSchedule(endpoint),
    ),
  );
  // The counts show up in the workflow's log.
  return NextResponse.json({ sent, failed });
}
