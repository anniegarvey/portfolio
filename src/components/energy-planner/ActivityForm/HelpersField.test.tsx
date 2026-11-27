import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HelpersField } from "./HelpersField";

const FIELD_ID = "helpers";
const OPTIONS = ["Soothing music", "Audiobook", "Coffee"];

function renderField(value: string[] = []) {
  const onChange = vi.fn();
  render(
    <HelpersField
      id={FIELD_ID}
      onChange={onChange}
      options={OPTIONS}
      value={value}
    />,
  );
  return onChange;
}

const trigger = () =>
  screen.getByRole("button", { name: /What would help you start\?/ });

describe("HelpersField", () => {
  it("prompts to chain activities that share a helper", () => {
    renderField();
    expect(trigger()).toHaveAccessibleDescription(
      /Plan activities that share a helper back to back/,
    );
    expect(trigger()).toHaveTextContent("Choose helpers…");
  });

  it("lists the chosen helpers on the dropdown button", () => {
    renderField(["Audiobook", "Coffee"]);
    expect(trigger()).toHaveTextContent("Audiobook, Coffee");
  });

  it("offers every option, with the chosen ones checked", async () => {
    const user = userEvent.setup();
    renderField(["Coffee"]);
    await user.click(trigger());

    const items = screen.getAllByRole("menuitemcheckbox");
    expect(items.map((item) => item.textContent)).toEqual(OPTIONS);
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Coffee" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Audiobook" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("adds a helper when it is checked, keeping the menu open", async () => {
    const user = userEvent.setup();
    const onChange = renderField(["Coffee"]);
    await user.click(trigger());
    await user.click(
      screen.getByRole("menuitemcheckbox", { name: "Audiobook" }),
    );

    expect(onChange).toHaveBeenCalledWith(["Coffee", "Audiobook"]);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("removes a helper when it is unchecked", async () => {
    const user = userEvent.setup();
    const onChange = renderField(["Coffee", "Audiobook"]);
    await user.click(trigger());
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Coffee" }));

    expect(onChange).toHaveBeenCalledWith(["Audiobook"]);
  });

  it("adds a new helper of your own with the Add button", async () => {
    const user = userEvent.setup();
    const onChange = renderField(["Coffee"]);
    await user.type(screen.getByLabelText("Add your own helper"), " Podcast ");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(onChange).toHaveBeenCalledWith(["Coffee", "Podcast"]);
    expect(screen.getByLabelText("Add your own helper")).toHaveValue("");
  });

  it("adds a new helper with Enter, without submitting the form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const onChange = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <HelpersField
          id={FIELD_ID}
          onChange={onChange}
          options={OPTIONS}
          value={[]}
        />
      </form>,
    );
    await user.type(
      screen.getByLabelText("Add your own helper"),
      "Podcast{Enter}",
    );

    expect(onChange).toHaveBeenCalledWith(["Podcast"]);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("reuses an existing option's spelling instead of making a duplicate", async () => {
    const user = userEvent.setup();
    const onChange = renderField();
    await user.type(
      screen.getByLabelText("Add your own helper"),
      "coffee{Enter}",
    );

    expect(onChange).toHaveBeenCalledWith(["Coffee"]);
  });

  it("ignores a helper that is already chosen or blank", async () => {
    const user = userEvent.setup();
    const onChange = renderField(["Coffee"]);
    const input = screen.getByLabelText("Add your own helper");
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();

    await user.type(input, "   {Enter}");
    await user.type(input, "Coffee{Enter}");

    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("");
  });
});
