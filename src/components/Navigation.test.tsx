import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Navigation from "./Navigation";

// Mock Next.js components
vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string }) => (
    // biome-ignore lint/performance/noImgElement: This is a mock component for testing
    <img alt={alt} {...props} />
  ),
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

// Since Radix UI uses ResizeObserver which is not available in JSDOM,
// we might need to mock it or polyfill it if specific tests fail.
// But mostly basic interactions work without it for Dialog.
// However, Radix Dialog uses PointerCapture, which might need setup.
// Let's standardly mock ResizeObserver just in case.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// biome-ignore lint/complexity/noExcessiveLinesPerFunction: Test suite requires many cases
describe("Navigation", () => {
  it("renders the logo with correct alt text", () => {
    render(<Navigation />);
    const logo = screen.getByAltText("Annie Garvey Girl Coding");
    expect(logo).toBeInTheDocument();
  });

  it("renders desktop navigation links", () => {
    render(<Navigation />);
    // Desktop links are in a nav with aria-label="Main navigation"
    const desktopNav = screen.getByLabelText("Main navigation");
    expect(desktopNav).toBeInTheDocument();

    // Use within() to scope queries to desktop navigation
    const { within } = require("@testing-library/dom");
    expect(
      within(desktopNav).getByRole("link", { name: /^Home$/ }),
    ).toBeInTheDocument();
    expect(
      within(desktopNav).getByRole("link", { name: "Colour Palette" }),
    ).toBeInTheDocument();
  });

  it("renders hamburger button", () => {
    render(<Navigation />);
    const hamburgerButton = screen.getByRole("button", {
      name: "Toggle navigation menu",
    });
    expect(hamburgerButton).toBeInTheDocument();
  });

  it("opens mobile menu when hamburger button is clicked", async () => {
    const user = userEvent.setup();
    render(<Navigation />);

    const hamburgerButton = screen.getByRole("button", {
      name: "Toggle navigation menu",
    });

    // Determine initial state - dialog should not be present
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Click to open
    await user.click(hamburgerButton);

    // Dialog should be present (Radix renders it in a portal, usually document.body)
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
  });

  it("closes mobile menu when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<Navigation />);

    // Open first
    const hamburgerButton = screen.getByRole("button", {
      name: "Toggle navigation menu",
    });
    await user.click(hamburgerButton);

    // Find close button
    const closeButton = screen.getByRole("button", {
      name: "Close navigation menu",
    });
    await user.click(closeButton);

    // Verify dialog is gone
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes mobile menu when a navigation link is clicked", async () => {
    const user = userEvent.setup();
    render(<Navigation />);

    // Open first
    const hamburgerButton = screen.getByRole("button", {
      name: "Toggle navigation menu",
    });
    await user.click(hamburgerButton);

    // Find links in the dialog
    const dialog = await screen.findByRole("dialog");

    // Let's use `within`
    const { within } = require("@testing-library/dom");

    const mobileHomeLink = within(dialog).getByRole("link", { name: /^Home$/ });

    await user.click(mobileHomeLink);

    // Verify dialog is closed
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
