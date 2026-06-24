import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor, within } from "@testing-library/react";
import { renderWithProviders } from "../../../test/renderWithProviders";
import ProfileLayoutRenderer from "./ProfileLayoutRenderer";
import { getDefaultProfileTheme, normalizeProfileTheme } from "../builder/profileThemeUtils";

// Mock the preview API so we control the grouped content the renderer fetches.
// The block content modal pulls from the list endpoints — stub them empty so it
// just opens (we assert it mounts, not its loaded content).
vi.mock("../../../../API/Api", () => ({
    getProfilePreview: vi.fn(),
    getUserJournals: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
    getVisitedUserJournals: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
    getPinnedJournals: vi.fn().mockResolvedValue({ data: [] }),
    getVisitedPinnedJournals: vi.fn().mockResolvedValue({ data: [] }),
    getProfileMedia: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
    getVisitedProfileMedia: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
    getUserOpinions: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
}));
vi.mock("../../../../API/StoryApi", () => ({
    getUserStories: vi.fn().mockResolvedValue({ data: [], hasMore: false }),
}));
// The modal reads the session; no AuthProvider in the test harness.
vi.mock("../../../Context/useAuth", () => ({ useAuth: () => ({ session: null }) }));
import { getProfilePreview } from "../../../../API/Api";

// Stub the real guestbook so we can count its mounts (the dedup guarantee),
// surface the content props it receives, and avoid its full dependency tree.
vi.mock("../guestbook/ProfileGuestbook", () => ({
    default: ({ username, initialVisibleCount }) => (
        <div data-testid="guestbook" data-initial-visible-count={initialVisibleCount}>
            guestbook:{username}
        </div>
    ),
}));

