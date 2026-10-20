import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { AuthProvider } from "../context/AuthContext";

describe("Marketplace Navigation", () => {
  it("renders Projects link in top navigation", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Navbar defaultCurrency="INR" defaultCountry="IN" />
        </AuthProvider>
      </MemoryRouter>
    );

    const projectLinks = screen.getAllByRole("link", { name: /Projects/i });
    expect(projectLinks.length).toBeGreaterThan(0);
    expect(projectLinks.some((l) => l.getAttribute("href") === "/projects")).toBe(true);
  });
});
