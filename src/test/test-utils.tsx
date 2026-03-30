import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/features/term-sheet-tarot/hooks/useAuth";
import { useSimulatorStore } from "@/features/term-sheet-tarot/state/simulator-store";

const initialSimulatorState = useSimulatorStore.getState();

export function resetSimulatorStore() {
  useSimulatorStore.setState(initialSimulatorState, true);
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });
}

function TestProviders({
  children,
  path,
  queryClient,
  route,
}: {
  children: ReactNode;
  path?: string;
  queryClient: QueryClient;
  route: string;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <MemoryRouter
            future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
            initialEntries={[route]}
          >
            {path ? <Routes><Route path={path} element={children as ReactElement} /></Routes> : children}
          </MemoryRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  {
    path,
    route = "/",
    queryClient = createTestQueryClient(),
  }: {
    path?: string;
    route?: string;
    queryClient?: QueryClient;
  } = {},
) {
  return {
    queryClient,
    ...render(
      <TestProviders path={path} queryClient={queryClient} route={route}>
        {ui}
      </TestProviders>,
    ),
  };
}

export async function renderAppAtRoute(route = "/") {
  const { default: App } = await import("@/App");
  window.history.pushState({}, "Test Route", route);
  return render(<App />);
}