// Build a normalized theme that overrides one content block (others default-fill).
const themeWithBlock = (type, { variant, content } = {}) =>
    normalizeProfileTheme(
        { layout: { blocks: [{ type, order: 0, ...(variant ? { variant } : {}), ...(content ? { content } : {}) }] } },
        userData
    );

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

    it("renders each block with V5 design data-attributes (no sticker UI)", async () => {
        getProfilePreview.mockResolvedValue(emptyPreview());
        const theme = normalizeProfileTheme(
            {
                layout: {
                    blocks: [
                        { type: "writings", order: 0, design: { surface: "paper", tone: "forest", radius: "sharp", titleAlign: "center", accent: "rose" } },
                    ],
                },
            },
            userData
        );
        const { container } = renderWithProviders(
            <ProfileLayoutRenderer theme={theme} username="alice" profileUserId="u1" navigate={vi.fn()} />
        );
        await screen.findByText("Writings");
        const block = container.querySelector(".pl-block--content.pl-block--design");
        expect(block).toBeTruthy();
        expect(block.getAttribute("data-surface")).toBe("paper");
        expect(block.getAttribute("data-tone")).toBe("forest");
        expect(block.getAttribute("data-radius")).toBe("sharp");
        expect(block.getAttribute("data-title-align")).toBe("center");
        expect(block.getAttribute("data-accent")).toBe("rose");
        // No sticker UI anywhere in the rendered profile.
        expect(container.querySelector(".pt-sticker, .pt-sticker-layer")).toBeNull();
    });

    it("opens the block content modal when a writing preview is clicked", async () => {
        getProfilePreview.mockResolvedValue(
            emptyPreview({
                writings: [{ id: "w1", title: "Clickable Essay", preview_text: "x", created_at: "2026-06-10", post_type: "text" }],
            })
        );
        renderWithProviders(
            <ProfileLayoutRenderer theme={getDefaultProfileTheme(userData)} username="alice" profileUserId="u1" navigate={vi.fn()} />
        );
        fireEvent.click(await screen.findByText("Clickable Essay"));
        expect(await screen.findByLabelText("Close")).toBeInTheDocument();
        expect(document.querySelector(".pl-modal-title")).toBeTruthy();
    });

    it("opens the block content modal when an opinion preview is clicked", async () => {
        getProfilePreview.mockResolvedValue(
            emptyPreview({ opinions: [{ id: "op1", opinion: "Spicy take here", created_at: "2026-06-10", reply_count: 0 }] })
        );
        renderWithProviders(
            <ProfileLayoutRenderer theme={getDefaultProfileTheme(userData)} username="alice" profileUserId="u1" navigate={vi.fn()} />
        );
        fireEvent.click(await screen.findByText("Spicy take here"));
        expect(await screen.findByLabelText("Close")).toBeInTheDocument();
        expect(document.querySelector(".pl-modal-title")).toBeTruthy();
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

    it("opens the modal from the block's 'View all' button (visiting)", async () => {
        getProfilePreview.mockResolvedValue(emptyPreview({ media: [{ id: "m1", thumbnail_url: "https://x/m.png" }] }));
        renderWithProviders(
            <ProfileLayoutRenderer theme={getDefaultProfileTheme(userData)} username="alice" profileUserId="u1" navigate={vi.fn()} />
        );
        const viewAll = await screen.findByText(/View all/);
        fireEvent.click(viewAll);
        expect(await screen.findByLabelText("Close")).toBeInTheDocument();
        expect(document.querySelector(".pl-modal-title")).toBeTruthy();
    });

    it("opens the modal from the block's 'View all' button (own profile)", async () => {
        getProfilePreview.mockResolvedValue(
            emptyPreview({ opinions: [{ id: "op1", opinion: "x", created_at: "2026-06-10", reply_count: 0 }] })
        );
        renderWithProviders(
            <ProfileLayoutRenderer theme={getDefaultProfileTheme(userData)} isOwn username="alice" profileUserId="u1" navigate={vi.fn()} />
        );
        const viewAll = await screen.findByText(/View all/);
        fireEvent.click(viewAll);
        expect(await screen.findByLabelText("Close")).toBeInTheDocument();
        expect(document.querySelector(".pl-modal-title")).toBeTruthy();
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

describe("ProfileLayoutRenderer — content controls (V3C)", () => {
    beforeEach(() => vi.clearAllMocks());

    it("slices writings to the configured count", async () => {
        getProfilePreview.mockResolvedValue(
            emptyPreview({
                writings: [
                    { id: "w1", title: "Alpha", preview_text: "a", created_at: "2026-06-10" },
                    { id: "w2", title: "Beta", preview_text: "b", created_at: "2026-06-09" },
                    { id: "w3", title: "Gamma", preview_text: "c", created_at: "2026-06-08" },
                ],
            })
        );
        const theme = themeWithBlock("writings", { variant: "list", content: { count: 1, source: "latest" } });
        renderWithProviders(
            <ProfileLayoutRenderer theme={theme} username="alice" profileUserId="u1" navigate={vi.fn()} />
        );
        expect(await screen.findByText("Alpha")).toBeInTheDocument();
        expect(screen.queryByText("Beta")).not.toBeInTheDocument();
        expect(screen.queryByText("Gamma")).not.toBeInTheDocument();
    });

    it("pinned_first merges pinned ahead of latest and dedupes by id", async () => {
        getProfilePreview.mockResolvedValue(
            emptyPreview({
                writings: [
                    { id: "shared", title: "Shared", preview_text: "x", created_at: "2026-06-10" },
                    { id: "latest1", title: "LatestOne", preview_text: "y", created_at: "2026-06-09" },
                ],
                pinnedWritings: [
                    { id: "shared", title: "Shared", preview_text: "x", created_at: "2026-06-10" },
                    { id: "pin1", title: "PinnedOne", preview_text: "z", created_at: "2026-06-08" },
                ],
            })
        );
        const theme = themeWithBlock("writings", { variant: "list", content: { count: 3, source: "pinned_first" } });
        renderWithProviders(
            <ProfileLayoutRenderer theme={theme} username="alice" profileUserId="u1" navigate={vi.fn()} />
        );
        const section = await screen.findByLabelText("Writings");
        await waitFor(() => expect(within(section).getByText("PinnedOne")).toBeInTheDocument());
        // "Shared" appears exactly once inside the writings block (deduped)
        expect(within(section).getAllByText("Shared")).toHaveLength(1);
        expect(within(section).getByText("LatestOne")).toBeInTheDocument();
    });

    it("applies count and imageShape class on media tiles", async () => {
        getProfilePreview.mockResolvedValue(
            emptyPreview({
                media: Array.from({ length: 6 }, (_, i) => ({
                    id: `m${i}`,
                    title: `Photo ${i}`,
                    thumbnail_url: `http://x/${i}.jpg`,
                    created_at: "2026-06-10",
                })),
            })
        );
        const theme = themeWithBlock("media", { variant: "grid", content: { count: 4, imageShape: "square" } });
        renderWithProviders(
            <ProfileLayoutRenderer theme={theme} username="alice" profileUserId="u1" navigate={vi.fn()} />
        );
        const section = await screen.findByLabelText("Media");
        await waitFor(() => expect(section.querySelectorAll(".pl-media-tile")).toHaveLength(4));
        section.querySelectorAll(".pl-media-tile").forEach((tile) =>
            expect(tile.classList.contains("pl-shape-square")).toBe(true)
        );
    });

    it("most_discussed sorts opinions by reply_count", async () => {
        getProfilePreview.mockResolvedValue(
            emptyPreview({
                opinions: [
                    { id: "o1", opinion: "Quiet take", created_at: "2026-06-10", reply_count: 1 },
                    { id: "o2", opinion: "Loud take", created_at: "2026-06-09", reply_count: 9 },
                ],
            })
        );
        const theme = themeWithBlock("opinions", { variant: "cards", content: { count: 3, source: "most_discussed" } });
        renderWithProviders(
            <ProfileLayoutRenderer theme={theme} username="alice" profileUserId="u1" navigate={vi.fn()} />
        );
        const section = await screen.findByLabelText("Opinions");
        await waitFor(() => expect(within(section).getByText("Loud take")).toBeInTheDocument());
        const texts = [...section.querySelectorAll(".pl-opinion-text")].map((n) => n.textContent);
        expect(texts[0]).toBe("Loud take"); // highest reply_count first
    });

    it("popular sorts stories by vote_count/read_count", async () => {
        getProfilePreview.mockResolvedValue(
            emptyPreview({
                stories: [
                    { id: "s1", title: "Mild", status: "ongoing", vote_count: 2, read_count: 5, created_at: "2026-06-10" },
                    { id: "s2", title: "Hit", status: "ongoing", vote_count: 50, read_count: 9, created_at: "2026-06-09" },
                ],
            })
        );
        const theme = themeWithBlock("stories", { variant: "shelf", content: { count: 4, source: "popular" } });
        renderWithProviders(
            <ProfileLayoutRenderer theme={theme} username="alice" profileUserId="u1" navigate={vi.fn()} />
        );
        const section = await screen.findByLabelText("Stories");
        await waitFor(() => expect(within(section).getByText("Hit")).toBeInTheDocument());
        const titles = [...section.querySelectorAll(".pl-story-title")].map((n) => n.textContent);
        expect(titles[0]).toBe("Hit"); // highest vote_count first
    });

    it("passes the configured count to the guestbook", async () => {
        getProfilePreview.mockResolvedValue(emptyPreview());
        const theme = themeWithBlock("guestbook", { variant: "wall", content: { count: 5 } });
        renderWithProviders(
            <ProfileLayoutRenderer theme={theme} username="alice" profileUserId="u1" navigate={vi.fn()} />
        );
        const gb = await screen.findByTestId("guestbook");
        expect(gb.getAttribute("data-initial-visible-count")).toBe("5");
    });

    it("renders an old theme whose blocks predate content controls without crashing", async () => {
        getProfilePreview.mockResolvedValue(
            emptyPreview({ writings: [{ id: "w1", title: "Legacy Essay", preview_text: "x", created_at: "2026-06-10" }] })
        );
        // A v2 layout block with NO content key (pre-V3C) — getBlockContent fills defaults.
        const theme = { version: 2, layout: { mode: "stack", blocks: [{ id: "writings", type: "writings", visible: true, order: 0, width: "full", style: "inherit", variant: "list", title: "Writings" }] } };
        renderWithProviders(
            <ProfileLayoutRenderer theme={theme} username="alice" profileUserId="u1" navigate={vi.fn()} />
        );
        expect(await screen.findByText("Legacy Essay")).toBeInTheDocument();
    });
});
