import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContentWithDragHandle } from ".";

describe("ContentWithDragHandle", () => {
  it("renders children and applies listeners, attributes, and aria-label to the handle", () => {
    const onPointerDown = vi.fn();

    render(
      <ContentWithDragHandle
        ariaLabel="Reorder zone"
        attributes={{
          role: "button",
          tabIndex: 0,
          "aria-disabled": false,
          "aria-pressed": undefined,
          "aria-roledescription": "sortable",
          "aria-describedby": "instructions",
        }}
        listeners={{ onPointerDown }}
      >
        <div>Item content</div>
      </ContentWithDragHandle>,
    );

    expect(screen.getByText("Item content")).toBeInTheDocument();

    const handle = screen.getByLabelText("Reorder zone");
    expect(handle).toBeInTheDocument();
    expect(handle).toHaveAttribute("role", "button");
  });
});
