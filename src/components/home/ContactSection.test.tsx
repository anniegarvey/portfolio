import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GITHUB_URL, LINKEDIN_URL } from "@/lib/constants";
import { ContactSection } from "./ContactSection";

// FadeIn relies on IntersectionObserver, which jsdom doesn't provide. A no-op
// stub lets the section render.
function MockIntersectionObserver(this: unknown) {}
MockIntersectionObserver.prototype.observe = vi.fn();
MockIntersectionObserver.prototype.disconnect = vi.fn();
MockIntersectionObserver.prototype.unobserve = vi.fn();

describe("ContactSection", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  it("renders the heading as a labelled region", () => {
    render(<ContactSection />);
    expect(
      screen.getByRole("region", { name: "Get in touch" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Let's build something worth talking about",
      }),
    ).toBeInTheDocument();
  });

  it("links the GitHub CTA to the shared GitHub URL", () => {
    render(<ContactSection />);
    const github = screen.getByRole("link", { name: "GitHub profile" });
    expect(github).toHaveAttribute("href", GITHUB_URL);
    expect(github).toHaveAttribute("target", "_blank");
    expect(github).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("links the LinkedIn CTA to the shared LinkedIn URL", () => {
    render(<ContactSection />);
    const linkedin = screen.getByRole("link", { name: "LinkedIn profile" });
    expect(linkedin).toHaveAttribute("href", LINKEDIN_URL);
    expect(linkedin).toHaveAttribute("target", "_blank");
    expect(linkedin).toHaveAttribute("rel", "noopener noreferrer");
  });
});
