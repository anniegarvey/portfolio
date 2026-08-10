import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SuggestionForm } from "./SuggestionForm";

describe("SuggestionForm", () => {
  beforeEach(() => {
    vi.spyOn(window, "open").mockImplementation(() => ({}) as Window);
  });

  it("disables submit until both fields have content", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm />);

    const submit = screen.getByRole("button", { name: /continue to github/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/title/i), "Add dark mode");
    expect(submit).toBeDisabled();

    await user.type(
      screen.getByLabelText(/description/i),
      "It would be great to have a dark theme.",
    );
    expect(submit).toBeEnabled();
  });

  it("opens a pre-filled GitHub issue URL in a new tab on submit", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm />);

    await user.type(screen.getByLabelText(/title/i), "Add dark mode");
    await user.type(
      screen.getByLabelText(/description/i),
      "It would be great to have a dark theme.",
    );
    await user.click(
      screen.getByRole("button", { name: /continue to github/i }),
    );

    expect(window.open).toHaveBeenCalledTimes(1);
    const [url, target, features] = vi.mocked(window.open).mock.calls[0];
    expect(url).toContain(
      "https://github.com/anniegarvey/portfolio/issues/new?",
    );
    expect(url).toContain("title=Add+dark+mode");
    expect(url).toContain("labels=enhancement");
    expect(target).toBe("_blank");
    expect(features).toBe("noopener,noreferrer");
  });

  it("shows a fallback link if the popup is blocked", async () => {
    vi.mocked(window.open).mockReturnValue(null);
    const user = userEvent.setup();
    render(<SuggestionForm />);

    await user.type(screen.getByLabelText(/title/i), "Add dark mode");
    await user.type(
      screen.getByLabelText(/description/i),
      "It would be great to have a dark theme.",
    );
    await user.click(
      screen.getByRole("button", { name: /continue to github/i }),
    );

    const fallback = screen.getByRole("link", {
      name: /open the github issue manually/i,
    });
    expect(fallback).toHaveAttribute(
      "href",
      expect.stringContaining(
        "https://github.com/anniegarvey/portfolio/issues/new?",
      ),
    );
  });
});
