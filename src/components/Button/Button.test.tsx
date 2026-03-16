import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("defaults to type=button", () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("accepts type=submit override", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("fires onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Click me
      </Button>,
    );
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is disabled and shows spinner when loading", () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    // Children are visually hidden but remain in the DOM for screen readers
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(button.querySelector("svg")).toBeInTheDocument();
    expect(button).toMatchSnapshot();
  });

  it("does not fire onClick when loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders leftIcon alongside children", () => {
    render(<Button leftIcon={<span data-testid="icon" />}>Label</Button>);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("Label")).toBeInTheDocument();
  });

  it("does not render leftIcon when loading", () => {
    render(
      <Button leftIcon={<span data-testid="icon" />} loading>
        Label
      </Button>,
    );
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
  });

  it("applies fullWidth", () => {
    const { container } = render(<Button fullWidth>Label</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("passes through aria-label", () => {
    render(<Button aria-label="Close dialog">X</Button>);
    expect(
      screen.getByRole("button", { name: "Close dialog" }),
    ).toBeInTheDocument();
  });

  it("forwards ref to the button element", () => {
    let ref: HTMLButtonElement | null = null;
    render(
      <Button
        ref={(el) => {
          ref = el;
        }}
      >
        Ref
      </Button>,
    );
    expect(ref).toBeInstanceOf(HTMLButtonElement);
  });

  describe("variant", () => {
    it.each([
      "solid",
      "outline",
      "ghost",
      "dashed",
      "link",
    ] as const)("renders variant=%s", (variant) => {
      const { container } = render(<Button variant={variant}>Label</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("intent", () => {
    it.each([
      "primary",
      "secondary",
      "danger",
    ] as const)("renders intent=%s", (intent) => {
      const { container } = render(<Button intent={intent}>Label</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("size", () => {
    it.each(["sm", "md", "icon"] as const)("renders size=%s", (size) => {
      const { container } = render(<Button size={size}>Label</Button>);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe("accessibility", () => {
    it.each([
      "solid",
      "outline",
      "ghost",
      "dashed",
      "link",
    ] as const)("variant=%s has no violations", async (variant) => {
      const { container } = render(<Button variant={variant}>Label</Button>);
      expect(await axe(container)).toHaveNoViolations();
    });

    it.each([
      "primary",
      "secondary",
      "danger",
    ] as const)("intent=%s has no violations", async (intent) => {
      const { container } = render(<Button intent={intent}>Label</Button>);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("disabled state has no violations", async () => {
      const { container } = render(<Button disabled>Label</Button>);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("loading state has no violations", async () => {
      const { container } = render(<Button loading>Label</Button>);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("icon button with aria-label has no violations", async () => {
      const { container } = render(
        <Button aria-label="Close" size="icon" variant="ghost">
          X
        </Button>,
      );
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
