import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GladeContextType } from "@/lib/glade/context";
import { useGlade } from "@/lib/glade/context";
import type { WildVisitor } from "@/lib/glade/schema";
import {
  makeGladeContext,
  makeGladeState,
  makeSkill,
  makeVisitor,
} from "@/lib/glade/testFixtures";
import { VisitorCard } from "./VisitorCard";

vi.mock("@/lib/glade/context");
vi.mock("@/components/glade/CreatureSVG", () => ({
  CreatureSVG: () => null,
}));

const rabbit: WildVisitor = makeVisitor({ speciesId: "rabbit" });

function mockGlade(overrides: Partial<GladeContextType> = {}) {
  vi.mocked(useGlade).mockReturnValue(
    makeGladeContext({
      state: makeGladeState({ visitors: [rabbit] }),
      ...overrides,
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGlade();
});

describe("VisitorCard preference hints", () => {
  it("shows no vague hints while every mapped skill is below tier 2", () => {
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill(),
          "body-language": makeSkill(),
          "petting-technique": makeSkill(),
        },
      }),
    });
    render(<VisitorCard visitor={rabbit} />);

    expect(
      screen.queryByText("Gets nervous when you tower over it."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Noses hopefully toward anything warm and grainy."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Leans its head sideways toward a hand near its ears.",
      ),
    ).not.toBeInTheDocument();
  });

  it("shows a type's vague hint once its own mapped skill reaches tier 2", () => {
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill(),
          "body-language": makeSkill({ tier: 2 }),
          "petting-technique": makeSkill(),
        },
      }),
    });
    render(<VisitorCard visitor={rabbit} />);

    expect(
      screen.getByText("Gets nervous when you tower over it."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Noses hopefully toward anything warm and grainy."),
    ).not.toBeInTheDocument();
  });

  it("does not show the toggletip while every skill is below tier 3", () => {
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill(),
          "body-language": makeSkill({ tier: 2 }),
          "petting-technique": makeSkill({ tier: 2 }),
        },
      }),
    });
    render(<VisitorCard visitor={rabbit} />);

    expect(
      screen.queryByRole("button", { name: "Preference details" }),
    ).not.toBeInTheDocument();
  });

  it("shows the toggletip once any one skill reaches tier 3, with a section only for currently-visible hint types", async () => {
    const user = userEvent.setup();
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill(),
          "body-language": makeSkill({ tier: 3 }),
          "petting-technique": makeSkill(),
        },
      }),
    });
    render(<VisitorCard visitor={rabbit} />);

    const trigger = screen.getByRole("button", { name: "Preference details" });
    await user.click(trigger);

    expect(screen.getByText("Preferred posture")).toBeVisible();
    expect(screen.queryByText("Preferred pet spot")).not.toBeInTheDocument();
    expect(screen.queryByText("Favourite treat")).not.toBeInTheDocument();
  });

  it("shows 'Keep training to learn more.' for a type below its own tier 3, even while the toggletip is open", async () => {
    const user = userEvent.setup();
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill(),
          "body-language": makeSkill({ tier: 2 }), // vague hint shown, but not yet confirmable
          "petting-technique": makeSkill({ tier: 3 }), // triggers the toggletip
        },
      }),
    });
    render(<VisitorCard visitor={rabbit} />);

    await user.click(
      screen.getByRole("button", { name: "Preference details" }),
    );

    expect(screen.getByText("Keep training to learn more.")).toBeVisible();
  });

  it("shows 'Not yet confirmed.' once a type reaches tier 3 but its preference isn't discovered", async () => {
    const user = userEvent.setup();
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill(),
          "body-language": makeSkill({ tier: 3 }),
          "petting-technique": makeSkill(),
        },
      }),
    });
    render(<VisitorCard visitor={rabbit} />);

    await user.click(
      screen.getByRole("button", { name: "Preference details" }),
    );

    expect(screen.getByText("Not yet confirmed.")).toBeVisible();
  });

  it("reveals the clear hint once a type reaches tier 3 and its preference is discovered", async () => {
    const user = userEvent.setup();
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill(),
          "body-language": makeSkill({ tier: 3 }),
          "petting-technique": makeSkill(),
        },
        discoveredPreferences: { rabbit: { posture: true } },
      }),
    });
    render(<VisitorCard visitor={rabbit} />);

    await user.click(
      screen.getByRole("button", { name: "Preference details" }),
    );

    expect(screen.getByText("Crouch low.")).toBeVisible();
  });

  it("shows a tried/untried log of every posture once a type reaches tier 4", async () => {
    const user = userEvent.setup();
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill(),
          "body-language": makeSkill({ tier: 4 }),
          "petting-technique": makeSkill(),
        },
        triedPreferences: { rabbit: { posture: ["slow-blink"] } },
      }),
    });
    render(<VisitorCard visitor={rabbit} />);

    await user.click(
      screen.getByRole("button", { name: "Preference details" }),
    );
    const details = within(screen.getByRole("status"));

    expect(details.getByText("Slow blink — tried")).toBeVisible();
    expect(details.getByText("Sit still — not yet tried")).toBeVisible();
    expect(details.getByText("Crouch low — not yet tried")).toBeVisible();
  });

  it("lists every treat recipe (not just cooked ones) in the tier-4 tried log", async () => {
    const user = userEvent.setup();
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill({ tier: 4 }),
          "body-language": makeSkill(),
          "petting-technique": makeSkill(),
        },
        pantry: { ingredients: {}, treats: {} }, // nothing cooked
        triedPreferences: { rabbit: { treat: ["berry-bites"] } },
      }),
    });
    render(<VisitorCard visitor={rabbit} />);

    await user.click(
      screen.getByRole("button", { name: "Preference details" }),
    );

    expect(screen.getByText("Berry Bites — tried")).toBeVisible();
    expect(screen.getByText("Cream Puffs — not yet tried")).toBeVisible();
  });

  it("reveals the pet-spot and treat clear hints independently of posture", async () => {
    const user = userEvent.setup();
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill({ tier: 3 }),
          "body-language": makeSkill(),
          "petting-technique": makeSkill({ tier: 3 }),
        },
        discoveredPreferences: { rabbit: { petSpot: true, treat: true } },
      }),
    });
    render(<VisitorCard visitor={rabbit} />);

    await user.click(
      screen.getByRole("button", { name: "Preference details" }),
    );

    expect(screen.getByText("Scratch behind the ears.")).toBeVisible();
    expect(screen.getByText("Loves oat cakes.")).toBeVisible();
  });

  it("marks every option untried when a type reaches tier 4 with no recorded attempts", async () => {
    const user = userEvent.setup();
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill(),
          "body-language": makeSkill({ tier: 4 }),
          "petting-technique": makeSkill(),
        },
      }),
    });
    render(<VisitorCard visitor={rabbit} />);

    await user.click(
      screen.getByRole("button", { name: "Preference details" }),
    );
    const details = within(screen.getByRole("status"));

    expect(details.getByText("Crouch low — not yet tried")).toBeVisible();
    expect(details.getByText("Sit still — not yet tried")).toBeVisible();
    expect(details.getByText("Slow blink — not yet tried")).toBeVisible();
    expect(details.queryByText(/ — tried$/)).not.toBeInTheDocument();
  });
});

