import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../../test/renderWithProviders";
import ProfileGuestbook from "./ProfileGuestbook";
import * as Api from "../../../../API/Api";

vi.mock("../../../../API/Api", () => ({
    getProfileGuestbook: vi.fn(),
    createGuestbookEntry: vi.fn(),
    deleteGuestbookEntry: vi.fn(),
}));

// Logged-in user whose userData row carries the fields the optimistic author needs.
vi.mock("../../../Context/useAuth", () => ({
    useAuth: () => ({
        session: { access_token: "tok", user: { id: "me-id" } },
        user: {
            userData: [
                { id: "me-id", username: "me", name: "Me", image_url: null, badge: null },
            ],
        },
        openAuthModal: vi.fn(),
    }),
}));

const PROPS = { username: "alice", profileUserId: "owner-id" };

const typeAndSign = (text) => {
    fireEvent.change(screen.getByLabelText("Guestbook message"), { target: { value: text } });
    fireEvent.click(screen.getByRole("button", { name: "Sign" }));
};

describe("ProfileGuestbook optimistic signing", () => {
    beforeEach(() => vi.clearAllMocks());

    it("rolls back the note and restores the draft when the server fails", async () => {
        Api.getProfileGuestbook.mockResolvedValue({
            entries: [],
            hasMore: false,
            profileUserId: "owner-id",
        });
        Api.createGuestbookEntry.mockRejectedValue(new Error("boom"));

        renderWithProviders(<ProfileGuestbook {...PROPS} />);
        await screen.findByLabelText("Guestbook message");

        typeAndSign("hello room");

        // After the failure: the optimistic note is gone, the draft is restored,
        // and an error toast is shown. No silent lingering note.
        await waitFor(() => {
            expect(screen.getByText(/couldn't leave your note/i)).toBeInTheDocument();
        });
        // Entries rolled back to empty (the optimistic note was removed)...
        expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
        // ...and the draft is restored into the composer (not silently lost).
        expect(screen.getByLabelText("Guestbook message")).toHaveValue("hello room");
    });

    it("keeps the note and clears the composer on success", async () => {
        let serverEntries = [];
        Api.getProfileGuestbook.mockImplementation(async () => ({
            entries: serverEntries,
            hasMore: false,
            profileUserId: "owner-id",
        }));
        Api.createGuestbookEntry.mockImplementation(async (_token, _username, text) => {
            serverEntries = [
                {
                    id: "real-1",
                    message: text,
                    created_at: new Date().toISOString(),
                    author_user_id: "me-id",
                    author: { id: "me-id", username: "me", name: "Me", image_url: null, badge: null },
                },
                ...serverEntries,
            ];
            return {};
        });

        renderWithProviders(<ProfileGuestbook {...PROPS} />);
        await screen.findByLabelText("Guestbook message");

        typeAndSign("hi there");

        await waitFor(() => {
            expect(screen.getByText(/note left in the room/i)).toBeInTheDocument();
        });
        expect(screen.getByText("hi there")).toBeInTheDocument();
        expect(screen.getByLabelText("Guestbook message")).toHaveValue("");
    });
});
