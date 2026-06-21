import { describe, it, expect } from "vitest";
import {
    resolveCount,
    imageShapeClass,
    densityClass,
    sortOpinions,
    sortStories,
} from "./previewUtils";

describe("resolveCount", () => {
    it("prefers an explicit positive count", () => {
        expect(resolveCount(1, "writings", "list", 3)).toBe(1);
        expect(resolveCount(4, "media", "grid", 6)).toBe(4);
    });
    it("falls back to the variant default for missing/invalid counts", () => {
        expect(resolveCount(undefined, "writings", "list", 3)).toBe(3);
        expect(resolveCount(0, "media", "grid", 6)).toBe(6);
        expect(resolveCount(-2, "stories", "shelf", 4)).toBe(4);
        expect(resolveCount("nope", "opinions", "cards", 3)).toBe(3);
    });
});

describe("imageShapeClass / densityClass", () => {
    it("maps whitelisted shapes to fixed classes", () => {
        expect(imageShapeClass("square")).toBe("pl-shape-square");
        expect(imageShapeClass("soft")).toBe("pl-shape-soft");
        expect(imageShapeClass("rounded")).toBe("pl-shape-rounded");
        expect(imageShapeClass("evil")).toBe("pl-shape-rounded"); // unknown → default
    });
    it("maps density to a fixed class", () => {
        expect(densityClass("compact")).toBe("pl-density-compact");
        expect(densityClass("comfortable")).toBe("pl-density-comfortable");
        expect(densityClass("weird")).toBe("pl-density-comfortable");
    });
});

describe("sortOpinions / sortStories", () => {
    it("only sorts opinions when source is most_discussed", () => {
        const items = [{ reply_count: 1 }, { reply_count: 5 }, { reply_count: 2 }];
        expect(sortOpinions(items, "latest")).toBe(items); // untouched (same ref)
        const sorted = sortOpinions(items, "most_discussed");
        expect(sorted.map((o) => o.reply_count)).toEqual([5, 2, 1]);
        expect(items.map((o) => o.reply_count)).toEqual([1, 5, 2]); // original not mutated
    });
    it("only sorts stories when source is popular (votes then reads)", () => {
        const items = [
            { vote_count: 2, read_count: 100 },
            { vote_count: 9, read_count: 1 },
            { vote_count: 9, read_count: 7 },
        ];
        expect(sortStories(items, "latest")).toBe(items);
        const sorted = sortStories(items, "popular");
        expect(sorted.map((s) => `${s.vote_count}:${s.read_count}`)).toEqual(["9:7", "9:1", "2:100"]);
    });
});
