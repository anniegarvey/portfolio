import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GladeBackdrop } from "./GladeBackdrop";

describe("GladeBackdrop", () => {
  it("is decoration only, hidden from assistive technology", () => {
    const { container } = render(<GladeBackdrop />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("places props along the glade by percentage, at a fixed pixel size", () => {
    const { container } = render(<GladeBackdrop />);
    const pond = [...container.querySelectorAll<HTMLElement>("div")].find(
      (el) => el.style.width === "210px",
    );
    expect(pond?.style.left).toBe("79%");
    expect(pond?.style.top).toBe("272px");
  });

  it("stretches only the land, and keeps every prop's own shape", () => {
    const { container } = render(<GladeBackdrop />);
    const stretched = container.querySelectorAll(
      'svg[preserveAspectRatio="none"]',
    );
    expect(stretched).toHaveLength(1);
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(30);
  });

  it("parks each cloud in its own place for reduced motion", () => {
    const { container } = render(<GladeBackdrop />);
    const parks = [...container.querySelectorAll<HTMLElement>("div")]
      .map((el) => el.style.getPropertyValue("--cloud-park"))
      .filter(Boolean);
    expect(parks.length).toBeGreaterThan(1);
    expect(new Set(parks).size).toBe(parks.length);
  });
});
