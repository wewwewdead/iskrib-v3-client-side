let profileRoutePromise = null;

export const preloadProfileRoute = () => {
    if (!profileRoutePromise) {
        profileRoutePromise = Promise.all([
            import("../components/ProfilePage/MyProfile.jsx"),
            import("../components/HomePage/postCards/ProfilePostCards/ProfilePostCards.jsx"),
            import("../components/SidebarOpinions/MyOpinions.jsx"),
        ]).catch(() => null);
    }

    return profileRoutePromise;
};

