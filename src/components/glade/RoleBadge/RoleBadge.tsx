"use client";

import {
  Carrot,
  Droplets,
  Heart,
  Lightbulb,
  type LucideIcon,
  Megaphone,
  Sparkles,
} from "lucide-react";
import { styled } from "next-yak";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/glade/catalog";
import type { BenefitRole } from "@/lib/glade/schema";

const ROLE_ICONS: Record<BenefitRole, LucideIcon> = {
  forager: Carrot,
  soother: Heart,
  beacon: Sparkles,
  muse: Lightbulb,
  herald: Megaphone,
  wellspring: Droplets,
};

export interface RoleBadgeProps {
  role: BenefitRole;
  /** Icon size in px. */
  size?: number;
}

/**
 * A small coloured icon chip identifying a resident's benefit role.
 * Decorative: hidden from assistive tech — pair it with visible or
 * accessible role text nearby.
 */
export function RoleBadge({ role, size = 12 }: RoleBadgeProps) {
  const Icon = ROLE_ICONS[role];
  return (
    <Badge
      aria-hidden="true"
      data-role={role}
      title={`${ROLE_LABELS[role]} — ${ROLE_DESCRIPTIONS[role]}`}
    >
      <Icon size={size} />
    </Badge>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const Badge = styled.span`
  display: inline-grid;
  place-items: center;
  padding: 0.15rem;
  border-radius: 50%;
  color: white;

  &[data-role="forager"] {
    background: light-dark(#5a8c3a, #4a7c2a);
  }
  &[data-role="soother"] {
    background: light-dark(#d16a94, #a84f74);
  }
  &[data-role="beacon"] {
    background: light-dark(#c99418, #9a7212);
  }
  &[data-role="muse"] {
    background: light-dark(#7a5fb8, #64499e);
  }
  &[data-role="herald"] {
    background: light-dark(#c96f2e, #a55723);
  }
  &[data-role="wellspring"] {
    background: light-dark(#2e8f96, #23707a);
  }
`;
