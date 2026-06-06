import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectsMenu } from "./ProjectsMenu";
import { CASE_STUDIES, LIVE_APPS, PLAYGROUND_LABEL } from "./projects";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/"),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function renderMenu() {
  render(
    <ul>
      <ProjectsMenu />
    </ul>,
  );
  const trigger = screen.getByRole("button", { name: /projects/i });
  const navItem = trigger.closest("li") as HTMLElement;
  return { trigger, navItem };
}

function hoverOpen(navItem: HTMLElement) {
  fireEvent.mouseEnter(navItem);
}

describe("ProjectsMenu", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the Projects trigger button", () => {
    renderMenu();
    expect(
      screen.getByRole("button", { name: /projects/i }),
    ).toBeInTheDocument();
  });

  it("menu is closed by default", () => {
    const { trigger } = renderMenu();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens on mouse enter", () => {
    const { trigger, navItem } = renderMenu();
    hoverOpen(navItem);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("click-toggles closed when already open via hover", async () => {
    const user = userEvent.setup();
    const { trigger, navItem } = renderMenu();

    hoverOpen(navItem);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    // button is now focused via hover; click toggles it closed
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes on Escape key", async () => {
    const user = userEvent.setup();
    const { trigger, navItem } = renderMenu();

    hoverOpen(navItem);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("returns focus to trigger on Escape when focus is inside the panel", async () => {
    const user = userEvent.setup();
    const { trigger, navItem } = renderMenu();

    hoverOpen(navItem);
    // First tab lands on the trigger button, second enters the panel
    await user.tab();
    await user.tab();
    expect(document.activeElement).not.toBe(trigger);

    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(trigger);
  });

  it("trigger has aria-controls referencing the panel id", () => {
    const { trigger } = renderMenu();
    const panelId = trigger.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId ?? "")).toBeInTheDocument();
  });

  it("closes on outside mousedown", async () => {
    const user = userEvent.setup();
    const { trigger, navItem } = renderMenu();

    hoverOpen(navItem);
    await user.click(document.body);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("schedules close after mouse leave and fires after delay", () => {
    vi.useFakeTimers();
    const { trigger, navItem } = renderMenu();

    hoverOpen(navItem);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.mouseLeave(navItem);
    // Still open — delay not elapsed
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("cancels scheduled close when mouse re-enters", () => {
    vi.useFakeTimers();
    const { trigger, navItem } = renderMenu();

    hoverOpen(navItem);
    fireEvent.mouseLeave(navItem);
    // Re-enter before delay
    fireEvent.mouseEnter(navItem);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("opens when trigger receives keyboard focus", () => {
    const { trigger } = renderMenu();
    fireEvent.focusIn(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("renders Playground label and live app titles", () => {
    renderMenu();
    expect(screen.getByText(PLAYGROUND_LABEL)).toBeInTheDocument();
    for (const app of LIVE_APPS) {
      expect(screen.getAllByText(app.title).length).toBeGreaterThan(0);
    }
  });

  it("renders Case Studies section with all blurbs", () => {
    renderMenu();
    expect(screen.getByText("Case Studies")).toBeInTheDocument();
    for (const cs of CASE_STUDIES) {
      expect(screen.getByText(cs.blurb)).toBeInTheDocument();
    }
  });

  it("closes menu when a live app link is clicked", async () => {
    const user = userEvent.setup();
    const { trigger, navItem } = renderMenu();

    hoverOpen(navItem);
    // Use the unique blurb to find the live-app link (not the case-study duplicate)
    const link = screen
      .getByText(LIVE_APPS[0].blurb)
      .closest("a") as HTMLElement;
    await user.click(link);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("marks the live app link active when on its route", () => {
    vi.mocked(usePathname).mockReturnValue("/energy-planner");
    const { navItem } = renderMenu();
    hoverOpen(navItem);

    const link = navItem.querySelector('a[href="/energy-planner"]');
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("marks the case study link active when on its route", () => {
    vi.mocked(usePathname).mockReturnValue("/projects/one-anthem");
    const { navItem } = renderMenu();
    hoverOpen(navItem);

    const link = navItem.querySelector('a[href="/projects/one-anthem"]');
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("marks no menu link active when on the home route", () => {
    const { navItem } = renderMenu();
    hoverOpen(navItem);

    const active = navItem.querySelectorAll('a[aria-current="page"]');
    expect(active).toHaveLength(0);
  });

  it("closes menu when a case study link is clicked", async () => {
    const user = userEvent.setup();
    const { trigger, navItem } = renderMenu();

    hoverOpen(navItem);
    // One Anthem is unique to case studies
    const link = screen.getByText("One Anthem").closest("a") as HTMLElement;
    await user.click(link);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
