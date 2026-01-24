import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SortableItem } from "./SortableItem";

// Mock dnd-kit hook
const mockUseSortable = vi.fn();
vi.mock("@dnd-kit/sortable", () => ({
  // biome-ignore lint/suspicious/noExplicitAny: Mocking complex hook props
  useSortable: (props: any) => mockUseSortable(props),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: vi.fn((transform) =>
        transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      ),
    },
  },
}));

describe("SortableItem", () => {
  it("renders children correctly", () => {
    mockUseSortable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      setActivatorNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    });

    render(
      // biome-ignore lint/correctness/useUniqueElementIds: Static IDs in tests
      <SortableItem id="test-id">{() => <div>Test Content</div>}</SortableItem>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies dragging styles when isDragging is true", () => {
    mockUseSortable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      setActivatorNodeRef: vi.fn(),
      transform: { x: 10, y: 20, scaleX: 1, scaleY: 1 },
      transition: "transform 0.2s ease",
      isDragging: true,
    });

    const { container } = render(
      // biome-ignore lint/correctness/useUniqueElementIds: Static IDs in tests
      <SortableItem id="test-id">{() => <div>Test Content</div>}</SortableItem>,
    );

    const item = container.firstChild as HTMLElement;
    expect(item).toHaveStyle({
      opacity: "0.5",
      zIndex: "1000",
      transform: "translate3d(10px, 20px, 0)",
    });
  });

  it("applies normal styles when isDragging is false", () => {
    mockUseSortable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      setActivatorNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    });

    const { container } = render(
      // biome-ignore lint/correctness/useUniqueElementIds: Static IDs in tests
      <SortableItem id="test-id">{() => <div>Test Content</div>}</SortableItem>,
    );

    const item = container.firstChild as HTMLElement;
    expect(item).toHaveStyle({
      opacity: "1",
      zIndex: "auto",
    });
  });

  it("passes disabled prop to useSortable", () => {
    mockUseSortable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      setActivatorNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    });

    render(
      // biome-ignore lint/correctness/useUniqueElementIds: Static IDs in tests
      <SortableItem disabled={true} id="test-id">
        {() => <div>Test Content</div>}
      </SortableItem>,
    );

    expect(mockUseSortable).toHaveBeenCalledWith({
      id: "test-id",
      disabled: true,
    });
  });
});
