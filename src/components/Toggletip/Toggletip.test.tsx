import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { Toggletip } from "./Toggletip";

const CONTENT = "Plan your day according to your energy levels.";

describe("Toggletip", () => {
  it("renders the trigger button", () => {
    render(<Toggletip content={CONTENT} />);
    expect(screen.getByRole("button", { name: "About" })).toBeInTheDocument();
  });

  it("hides the popover by default", () => {
    render(<Toggletip content={CONTENT} />);
    expect(screen.getByRole("status", { hidden: true })).not.toBeVisible();
  });

  it("shows the popover when the button is clicked", async () => {
    const user = userEvent.setup();
    render(<Toggletip content={CONTENT} />);
    await user.click(screen.getByRole("button", { name: "About" }));
    expect(screen.getByRole("status")).toBeVisible();
    expect(screen.getByText(CONTENT)).toBeVisible();
  });

  it("hides the popover on a second click (toggle off)", async () => {
    const user = userEvent.setup();
    render(<Toggletip content={CONTENT} />);
    const btn = screen.getByRole("button", { name: "About" });
    await user.click(btn);
    await user.click(btn);
    expect(screen.getByRole("status", { hidden: true })).not.toBeVisible();
  });

  it("hides the popover when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<Toggletip content={CONTENT} />);
    await user.click(screen.getByRole("button", { name: "About" }));
    await user.keyboard("{Escape}");
    expect(screen.getByRole("status", { hidden: true })).not.toBeVisible();
  });

  it("hides the popover when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Toggletip content={CONTENT} />
        <button type="button">Outside</button>
      </div>,
    );
    await user.click(screen.getByRole("button", { name: "About" }));
    expect(screen.getByRole("status")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.getByRole("status", { hidden: true })).not.toBeVisible();
  });

  it("sets aria-expanded correctly", async () => {
    const user = userEvent.setup();
    render(<Toggletip content={CONTENT} />);
    const btn = screen.getByRole("button", { name: "About" });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    await user.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
  });

  it("has no accessibility violations when closed", async () => {
    const { container } = render(<Toggletip content={CONTENT} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no accessibility violations when open", async () => {
    const user = userEvent.setup();
    const { container } = render(<Toggletip content={CONTENT} />);
    await user.click(screen.getByRole("button", { name: "About" }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("uses a custom trigger label when provided", () => {
    render(<Toggletip content={CONTENT} label="Preference hints" />);
    expect(
      screen.getByRole("button", { name: "Preference hints" }),
    ).toBeInTheDocument();
  });

  it("accepts rich content, not just plain strings", async () => {
    const user = userEvent.setup();
    render(
      <Toggletip
        content={
          <ul>
            <li>Tried crouch-low</li>
          </ul>
        }
      />,
    );
    await user.click(screen.getByRole("button", { name: "About" }));
    expect(screen.getByText("Tried crouch-low")).toBeVisible();
  });

  it("shifts the popover back on screen when it would overflow the left edge", async () => {
    const user = userEvent.setup();
    render(<Toggletip content={CONTENT} />);
    const popover = screen.getByRole("status", { hidden: true });
    vi.spyOn(popover, "getBoundingClientRect").mockReturnValue({
      left: -40,
      right: 240,
      width: 280,
      height: 60,
      top: 0,
      bottom: 60,
      x: -40,
      y: 0,
      toJSON() {},
    });

    await user.click(screen.getByRole("button", { name: "About" }));

    expect(popover.style.transform).toBe("translateX(calc(-50% + 48px))");
  });

  it("shifts the popover back on screen when it would overflow the right edge", async () => {
    const user = userEvent.setup();
    render(<Toggletip content={CONTENT} />);
    const popover = screen.getByRole("status", { hidden: true });
    const innerWidth = window.innerWidth;
    vi.spyOn(popover, "getBoundingClientRect").mockReturnValue({
      left: innerWidth - 240,
      right: innerWidth + 40,
      width: 280,
      height: 60,
      top: 0,
      bottom: 60,
      x: innerWidth - 240,
      y: 0,
      toJSON() {},
    });

    await user.click(screen.getByRole("button", { name: "About" }));

    expect(popover.style.transform).toBe("translateX(calc(-50% + -48px))");
  });
});
