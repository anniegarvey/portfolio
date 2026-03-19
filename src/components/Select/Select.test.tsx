import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";

const TestComponent = () => {
  const [value, setValue] = useState("apple");
  return (
    <Select onValueChange={setValue} value={value}>
      <SelectTrigger aria-label="Fruit">
        <SelectValue placeholder="Select fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>More Fruits</SelectLabel>
          <SelectItem value="grape">Grape</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

import { SelectLabel, SelectSeparator } from "./Select";

describe("Select Component", () => {
  it("renders trigger with value", () => {
    render(<TestComponent />);
    expect(screen.getByText("Apple")).toBeDefined();
  });

  it("opens content and selects item", async () => {
    render(<TestComponent />);
    const trigger = screen.getByLabelText("Fruit");
    fireEvent.click(trigger);

    expect(screen.getByText("Banana")).toBeDefined();
    expect(screen.getByText("More Fruits")).toBeDefined();
    fireEvent.click(screen.getByText("Banana"));

    expect(screen.getByText("Banana")).toBeDefined();
  });
});
