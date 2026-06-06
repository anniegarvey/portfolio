import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectsSection } from "./ProjectsSection";

// FadeIn (rendered around each card) relies on IntersectionObserver, which
// jsdom doesn't provide. A no-op stub lets the section render.
function MockIntersectionObserver(this: unknown) {}
MockIntersectionObserver.prototype.observe = vi.fn();
MockIntersectionObserver.prototype.disconnect = vi.fn();
MockIntersectionObserver.prototype.unobserve = vi.fn();

const PROJECTS = [
  {
    title: "Energy Planner",
    href: "/projects/energy-planner",
    description:
      "An extended spoon theory tool for managing daily energy and activities",
  },
  {
    title: "Bonsai Garden",
    href: "/projects/bonsai",
    description:
      "A bonsai growing simulation with realistic procedural tree generation, gamification providing rewards for Energy Planner interaction",
  },
  {
    title: "One Anthem",
    href: "/projects/one-anthem",
    description:
      "A multilingual song of unity created in response to the invasion of Ukraine",
  },
  {
    title: "WindTP",
    href: "/projects/windtp",
    description:
      "A WordPress site for a Wind Energy Storage startup — still live today",
  },
];

describe("ProjectsSection", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  it("renders every project title", () => {
    render(<ProjectsSection />);
    for (const { title } of PROJECTS) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("renders every project description so they are not hover-gated", () => {
    render(<ProjectsSection />);
    for (const { description } of PROJECTS) {
      expect(screen.getByText(description)).toBeInTheDocument();
    }
  });

  it("links each card to its project page", () => {
    render(<ProjectsSection />);
    for (const { title, href } of PROJECTS) {
      expect(screen.getByText(title).closest("a")).toHaveAttribute(
        "href",
        href,
      );
    }
  });

  it("applies per-project accent/glow custom properties and background", () => {
    render(<ProjectsSection />);
    const card = screen.getByText("Energy Planner").closest("a");
    expect(card).not.toBeNull();
    expect(card?.style.getPropertyValue("--project-accent")).toBe(
      "oklch(81.1% 0.111 293.571)",
    );
    expect(card?.style.getPropertyValue("--project-glow")).toBe(
      "var(--glow-accent-primary)",
    );

    // The decorative background layer carries the per-project gradient inline.
    const background = card?.firstElementChild as HTMLElement;
    expect(background.getAttribute("style")).toContain("background");
  });
});
