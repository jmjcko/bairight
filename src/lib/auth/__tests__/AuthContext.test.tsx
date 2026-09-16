import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthProvider, useAuth } from "../AuthContext";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

const TestComponent = () => {
  const { user, loginWithGoogle, logout, loginDemoUser } = useAuth();

  return (
    <div>
      <div data-testid="user-status">{user ? user.name : "Logged out"}</div>
      <div data-testid="user-email">{user ? user.email : ""}</div>
      <button onClick={() => loginWithGoogle()}>Google Login</button>
      <button onClick={() => loginDemoUser("Test User", "test@example.com")}>Demo Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders logged out state initially", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("user-status")).toHaveTextContent("Logged out");
  });

  it("logs in user via Google login trigger", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Google Login"));
    });

    expect(screen.getByTestId("user-status")).toHaveTextContent("Jan Mynář");
    expect(screen.getByTestId("user-email")).toHaveTextContent("jan.mynar@gmail.com");
  });

  it("logs in demo user and persists to localStorage", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Demo Login"));
    });

    expect(screen.getByTestId("user-status")).toHaveTextContent("Test User");
    expect(localStorage.getItem("bairight_user_session")).toContain("test@example.com");
  });

  it("logs out user successfully", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Demo Login"));
    });

    expect(screen.getByTestId("user-status")).toHaveTextContent("Test User");

    await act(async () => {
      fireEvent.click(screen.getByText("Logout"));
    });

    expect(screen.getByTestId("user-status")).toHaveTextContent("Logged out");
    expect(localStorage.getItem("bairight_user_session")).toBeNull();
  });
});
