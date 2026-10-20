import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComingSoonBanner } from "../components/ComingSoonBanner";

describe("ComingSoonBanner Component", () => {
  it("renders BTQ Payments and QUBEX Benefits placeholders", () => {
    render(<ComingSoonBanner />);
    expect(screen.getByText(/BTQ Payments/i)).toBeInTheDocument();
    expect(screen.getByText(/QUBEX Benefits/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Coming Soon/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/MVP operates strictly on compliant fiat currencies/i)).toBeInTheDocument();
  });
});
