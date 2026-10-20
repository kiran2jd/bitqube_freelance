import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { AuthProvider } from "../context/AuthContext";

describe("Navbar Component", () => {
  it("renders brand, default currency, and login/register links when unauthenticated", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Navbar defaultCurrency="INR" defaultCountry="IN" />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/BitQube/i)).toBeInTheDocument();
    expect(screen.getByText(/₹ INR/i)).toBeInTheDocument();
    expect(screen.getByText(/Find Professionals/i)).toBeInTheDocument();
    expect(screen.getByText(/Browse Services/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
  });
});
