import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { LoginPage } from "../LoginPage";

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage setUser={() => {}} />
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  it("shows the Precise brand", () => {
    renderLogin();
    expect(screen.getByText(/precise/i)).toBeTruthy();
  });

  it("shows the Welcome back heading", () => {
    renderLogin();
    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeTruthy();
  });

  it("renders email and password inputs", () => {
    renderLogin();
    const inputs = document.querySelectorAll("input");
    const types = Array.from(inputs).map((i) => i.type);
    expect(types).toContain("email");
    expect(types).toContain("password");
  });
});
