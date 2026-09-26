import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ResetProgress } from "./ResetProgress";

function renderReset() {
  const onReset = vi.fn();
  render(
    <ResetProgress
      description="Everything goes."
      label="Reset game"
      onReset={onReset}
      title="Reset the game?"
    />,
  );
  return { onReset, user: userEvent.setup() };
}

describe("ResetProgress", () => {
  it("shows only the trigger until it is pressed", () => {
    renderReset();
    expect(
      screen.getByRole("button", { name: "Reset game" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(/Everything goes/)).not.toBeInTheDocument();
  });

  it("asks for confirmation and explains what is lost", async () => {
    const { onReset, user } = renderReset();
    await user.click(screen.getByRole("button", { name: "Reset game" }));

    const dialog = screen.getByRole("dialog", { name: "Reset the game?" });
    expect(dialog).toHaveTextContent("Everything goes. This can't be undone.");
    expect(onReset).not.toHaveBeenCalled();
  });

  it("resets only once confirmed, then closes", async () => {
    const { onReset, user } = renderReset();
    await user.click(screen.getByRole("button", { name: "Reset game" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Reset game",
      }),
    );

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does nothing when cancelled", async () => {
    const { onReset, user } = renderReset();
    await user.click(screen.getByRole("button", { name: "Reset game" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onReset).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
