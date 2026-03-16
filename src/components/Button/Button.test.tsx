import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
    // Loader icon is present (lucide renders an svg)
    expect(button.querySelector("svg")).toBeInTheDocument();
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
    render(<Button fullWidth>Label</Button>);
    // The styled button receives the $fullWidth prop — just assert it renders without error
    expect(screen.getByRole("button")).toBeInTheDocument();
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
    ] as const)("renders variant=%s without error", (variant) => {
      render(<Button variant={variant}>Label</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("intent", () => {
    it.each([
      "primary",
      "secondary",
      "danger",
    ] as const)("renders intent=%s without error", (intent) => {
      render(<Button intent={intent}>Label</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("size", () => {
    it.each([
      "sm",
      "md",
      "icon",
    ] as const)("renders size=%s without error", (size) => {
      render(<Button size={size}>Label</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
