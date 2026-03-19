import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PointsProvider } from "@/lib/points/context";
import { Navigation } from "./Navigation";

function renderWithTheme() {
  return render(
    <PointsProvider>
      <ThemeProvider>
        <Navigation />
      </ThemeProvider>
    </PointsProvider>,
  );
}

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

describe("Navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("renders the logo with correct alt text", () => {
    renderWithTheme();
    const logo = screen.getByAltText("Annie Garvey Girl Coding");
    expect(logo).toBeInTheDocument();
  });

  it("renders desktop navigation links", () => {
    renderWithTheme();
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
    renderWithTheme();
    const hamburgerButton = screen.getByRole("button", {
      name: "Toggle navigation menu",
    });
    expect(hamburgerButton).toBeInTheDocument();
  });

  it("opens mobile menu when hamburger button is clicked", async () => {
    const user = userEvent.setup();
    renderWithTheme();

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
    renderWithTheme();

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
    renderWithTheme();

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

  it("renders theme toggle button defaulting to system mode", () => {
    renderWithTheme();
    expect(
      screen.getAllByRole("button", { name: /Theme: System/i })[0],
    ).toBeInTheDocument();
  });

  it("cycles theme from system to light on first click", async () => {
    const user = userEvent.setup();
    renderWithTheme();

    const toggles = screen.getAllByRole("button", { name: /Theme: System/i });
    await user.click(toggles[0]);

    expect(
      screen.getAllByRole("button", { name: /Theme: Light/i })[0],
    ).toBeInTheDocument();
  });

  it("cycles theme from light to dark", async () => {
    const user = userEvent.setup();
    renderWithTheme();

    const systemToggle = screen.getAllByRole("button", {
      name: /Theme: System/i,
    })[0];
    await user.click(systemToggle);

    const lightToggle = screen.getAllByRole("button", {
      name: /Theme: Light/i,
    })[0];
    await user.click(lightToggle);

    expect(
      screen.getAllByRole("button", { name: /Theme: Dark/i })[0],
    ).toBeInTheDocument();
  });

  it("cycles theme back to system from dark", async () => {
    const user = userEvent.setup();
    renderWithTheme();

    // system → light → dark → system
    for (let i = 0; i < 3; i++) {
      const button = screen.getAllByRole("button", { name: /Theme:/i })[0];
      await user.click(button);
    }

    expect(
      screen.getAllByRole("button", { name: /Theme: System/i })[0],
    ).toBeInTheDocument();
  });
});
