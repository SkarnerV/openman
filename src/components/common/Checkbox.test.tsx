import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders unchecked by default", () => {
    render(<Checkbox checked={false} onChange={mockOnChange} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-checked", "false");
    expect(checkbox).not.toHaveClass("bg-accent-orange");
  });

  it("renders checked when checked is true", () => {
    render(<Checkbox checked={true} onChange={mockOnChange} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("aria-checked", "true");
    expect(checkbox).toHaveClass("bg-accent-orange");
  });

  it("calls onChange when clicked", async () => {
    const user = userEvent.setup();
    render(<Checkbox checked={false} onChange={mockOnChange} />);

    await user.click(screen.getByRole("checkbox"));

    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it("calls onChange with false when unchecking", async () => {
    const user = userEvent.setup();
    render(<Checkbox checked={true} onChange={mockOnChange} />);

    await user.click(screen.getByRole("checkbox"));

    expect(mockOnChange).toHaveBeenCalledWith(false);
  });

  it("renders label when provided", () => {
    render(
      <Checkbox checked={false} onChange={mockOnChange} label="Enable feature" />
    );

    expect(screen.getByText("Enable feature")).toBeInTheDocument();
  });

  it("does not call onChange when disabled", async () => {
    const user = userEvent.setup();
    render(<Checkbox checked={false} onChange={mockOnChange} disabled />);

    await user.click(screen.getByRole("checkbox"));

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("has disabled styles when disabled", () => {
    render(<Checkbox checked={false} onChange={mockOnChange} disabled />);

    const label = screen.getByRole("checkbox").closest("label");
    expect(label).toHaveClass("opacity-50");
    expect(label).toHaveClass("cursor-not-allowed");
  });

  it("applies custom className", () => {
    render(
      <Checkbox
        checked={false}
        onChange={mockOnChange}
        className="custom-class"
      />
    );

    const label = screen.getByRole("checkbox").closest("label");
    expect(label).toHaveClass("custom-class");
  });

  it("has correct aria-checked attribute", () => {
    const { rerender } = render(
      <Checkbox checked={false} onChange={mockOnChange} />
    );

    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");

    rerender(<Checkbox checked={true} onChange={mockOnChange} />);

    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
  });
});