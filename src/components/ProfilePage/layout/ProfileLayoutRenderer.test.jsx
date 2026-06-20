import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../../test/renderWithProviders";
import ProfileLayoutRenderer from "./ProfileLayoutRenderer";
import { getDefaultProfileTheme, normalizeProfileTheme } from "../builder/profileThemeUtils";

// Mock the preview API so we control the grouped content the renderer fetches.
vi.mock("../../../../API/Api", () => ({ getProfilePreview: vi.fn() }));
import { getProfilePreview } from "../../../../API/Api";

// Stub the real guestbook so we can count its mounts (the dedup guarantee) and
// avoid pulling its full dependency tree.
vi.mock("../guestbook/ProfileGuestbook", () => ({
    default: ({ username }) => <div data-testid="guestbook">guestbook:{username}</div>,
}));

const userData = { profile_font_color: "#fff", created_at: "2020-01-01" };

const emptyPreview = (overrides = {}) => ({
    user: { id: "u1", username: "alice", name: "Alice", image_url: null, badge: null },
    writings: [],
    media: [],
    opinions: [],
    stories: [],
    pinnedWritings: [],
    ...overrides,
});

describe("ProfileLayoutRenderer (V3B real previews)", () => {
    beforeEach(() => vi.clearAllMocks());

    it("renders the guestbook exactly once (no duplication)", async () => {
        getProfilePreview.mockResolvedValue(emptyPreview());
        const theme = getDefaultProfileTheme(userData);
        renderWithProviders(
            <ProfileLayoutRenderer theme={theme} username="alice" profileUserId="u1" navigate={vi.fn()} />
        );
        await waitFor(() => expect(getProfilePreview).toHaveBeenCalledWith("alice"));
        expect(screen.getAllByTestId("guestbook")).toHaveLength(1);
    });

    it("renders a real writings preview", async () => {
        getProfilePreview.mockResolvedValue(
            emptyPreview({
                writings: [
                    { id: "w1", title: "On Quiet Mornings", preview_text: "A small meditation.", created_at: "2026-06-10", post_type: "text" },
                ],
            })
        );
        const theme = getDefaultProfileTheme(userData);
        renderWithProviders(
            <ProfileLayoutRenderer theme={theme} username="alice" profileUserId="u1" navigate={vi.fn()} />
        );
        expect(await screen.findByText("On Quiet Mornings")).toBeInTheDocument();
    });

    it("opens the content viewer when a writing preview is clicked", async () => {
        getProfilePreview.mockResolvedValue(
            emptyPreview({
                writings: [{ id: "w1", title: "Clickable Essay", preview_text: "x", created_at: "2026-06-10", post_type: "text" }],
            })
        );
        const navigate = vi.fn();
        renderWithProviders(
            <ProfileLayoutRenderer theme={getDefaultProfileTheme(userData)} username="alice" profileUserId="u1" navigate={navigate} />
        );
        fireEvent.click(await screen.findByText("Clickable Essay"));
        expect(navigate).toHaveBeenCalledWith(
            expect.stringContaining("/home/post/w1"),
            expect.objectContaining({ state: expect.objectContaining({ journalId: "w1", title: "Clickable Essay" }) })
        );
    });

    it("opens the opinion viewer when an opinion preview is clicked", async () => {
        getProfilePreview.mockResolvedValue(
            emptyPreview({ opinions: [{ id: "op1", opinion: "Spicy take here", created_at: "2026-06-10", reply_count: 0 }] })
        );
        const navigate = vi.fn();
        renderWithProviders(
            <ProfileLayoutRenderer theme={getDefaultProfileTheme(userData)} username="alice" profileUserId="u1" navigate={navigate} />
        );
        fireEvent.click(await screen.findByText("Spicy take here"));
        expect(navigate).toHaveBeenCalledWith("/home/opinionsViewer", { state: { opinionId: "op1", userId: "u1" } });
    });

    it("shows an owner creation CTA on an empty block", async () => {
        getProfilePreview.mockResolvedValue(emptyPreview());
        const onWriteJournal = vi.fn();
        renderWithProviders(
            <ProfileLayoutRenderer theme={getDefaultProfileTheme(userData)} isOwn username="alice" profileUserId="u1" navigate={vi.fn()} onWriteJournal={onWriteJournal} />
        );
        const cta = await screen.findByText("Write something");
        fireEvent.click(cta);
        expect(onWriteJournal).toHaveBeenCalled();
    });

    it("shows a calm visitor empty state with no creation CTA", async () => {
        getProfilePreview.mockResolvedValue(emptyPreview());
        renderWithProviders(
            <ProfileLayoutRenderer theme={getDefaultProfileTheme(userData)} username="alice" profileUserId="u1" navigate={vi.fn()} />
        );
        expect(await screen.findByText("No writings yet.")).toBeInTheDocument();
        expect(screen.queryByText("Write something")).not.toBeInTheDocument();
    });

    it("links content blocks to canonical /u/:username routes when visiting", async () => {
        getProfilePreview.mockResolvedValue(emptyPreview());
        const navigate = vi.fn();
        renderWithProviders(
            <ProfileLayoutRenderer theme={getDefaultProfileTheme(userData)} username="alice" profileUserId="u1" navigate={navigate} />
        );
        await screen.findByText("No writings yet.");
        fireEvent.click(screen.getByLabelText("Media").querySelector(".pl-block-viewall"));
        expect(navigate).toHaveBeenCalledWith("/u/alice/media");
    });

    it("links to legacy /profile/* routes on the owner's own profile", async () => {
        getProfilePreview.mockResolvedValue(emptyPreview());
        const navigate = vi.fn();
        renderWithProviders(
            <ProfileLayoutRenderer theme={getDefaultProfileTheme(userData)} isOwn username="alice" profileUserId="u1" navigate={navigate} />
        );
        await screen.findByText("No writings yet.");
        fireEvent.click(screen.getByLabelText("Opinions").querySelector(".pl-block-viewall"));
        expect(navigate).toHaveBeenCalledWith("/profile/myOpinions");
    });

    it("omits hidden blocks and never fetches when only a hidden guestbook exists", async () => {
        getProfilePreview.mockResolvedValue(emptyPreview());
        const theme = normalizeProfileTheme(
            { layout: { blocks: [{ type: "guestbook", order: 0, visible: false }, { type: "media", order: 1, visible: false }] } },
            userData
        );
        renderWithProviders(
            <ProfileLayoutRenderer theme={theme} username="alice" profileUserId="u1" navigate={vi.fn()} />
        );
        // media + guestbook hidden; writings/opinions/stories/pinned remain (default-filled, visible)
        await screen.findByText("No writings yet.");
        expect(screen.queryByText("No media shared yet.")).not.toBeInTheDocument();
        expect(screen.queryByTestId("guestbook")).not.toBeInTheDocument();
    });
});
