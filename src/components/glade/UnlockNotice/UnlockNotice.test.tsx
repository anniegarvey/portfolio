import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UnlockNotice } from "./UnlockNotice";

describe("UnlockNotice", () => {
  it("shows the unlock requirement for a gated skill", () => {
    render(<UnlockNotice skillId="petting-technique" />);
    expect(
      screen.getByText("Unlocks at Body Language tier 2"),
    ).toBeInTheDocument();
  });

  it("renders nothing for an always-unlocked skill", () => {
    const { container } = render(<UnlockNotice skillId="body-language" />);
    expect(container).toBeEmptyDOMElement();
  });
});
