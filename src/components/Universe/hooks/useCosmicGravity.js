import { useState, useEffect, useRef, useMemo } from 'react';
import {
    computeGalaxyForces,
    computeGalaxySimilarityEdges,
    computeSectorKey,
    computeStarPullOffsets,
    computeStarPullOffsetsFromEmbeddings,
} from '../utils/cosmicPhysics';
import { userHomeCoords } from '../utils/starUtils';

const COOLING = 0.95;
const DAMPING = 0.9;
const BOUNDARY = 25000;
const RENDER_EVERY = 3; // only push state to React every N frames
const SETTLE_EPSILON = 0.35;
const SETTLE_FRAMES = 8;

export default function useCosmicGravity({
    galaxies,
    centroidTargets,
    edges,
    posts,
    starPulls,
    centroidByUser,
    activeSectorKeys,
    activePostIds,
    sectorSize = 2000,
}) {
    const [galaxyPositions, setGalaxyPositions] = useState(new Map());
    const [isSettled, setIsSettled] = useState(true);

    const galPosRef = useRef(new Map());
    const tempRef = useRef(1.0);
    const rafRef = useRef(null);
    const frameCountRef = useRef(0);
    const steadyFrameRef = useRef(0);

    const emptyMap = useMemo(() => new Map(), []);

    const hasEmbeddingCentroids = centroidByUser instanceof Map && centroidByUser.size > 1;
    const hasServerTargets = centroidTargets instanceof Map && centroidTargets.size > 0;
    const hasServerEdges = Array.isArray(edges) && edges.length > 0;

    const activePosts = useMemo(() => {
        if (!Array.isArray(posts) || posts.length === 0) return [];

        if (!(activeSectorKeys instanceof Set) || activeSectorKeys.size === 0) {
            return posts;
        }

        const filtered = [];
        for (const post of posts) {
            const x = post?.display_x ?? post?.universe_x;
            const y = post?.display_y ?? post?.universe_y;
            const sectorKey = computeSectorKey(x, y, sectorSize);
            if (sectorKey && activeSectorKeys.has(sectorKey)) {
                filtered.push(post);
            }
        }
        return filtered;
    }, [posts, activeSectorKeys, sectorSize]);

    const effectiveActivePostIds = useMemo(() => {
        if (activePostIds instanceof Set && activePostIds.size > 0) return activePostIds;
        const ids = new Set();
        for (const post of activePosts) {
            if (post?.id) ids.add(post.id);
        }
        return ids;
    }, [activePostIds, activePosts]);

    const activeUserIds = useMemo(() => {
        const ids = new Set();
        for (const post of activePosts) {
            const userId = post?.users?.id ?? post?.user_id;
            if (userId) ids.add(userId);
        }

        // Keep fallback behavior stable when sector data is sparse.
        if (ids.size === 0 && Array.isArray(galaxies)) {
            for (const galaxy of galaxies) {
                if (galaxy?.userId) ids.add(galaxy.userId);
            }
        }
        return ids;
    }, [activePosts, galaxies]);

    const localEdges = useMemo(() => {
        if (!hasEmbeddingCentroids || activeUserIds.size < 2) return [];
        return computeGalaxySimilarityEdges(centroidByUser, activeUserIds, 0.3, 800);
    }, [hasEmbeddingCentroids, centroidByUser, activeUserIds]);

    const effectiveEdges = hasEmbeddingCentroids ? localEdges : (Array.isArray(edges) ? edges : []);
    const effectiveTargets = hasEmbeddingCentroids
        ? emptyMap
        : (centroidTargets instanceof Map ? centroidTargets : emptyMap);

    const hasGravityData = hasEmbeddingCentroids
        ? effectiveEdges.length > 0
        : (hasServerTargets || hasServerEdges);

    // Merge galaxies into existing positions (never reset settled ones).
    useEffect(() => {
        if (!Array.isArray(galaxies) || galaxies.length === 0) return;

        const current = galPosRef.current;
        const merged = new Map(current);
        let hasNew = false;
        let hasRemoved = false;

        for (const galaxy of galaxies) {
            if (!merged.has(galaxy.userId)) {
                const hash = userHomeCoords(galaxy.userId);
                merged.set(galaxy.userId, { x: hash.x, y: hash.y });
                hasNew = true;
            }
        }

        const visibleIds = new Set(galaxies.map((g) => g.userId));
        for (const id of current.keys()) {
            if (!visibleIds.has(id)) {
                merged.delete(id);
                hasRemoved = true;
            }
        }

        if (hasNew || hasRemoved || current.size === 0) {
            galPosRef.current = merged;
            setGalaxyPositions(new Map(merged));
        }

        if (hasGravityData && (hasNew || hasRemoved || isSettled)) {
            tempRef.current = Math.max(tempRef.current, 0.85);
            steadyFrameRef.current = 0;
            setIsSettled(false);
        }
    }, [galaxies, hasGravityData, isSettled]);

    // Warm restart when gravity inputs change (new embeddings, sectors, or targets).
    useEffect(() => {
        if (!hasGravityData || galPosRef.current.size === 0) return;
        tempRef.current = Math.max(tempRef.current, 0.75);
        steadyFrameRef.current = 0;
        setIsSettled(false);
    }, [hasGravityData, effectiveTargets, effectiveEdges, activeSectorKeys]);

    // Galaxy animation loop (Gravity A).
    useEffect(() => {
        if (isSettled || !hasGravityData) return;

        let active = true;
        frameCountRef.current = 0;
        steadyFrameRef.current = 0;

        const tick = () => {
            if (!active) return;

            const activeIds = hasEmbeddingCentroids
                ? new Set(Array.from(activeUserIds).filter((id) => galPosRef.current.has(id)))
                : new Set(galPosRef.current.keys());

            if (activeIds.size === 0) {
                setIsSettled(true);
                return;
            }

            const forces = computeGalaxyForces(galPosRef.current, effectiveTargets, effectiveEdges, {
                activeIds,
            });

            const newPos = new Map();
            let maxDisp = 0;

            for (const [id, pos] of galPosRef.current.entries()) {
                const force = forces.get(id);
                if (!force) {
                    newPos.set(id, pos);
                    continue;
                }

                let nx = pos.x + force.fx * tempRef.current * DAMPING;
                let ny = pos.y + force.fy * tempRef.current * DAMPING;

                nx = Math.max(-BOUNDARY, Math.min(BOUNDARY, nx));
                ny = Math.max(-BOUNDARY, Math.min(BOUNDARY, ny));

                const dx = nx - pos.x;
                const dy = ny - pos.y;
                const disp = Math.sqrt(dx * dx + dy * dy);
                if (disp > maxDisp) maxDisp = disp;

                newPos.set(id, { x: nx, y: ny });
            }

            galPosRef.current = newPos;
            tempRef.current *= COOLING;
            frameCountRef.current++;

            if (maxDisp < SETTLE_EPSILON) {
                steadyFrameRef.current++;
            } else {
                steadyFrameRef.current = 0;
            }

            if (steadyFrameRef.current >= SETTLE_FRAMES || tempRef.current < 0.006) {
                setGalaxyPositions(new Map(newPos));
                setIsSettled(true);
                return;
            }

            if (frameCountRef.current % RENDER_EVERY === 0) {
                setGalaxyPositions(new Map(newPos));
            }

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            active = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [
        isSettled,
        hasGravityData,
        hasEmbeddingCentroids,
        activeUserIds,
        effectiveTargets,
        effectiveEdges,
    ]);

    // Star pull offsets (Gravity B).
    const starPullOffsets = useMemo(() => {
        if (!Array.isArray(posts) || posts.length === 0) return new Map();

        if (hasEmbeddingCentroids) {
            const positionsSource = galaxyPositions.size > 0 ? galaxyPositions : galPosRef.current;
            return computeStarPullOffsetsFromEmbeddings({
                posts: activePosts,
                galaxyCentroids: centroidByUser,
                galaxyPositions: positionsSource,
                activePostIds: effectiveActivePostIds,
                activeGalaxyIds: activeUserIds,
                minSimilarity: 0.4,
                pullStrength: 120,
                maxOffset: 80,
                maxGalaxyLinks: 6,
            });
        }

        if (!Array.isArray(starPulls) || starPulls.length === 0) return new Map();
        const galaxyTargets = centroidTargets instanceof Map ? centroidTargets : emptyMap;
        if (galaxyTargets.size === 0) return new Map();

        const starBases = new Map();
        for (const post of posts) {
            const x = post?.universe_x ?? post?.display_x;
            const y = post?.universe_y ?? post?.display_y;
            if (x != null && y != null && post?.id) {
                starBases.set(post.id, { x, y });
            }
        }

        return computeStarPullOffsets(starPulls, galaxyTargets, starBases);
    }, [
        posts,
        hasEmbeddingCentroids,
        galaxyPositions,
        activePosts,
        centroidByUser,
        effectiveActivePostIds,
        activeUserIds,
        starPulls,
        centroidTargets,
        emptyMap,
    ]);

    return {
        galaxyPositions,
        starPullOffsets,
        isSettled,
        galaxyEdges: effectiveEdges,
        hasEmbeddingGravity: hasEmbeddingCentroids,
    };
}
