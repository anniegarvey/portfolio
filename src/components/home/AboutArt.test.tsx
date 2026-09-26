import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AboutArt } from "./AboutArt";

describe("AboutArt", () => {
  it("renders as a labelled image", () => {
    render(<AboutArt />);
    expect(
      screen.getByRole("img", { name: /celtic triple spiral/i }),
    ).toBeInTheDocument();
  });

  it("draws every strand and star with theme-aware colours", () => {
    const { container } = render(<AboutArt />);
    const strands = container.querySelectorAll("path");
    expect(strands).toHaveLength(33);
    expect(container.querySelectorAll("circle")).toHaveLength(40);
    expect(strands[0].style.stroke).toMatch(/^light-dark\(/);
  });
});