describe("VisitorCard feedback and actions", () => {
  it("shows encouraging feedback for a matched action on this visitor", () => {
    mockGlade({
      state: makeGladeState({ visitors: [rabbit] }),
      lastAction: {
        state: makeGladeState({ visitors: [rabbit] }),
        visitorId: rabbit.id,
        trustGained: 9,
        matched: true,
        tamed: false,
      },
    });
    render(<VisitorCard visitor={rabbit} />);

    expect(screen.getByText("+9 trust — just right!")).toBeInTheDocument();
  });

  it("shows plain feedback for a mismatched action, and none for a different visitor", () => {
    mockGlade({
      state: makeGladeState({ visitors: [rabbit] }),
      lastAction: {
        state: makeGladeState({ visitors: [rabbit] }),
        visitorId: "some-other-visitor",
        trustGained: 3,
        matched: false,
        tamed: false,
      },
    });
    render(<VisitorCard visitor={rabbit} />);

    expect(screen.queryByText(/trust/)).not.toBeInTheDocument();
  });

  it("clicking a posture calls approachVisitor with the visitor and posture", async () => {
    const user = userEvent.setup();
    const approachVisitor = vi.fn();
    mockGlade({
      state: makeGladeState({ visitors: [rabbit] }),
      approachVisitor,
    });
    render(<VisitorCard visitor={rabbit} />);

    await user.click(screen.getByRole("button", { name: "Crouch low" }));

    expect(approachVisitor).toHaveBeenCalledWith(
      rabbit.id,
      "crouch-low",
      expect.anything(),
    );
  });

  it("shows 'Approached today' once the approach action is used up", () => {
    mockGlade({
      state: makeGladeState({
        visitors: [
          makeVisitor({
            speciesId: "rabbit",
            actionsToday: { treat: false, approach: true, pet: false },
          }),
        ],
      }),
    });
    render(
      <VisitorCard
        visitor={makeVisitor({
          speciesId: "rabbit",
          actionsToday: { treat: false, approach: true, pet: false },
        })}
      />,
    );

    expect(screen.getByText("Approached today")).toBeInTheDocument();
  });

  it("treat action: shows the unlock notice while treat-cooking is locked", () => {
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill(),
          "body-language": makeSkill(),
          "petting-technique": makeSkill(), // tier 1 locks treat-cooking
        },
      }),
    });
    render(<VisitorCard visitor={rabbit} />);

    expect(
      screen.getByText("Unlocks at Petting Technique tier 2"),
    ).toBeInTheDocument();
  });

  it("treat action: shows 'No treats cooked yet' when unlocked with an empty pantry", () => {
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill(),
          "body-language": makeSkill(),
          "petting-technique": makeSkill({ tier: 2 }),
        },
        pantry: { ingredients: {}, treats: {} },
      }),
    });
    render(<VisitorCard visitor={rabbit} />);

    expect(screen.getByText("No treats cooked yet")).toBeInTheDocument();
  });

  it("treat action: shows 'Fed for today' once the treat action is used up", () => {
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill(),
          "body-language": makeSkill(),
          "petting-technique": makeSkill({ tier: 2 }),
        },
        pantry: { ingredients: {}, treats: { "berry-bites": 1 } },
      }),
    });
    render(
      <VisitorCard
        visitor={makeVisitor({
          speciesId: "rabbit",
          actionsToday: { treat: true, approach: false, pet: false },
        })}
      />,
    );

    expect(screen.getByText("Fed for today")).toBeInTheDocument();
  });

  it("clicking a cooked treat calls offerTreat with the visitor and treat id", async () => {
    const user = userEvent.setup();
    const offerTreat = vi.fn();
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill(),
          "body-language": makeSkill(),
          "petting-technique": makeSkill({ tier: 2 }),
        },
        pantry: { ingredients: {}, treats: { "berry-bites": 2 } },
      }),
      offerTreat,
    });
    render(<VisitorCard visitor={rabbit} />);

    await user.click(screen.getByRole("button", { name: "Berry Bites ×2" }));

    expect(offerTreat).toHaveBeenCalledWith(
      rabbit.id,
      "berry-bites",
      expect.anything(),
    );
  });

  it("pet action: shows the unlock notice while petting-technique is locked", () => {
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill(),
          "body-language": makeSkill(), // tier 1 locks petting-technique
          "petting-technique": makeSkill(),
        },
      }),
    });
    render(<VisitorCard visitor={rabbit} />);

    expect(
      screen.getByText("Unlocks at Body Language tier 2"),
    ).toBeInTheDocument();
  });

  it("shows 'Petted today' once the pet action is used up", () => {
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill(),
          "body-language": makeSkill({ tier: 2 }),
          "petting-technique": makeSkill(),
        },
      }),
    });
    render(
      <VisitorCard
        visitor={makeVisitor({
          speciesId: "rabbit",
          actionsToday: { treat: false, approach: false, pet: true },
        })}
      />,
    );

    expect(screen.getByText("Petted today")).toBeInTheDocument();
  });

  it("clicking a pet spot calls petVisitor with the visitor and spot", async () => {
    const user = userEvent.setup();
    const petVisitor = vi.fn();
    mockGlade({
      state: makeGladeState({
        visitors: [rabbit],
        skills: {
          "treat-cooking": makeSkill(),
          "body-language": makeSkill({ tier: 2 }),
          "petting-technique": makeSkill(),
        },
      }),
      petVisitor,
    });
    render(<VisitorCard visitor={rabbit} />);

    await user.click(screen.getByRole("button", { name: "Behind the ears" }));

    expect(petVisitor).toHaveBeenCalledWith(
      rabbit.id,
      "behind-ears",
      expect.anything(),
    );
  });
});
