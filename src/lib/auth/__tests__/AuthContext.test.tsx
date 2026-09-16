import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AuthProvider, useAuth, decodeGoogleJwt } from "../AuthContext";

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
  const { user, handleGoogleCredentialResponse, logout, setGoogleClientId } = useAuth();

  return (
    <div>
      <div data-testid="user-status">{user ? user.name : "Logged out"}</div>
      <div data-testid="user-email">{user ? user.email : ""}</div>
      <button onClick={() => setGoogleClientId("test-client-id.apps.googleusercontent.com")}>Set Client ID</button>
      <button
        onClick={() => {
          // Simulate real Google JWT response
          const fakeHeader = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
          const fakePayload = btoa(
            JSON.stringify({
              sub: "usr_real_g_123",
              email: "real.user@gmail.com",
              name: "Real Google User",
              picture: "https://lh3.googleusercontent.com/avatar.jpg",
            })
          );
          const fakeToken = `${fakeHeader}.${fakePayload}.fakesig`;
          handleGoogleCredentialResponse(fakeToken);
        }}
      >
        Simulate Google Credential
      </button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe("AuthContext with Real Google GIS", () => {
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

  it("decodes Google JWT correctly", () => {
    const fakeHeader = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const fakePayload = btoa(unescape(encodeURIComponent(JSON.stringify({ sub: "usr_123", email: "jan.mynar@gmail.com", name: "Jan Mynář" }))));
    const fakeToken = `${fakeHeader}.${fakePayload}.fakesig`;

    const decoded = decodeGoogleJwt(fakeToken);
    expect(decoded?.email).toBe("jan.mynar@gmail.com");
    expect(decoded?.name).toBe("Jan Mynář");
  });

  it("logs in real Google user when valid Google credential token is received", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Simulate Google Credential"));
    });

    expect(screen.getByTestId("user-status")).toHaveTextContent("Real Google User");
    expect(screen.getByTestId("user-email")).toHaveTextContent("real.user@gmail.com");
  });

  it("logs out user successfully", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Simulate Google Credential"));
    });

    expect(screen.getByTestId("user-status")).toHaveTextContent("Real Google User");

    await act(async () => {
      fireEvent.click(screen.getByText("Logout"));
    });

    expect(screen.getByTestId("user-status")).toHaveTextContent("Logged out");
    expect(localStorage.getItem("bairight_user_session")).toBeNull();
  });
});
