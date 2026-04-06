import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectPage } from "./ProjectPage";

vi.mock("next/image", () => ({
  default: ({
    alt,
    fill: _fill,
    ...props
  }: {
    alt: string;
    fill?: boolean;
  }) => (
    // biome-ignore lint/performance/noImgElement: mock for testing
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

// FadeIn just renders its children — no IntersectionObserver needed in these tests
vi.mock("@/components/FadeIn", () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const defaultProps = {
  subtitle: "Personal Project",
  title: "Test Project",
  tagline: "A test tagline",
  description: <p>Project description</p>,
  highlights: ["First highlight", "Second highlight"],
  tags: ["React", "TypeScript"],
};

describe("ProjectPage", () => {
  it("renders the project title", () => {
    render(<ProjectPage {...defaultProps} />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Test Project" }),
    ).toBeInTheDocument();
  });

  it("renders the subtitle and tagline", () => {
    render(<ProjectPage {...defaultProps} />);
    expect(screen.getByText("Personal Project")).toBeInTheDocument();
    expect(screen.getByText("A test tagline")).toBeInTheDocument();
  });

  it("renders the description content", () => {
    render(<ProjectPage {...defaultProps} />);
    expect(screen.getByText("Project description")).toBeInTheDocument();
  });

  it("renders all highlights", () => {
    render(<ProjectPage {...defaultProps} />);
    expect(screen.getByText("First highlight")).toBeInTheDocument();
    expect(screen.getByText("Second highlight")).toBeInTheDocument();
  });

  it("renders all tags in the visual block", () => {
    render(<ProjectPage {...defaultProps} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("renders a back to portfolio link", () => {
    render(<ProjectPage {...defaultProps} />);
    expect(
      screen.getByRole("link", { name: /back to portfolio/i }),
    ).toHaveAttribute("href", "/");
  });

  it("renders a live link when liveUrl is provided", () => {
    render(
      <ProjectPage {...defaultProps} liveLabel="Open app" liveUrl="/my-app" />,
    );
    expect(screen.getByRole("link", { name: "Open app" })).toHaveAttribute(
      "href",
      "/my-app",
    );
  });

  it("uses default live label when liveLabel is not provided", () => {
    render(<ProjectPage {...defaultProps} liveUrl="/my-app" />);
    expect(
      screen.getByRole("link", { name: "Try it out" }),
    ).toBeInTheDocument();
  });

  it("does not render a live link when liveUrl is omitted", () => {
    render(<ProjectPage {...defaultProps} />);
    expect(
      screen.queryByRole("link", { name: "Try it out" }),
    ).not.toBeInTheDocument();
  });

  it("renders an external live link with target and rel", () => {
    render(
      <ProjectPage
        {...defaultProps}
        liveLabel="Visit site"
        liveUrl="https://example.com"
      />,
    );
    const link = screen.getByRole("link", { name: "Visit site" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders an internal live link without target or rel", () => {
    render(
      <ProjectPage
        {...defaultProps}
        liveLabel="Open app"
        liveUrl="/internal"
      />,
    );
    const link = screen.getByRole("link", { name: "Open app" });
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });

  it("renders a screenshot image when imageSrc is provided", () => {
    render(
      <ProjectPage
        {...defaultProps}
        imageAlt="Test screenshot"
        imageSrc="/projects/test.png"
      />,
    );
    expect(screen.getByAltText("Test screenshot")).toBeInTheDocument();
  });

  it("uses title as image alt when imageAlt is not provided", () => {
    render(<ProjectPage {...defaultProps} imageSrc="/projects/test.png" />);
    expect(screen.getByAltText("Test Project")).toBeInTheDocument();
  });

  it("does not render an img when imageSrc is omitted", () => {
    render(<ProjectPage {...defaultProps} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders visualElement instead of image or gradient placeholder", () => {
    render(
      <ProjectPage
        {...defaultProps}
        visualElement={<div data-testid="custom-visual">Live content</div>}
      />,
    );
    expect(screen.getByTestId("custom-visual")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("visualElement takes precedence over imageSrc", () => {
    render(
      <ProjectPage
        {...defaultProps}
        imageAlt="Should not appear"
        imageSrc="/projects/test.png"
        visualElement={<div data-testid="custom-visual">Live content</div>}
      />,
    );
    expect(screen.getByTestId("custom-visual")).toBeInTheDocument();
    expect(screen.queryByAltText("Should not appear")).not.toBeInTheDocument();
  });
});
