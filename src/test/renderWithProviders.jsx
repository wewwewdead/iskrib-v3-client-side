import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../components/Toast/ToastContext";

// Wraps a component in the providers the design-system surfaces need:
// React Query (guestbook cache), Toast (success/error), Router (useNavigate).
// Returns the created QueryClient so tests can seed/inspect the cache.
export function renderWithProviders(ui, { client } = {}) {
    const queryClient =
        client ||
        new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        });
    const result = render(
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <MemoryRouter>{ui}</MemoryRouter>
            </ToastProvider>
        </QueryClientProvider>
    );
    return { ...result, queryClient };
}
