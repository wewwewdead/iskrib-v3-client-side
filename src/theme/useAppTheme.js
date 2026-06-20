import { useContext } from "react";
import { ThemeContext } from "../Context/ThemeContext";

// Focused accessor for the App Theme picker. Reads the same ThemeContext that
// powers the legacy `useTheme()` hook — no second provider. Existing components
// that only need the binary light/dark toggle keep using `useTheme()`.
export const useAppTheme = () => {
    const ctx = useContext(ThemeContext);
    return {
        selectedTheme: ctx.selectedTheme,
        resolvedTheme: ctx.resolvedTheme,
        setAppTheme: ctx.setAppTheme,
        availableThemes: ctx.availableThemes,
    };
};
