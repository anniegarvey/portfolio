import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

const setupModal = (isOpen = true) => {
  const onClose = vi.fn();
  render(
    <Modal
      description="Test Modal Description"
      isOpen={isOpen}
      onClose={onClose}
    >
      <div>Child Content</div>
    </Modal>,
  );
  return { onClose };
};

describe("Modal", () => {
  it("renders children when open", () => {
    setupModal(true);
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("does not render children when closed", () => {
    setupModal(false);
    expect(screen.queryByText("Child Content")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const { onClose } = setupModal(true);
    const closeButton = screen.getByLabelText("Close modal");
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it("does not call onClose when overlay is clicked", () => {
    const { onClose } = setupModal(true);

    const content = screen.getByText("Child Content");
    const modalContent = content.parentElement;
    const modalWrapper = modalContent?.parentElement;
    const overlay = modalWrapper?.parentElement;

    if (overlay) {
      fireEvent.click(overlay);
      expect(onClose).not.toHaveBeenCalled();
    } else {
      throw new Error("Could not find overlay");
    }
  });

  it("calls onClose when Escape key is pressed", () => {
    const { onClose } = setupModal(true);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
