import { NextResponse } from "next/server";
import { isPushConfigured } from "@/lib/push/webPush";

export const dynamic = "force-dynamic";

// The planner asks for the public key at runtime, so setting the env vars on
// the server is enough to turn push on, with no rebuild.
export function GET() {
  if (!isPushConfigured()) {
    return NextResponse.json({ enabled: false });
  }
  return NextResponse.json({
    enabled: true,
    publicKey: process.env.VAPID_PUBLIC_KEY,
  });
}
