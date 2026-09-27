"use client";

import { styled } from "next-yak";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { MaxWidthWrapper } from "@/components/MaxWidthWrapper";
import { PageHeader, PageTitle } from "@/components/PageHeader";
import { QUERIES } from "@/lib/constants";
import {
  DEFAULT_SETTINGS,
  type DriftSettings,
  loadSettings,
  saveSettings,
} from "@/lib/drift/settings";
import { DriftCanvas, type DriftCanvasHandle } from "../DriftCanvas";
import { DriftSettingsPanel } from "../DriftSettingsPanel";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

export function DriftPage() {
  const [settings, setSettings] = useState<DriftSettings>({
    ...DEFAULT_SETTINGS,
  });
  const calm = usePrefersReducedMotion();
  const canvas = useRef<DriftCanvasHandle>(null);

  // Stored settings load after mount, so the server render and the first
  // client render agree.
  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const update = (next: DriftSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  return (
    <MaxWidthWrapper as="main">
      <PageHeader>
        <PageTitle>Drift</PageTitle>
        <Intro>
          Stir the water with your pointer or a fingertip, then watch it settle.
        </Intro>
      </PageHeader>

      <Layout>
        <DriftCanvas calm={calm} ref={canvas} settings={settings} />
        <DriftSettingsPanel
          calm={calm}
          onBloom={() => canvas.current?.bloom()}
          onChange={(change) => update({ ...settings, ...change })}
          onClear={() => canvas.current?.clear()}
          onReset={() => update({ ...DEFAULT_SETTINGS })}
          settings={settings}
        />
      </Layout>
    </MaxWidthWrapper>
  );
}

const Intro = styled.p`
  margin: 0;
  text-align: center;
  color: light-dark(var(--color-grey-700), var(--color-grey-300));
`;

const Layout = styled.div`
  display: grid;
  gap: 20px;
  margin-bottom: 48px;

  @media (${QUERIES.DESKTOP_UP}) {
    grid-template-columns: 1fr 280px;
    align-items: start;
  }
`;
