import { useQuery } from "@tanstack/react-query";
import { Navigate, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { getPublicUserById } from "../../../API/Api";
import Loader from "../loadingComponent/BgLoader";

const NotFound = lazy(() => import("../NotFound.jsx"));

// Maps the legacy subroute to the canonical /u/:username suffix.
const SECTION_SUFFIX = {
    media: "/media",
    opinions: "/opinions",
    stories: "/stories",
};

/**
 * Canonicalizes legacy `/visitProfile?userId=<uuid>` links (and their nested
 * media/opinions/stories variants) to `/u/:username`. Resolves the userId to a
 * username server-side, then redirects with `replace` so the legacy URL doesn't
 * stay in history.
 */
const LegacyVisitProfileRedirect = ({ section }) => {
    const location = useLocation();
    const userId = new URLSearchParams(location.search).get("userId");

    const { data, isLoading, isError } = useQuery({
        queryKey: ["resolveUserId", userId],
        queryFn: () => getPublicUserById(userId),
        enabled: !!userId,
        staleTime: 1000 * 60 * 10,
        retry: false,
        refetchOnWindowFocus: false,
    });

    if (!userId || isError) {
        return (
            <Suspense fallback={<Loader />}>
                <NotFound />
            </Suspense>
        );
    }

    if (isLoading) {
        return <Loader />;
    }

    const username = data?.username;
    if (!username) {
        // Resolved a user with no username — nothing canonical to send them to.
        return (
            <Suspense fallback={<Loader />}>
                <NotFound />
            </Suspense>
        );
    }

    const suffix = section ? SECTION_SUFFIX[section] || "" : "";
    const target = `/u/${encodeURIComponent(username)}${suffix}`;

    // Pass the resolved userId along as a small optimization for the profile page.
    return <Navigate to={target} replace state={{ userId: data?.id }} />;
};

export default LegacyVisitProfileRedirect;
