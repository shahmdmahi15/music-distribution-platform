import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  SidebarProvider,
  useSidebar,
  SidebarTrigger,
  SIDEBAR_COOKIE_NAME,
} from "@/components/ui/sidebar";

function TestConsumer() {
  const { state, open, toggleSidebar, setOpen, isMobile, openMobile } =
    useSidebar();
  return (
    <div>
      <span data-testid="sidebar-state">{state}</span>
      <span data-testid="sidebar-open">{String(open)}</span>
      <span data-testid="sidebar-mobile">{String(isMobile)}</span>
      <span data-testid="sidebar-open-mobile">{String(openMobile)}</span>
      <button data-testid="toggle-btn" onClick={toggleSidebar}>
        Toggle Sidebar
      </button>
      <button data-testid="collapse-btn" onClick={() => setOpen(false)}>
        Collapse
      </button>
      <button data-testid="expand-btn" onClick={() => setOpen(true)}>
        Expand
      </button>
      <SidebarTrigger data-testid="trigger-component-btn" />
    </div>
  );
}

describe("Sidebar State & Breakpoints Unit Test Suite", () => {
  beforeEach(() => {
    // Clear cookies before each test
    document.cookie = `${SIDEBAR_COOKIE_NAME}=; path=/; max-age=0`;
    // Default to desktop innerWidth = 1024
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("initializes with defaultOpen=true from prop", () => {
      render(
        <SidebarProvider defaultOpen={true}>
          <TestConsumer />
        </SidebarProvider>
      );

      expect(screen.getByTestId("sidebar-state").textContent).toBe("expanded");
      expect(screen.getByTestId("sidebar-open").textContent).toBe("true");
    });

    it("initializes with defaultOpen=false from prop", () => {
      render(
        <SidebarProvider defaultOpen={false}>
          <TestConsumer />
        </SidebarProvider>
      );

      expect(screen.getByTestId("sidebar-state").textContent).toBe("collapsed");
      expect(screen.getByTestId("sidebar-open").textContent).toBe("false");
    });

    it("initializes from sidebar_state cookie when defaultOpen is not set", () => {
      document.cookie = `${SIDEBAR_COOKIE_NAME}=false; path=/`;

      render(
        <SidebarProvider>
          <TestConsumer />
        </SidebarProvider>
      );

      expect(screen.getByTestId("sidebar-state").textContent).toBe("collapsed");
      expect(screen.getByTestId("sidebar-open").textContent).toBe("false");
    });

    it("initializes as expanded from sidebar_state=true cookie", () => {
      document.cookie = `${SIDEBAR_COOKIE_NAME}=true; path=/`;

      render(
        <SidebarProvider>
          <TestConsumer />
        </SidebarProvider>
      );

      expect(screen.getByTestId("sidebar-state").textContent).toBe("expanded");
      expect(screen.getByTestId("sidebar-open").textContent).toBe("true");
    });
  });

  describe("Toggling & Cookie Persistence", () => {
    it("toggles sidebar state and writes sidebar_state cookie", () => {
      render(
        <SidebarProvider defaultOpen={true}>
          <TestConsumer />
        </SidebarProvider>
      );

      expect(screen.getByTestId("sidebar-state").textContent).toBe("expanded");

      // Click toggle button to collapse
      fireEvent.click(screen.getByTestId("toggle-btn"));
      expect(screen.getByTestId("sidebar-state").textContent).toBe("collapsed");
      expect(screen.getByTestId("sidebar-open").textContent).toBe("false");
      expect(document.cookie).toContain(`${SIDEBAR_COOKIE_NAME}=false`);

      // Click toggle button to expand again
      fireEvent.click(screen.getByTestId("toggle-btn"));
      expect(screen.getByTestId("sidebar-state").textContent).toBe("expanded");
      expect(screen.getByTestId("sidebar-open").textContent).toBe("true");
      expect(document.cookie).toContain(`${SIDEBAR_COOKIE_NAME}=true`);
    });

    it("toggles via SidebarTrigger component", () => {
      render(
        <SidebarProvider defaultOpen={true}>
          <TestConsumer />
        </SidebarProvider>
      );

      fireEvent.click(screen.getByTestId("trigger-component-btn"));
      expect(screen.getByTestId("sidebar-state").textContent).toBe("collapsed");
      expect(document.cookie).toContain(`${SIDEBAR_COOKIE_NAME}=false`);
    });

    it("supports setOpen programmatic control", () => {
      render(
        <SidebarProvider defaultOpen={true}>
          <TestConsumer />
        </SidebarProvider>
      );

      fireEvent.click(screen.getByTestId("collapse-btn"));
      expect(screen.getByTestId("sidebar-state").textContent).toBe("collapsed");

      fireEvent.click(screen.getByTestId("expand-btn"));
      expect(screen.getByTestId("sidebar-state").textContent).toBe("expanded");
    });
  });

  describe("Keyboard Shortcuts (⌘B / Ctrl+B)", () => {
    it("toggles via ⌘B (Meta + B) shortcut on Mac", () => {
      render(
        <SidebarProvider defaultOpen={true}>
          <TestConsumer />
        </SidebarProvider>
      );

      expect(screen.getByTestId("sidebar-state").textContent).toBe("expanded");

      // Dispatch ⌘B keydown
      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "b", metaKey: true })
        );
      });

      expect(screen.getByTestId("sidebar-state").textContent).toBe("collapsed");
      expect(document.cookie).toContain(`${SIDEBAR_COOKIE_NAME}=false`);

      // Press ⌘B again to re-expand
      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "b", metaKey: true })
        );
      });

      expect(screen.getByTestId("sidebar-state").textContent).toBe("expanded");
      expect(document.cookie).toContain(`${SIDEBAR_COOKIE_NAME}=true`);
    });

    it("toggles via Ctrl+B shortcut on Windows/Linux", () => {
      render(
        <SidebarProvider defaultOpen={true}>
          <TestConsumer />
        </SidebarProvider>
      );

      expect(screen.getByTestId("sidebar-state").textContent).toBe("expanded");

      // Dispatch Ctrl+B keydown
      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "b", ctrlKey: true })
        );
      });

      expect(screen.getByTestId("sidebar-state").textContent).toBe("collapsed");

      // Press Ctrl+B again to re-expand
      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "b", ctrlKey: true })
        );
      });

      expect(screen.getByTestId("sidebar-state").textContent).toBe("expanded");
    });

    it("ignores 'b' without Meta or Ctrl modifier keys", () => {
      render(
        <SidebarProvider defaultOpen={true}>
          <TestConsumer />
        </SidebarProvider>
      );

      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "b" }));
      });

      // Must remain expanded
      expect(screen.getByTestId("sidebar-state").textContent).toBe("expanded");
    });

    it("ignores other key combinations like Meta+C", () => {
      render(
        <SidebarProvider defaultOpen={true}>
          <TestConsumer />
        </SidebarProvider>
      );

      act(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "c", metaKey: true })
        );
      });

      // Must remain expanded
      expect(screen.getByTestId("sidebar-state").textContent).toBe("expanded");
    });
  });

  describe("Mobile Breakpoint Detection (< 768px)", () => {
    it("correctly detects mobile breakpoint when viewport is < 768px", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 500,
      });
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <SidebarProvider defaultOpen={true}>
          <TestConsumer />
        </SidebarProvider>
      );

      expect(screen.getByTestId("sidebar-mobile").textContent).toBe("true");

      // On mobile, toggleSidebar toggles openMobile
      expect(screen.getByTestId("sidebar-open-mobile").textContent).toBe("false");
      fireEvent.click(screen.getByTestId("toggle-btn"));
      expect(screen.getByTestId("sidebar-open-mobile").textContent).toBe("true");
    });

    it("correctly detects desktop when viewport is >= 768px", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(
        <SidebarProvider defaultOpen={true}>
          <TestConsumer />
        </SidebarProvider>
      );

      expect(screen.getByTestId("sidebar-mobile").textContent).toBe("false");
    });
  });
});
