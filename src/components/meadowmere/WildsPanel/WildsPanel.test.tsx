import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FORAGES_PER_DAY } from "@/lib/meadowmere/catalog";
import {
  type MeadowmereContextType,
  useMeadowmere,
} from "@/lib/meadowmere/context";
import {
  makeMeadowmereContext,
  makeMeadowmereState,
} from "@/lib/meadowmere/testFixtures";
import { WildsPanel } from "./WildsPanel";

vi.mock("@/lib/meadowmere/context");

const forage = vi.fn();

function mock(overrides: Partial<MeadowmereContextType> = {}) {
  vi.mocked(useMeadowmere).mockReturnValue(
    makeMeadowmereContext({ forage, ...overrides }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("forage trips", () => {
  it("counts the trips left", () => {
    mock({ state: makeMeadowmereState({ foragesToday: 1 }) });
    render(<WildsPanel />);

    expect(screen.getByText("2 forage trips left today.")).toBeInTheDocument();
  });

  it("uses the singular for the last trip", () => {
    mock({ state: makeMeadowmereState({ foragesToday: FORAGES_PER_DAY - 1 }) });
    render(<WildsPanel />);

    expect(screen.getByText("1 forage trip left today.")).toBeInTheDocument();
  });

  it("says when the day's trips are spent", () => {
    mock({ state: makeMeadowmereState({ foragesToday: FORAGES_PER_DAY }) });
    render(<WildsPanel />);

    expect(
      screen.getByText("You're out of forage trips — more tomorrow."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Forage" })).toBeDisabled();
  });
});

describe("sites", () => {
  it("only offers foraging at unlocked sites", async () => {
    mock();
    render(<WildsPanel />);

    expect(screen.getByText("The Hedgerow")).toBeInTheDocument();
    expect(screen.getByText("Stonewood")).toBeInTheDocument();
    // Only the hedgerow is unlocked on a fresh farm.
    expect(screen.getAllByRole("button", { name: "Forage" })).toHaveLength(1);
    expect(
      screen.getAllByText("Locked — a neighbour will show you the way."),
    ).toHaveLength(2);

    await userEvent.click(screen.getByRole("button", { name: "Forage" }));
    expect(forage).toHaveBeenCalledWith("hedgerow");
  });

  it("lists what each unlocked site turns up", () => {
    mock();
    render(<WildsPanel />);

    expect(
      screen.getByText("Acorn, Bramble Berry, Feather"),
    ).toBeInTheDocument();
  });

  it("announces the result of a forage trip", () => {
    mock({
      notice: {
        kind: "forage",
        siteId: "hedgerow",
        itemId: "acorn",
        amount: 2,
      },
    });
    render(<WildsPanel />);

    expect(
      screen.getByText("Foraged 2 × Acorn at The Hedgerow."),
    ).toBeInTheDocument();
  });

  it("shows no forage result for an unrelated notice", () => {
    mock({ notice: { kind: "harvest", cropId: "parsnip", amount: 1 } });
    render(<WildsPanel />);

    expect(screen.queryByText(/Foraged/)).not.toBeInTheDocument();
  });
});

describe("larder", () => {
  it("prompts when empty", () => {
    mock();
    render(<WildsPanel />);

    expect(
      screen.getByText(
        "Nothing in the larder yet — harvest or forage something.",
      ),
    ).toBeInTheDocument();
  });

  it("lists what is in stock, skipping emptied stacks", () => {
    mock({
      state: makeMeadowmereState({
        inventory: { acorn: 3, feather: 0, "parsnip-root": 1 },
      }),
    });
    render(<WildsPanel />);

    expect(screen.getByText(/Acorn ×3/)).toBeInTheDocument();
    expect(screen.getByText(/Parsnip ×1/)).toBeInTheDocument();
    // Feather is still named in the hedgerow's material list, so match the
    // larder's "×count" form specifically.
    expect(screen.queryByText(/Feather ×/)).not.toBeInTheDocument();
  });
});
