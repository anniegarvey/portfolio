import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMeadowmere } from "@/lib/meadowmere/context";
import { makeMeadowmereContext } from "@/lib/meadowmere/testFixtures";
import { NeighboursPanel } from "./NeighboursPanel";

vi.mock("@/lib/meadowmere/context");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useMeadowmere).mockReturnValue(makeMeadowmereContext());
});

describe("NeighboursPanel", () => {
  it("renders a card for every neighbour", () => {
    render(<NeighboursPanel />);

    expect(screen.getByText("Nessa")).toBeInTheDocument();
    expect(screen.getByText("Bram")).toBeInTheDocument();
    expect(screen.getByText("Marigold")).toBeInTheDocument();
  });
});
