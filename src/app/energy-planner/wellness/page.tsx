"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { styled } from "next-yak";
import { WellnessDashboard } from "@/components/energy-planner/WellnessDashboard";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { PageHeader, PageTitle } from "@/components/PageHeader";
import { WellnessProvider } from "@/lib/wellness/context";

export default function WellnessPage() {
  return (
    <WellnessProvider>
      <MaxWidthWrapper as="main">
        <BackLink href="/energy-planner">
          <ArrowLeft aria-hidden="true" size={18} />
          Energy Planner
        </BackLink>
        <PageHeader>
          <PageTitle>Wellness Trends</PageTitle>
        </PageHeader>
        <WellnessDashboard />
      </MaxWidthWrapper>
    </WellnessProvider>
  );
}

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: light-dark(var(--color-primary-700), var(--color-primary-400));
  text-decoration: none;
  margin-top: 24px;
  transition: color 0.2s;

  &:hover {
    color: light-dark(var(--color-primary-500), var(--color-primary-200));
  }
`;
