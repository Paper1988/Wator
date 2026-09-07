/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import "@/global.css";

import { ColorSchemeName, Platform } from "react-native";

export const Colors = {
    light: {
        background: "#fdfbfa",
        surface: "#ffffff",
        surfaceSecondary: "#f3f4f6",

        border: "#e5e7eb",
        borderHover: "#d1d5db",
        divider: "#f3f4f6",

        text: "#111827",
        textSecondary: "#6b7280",
        textTertiary: "#9ca3af",

        primary: "#2563eb",
        primaryHover: "#1d4ed8",
        primaryText: "#ffffff",

        success: "#22c55e",
        warning: "#f97316",
        error: "#ef4444",

        progressBackground: "#e5e7eb",
    },

    dark: {
        background: "#0a0a0a",
        surface: "#111111",
        surfaceSecondary: "#1a1a1a",

        border: "rgba(255, 255, 255, 0.08)",
        borderHover: "rgba(255, 255, 255, 0.15)",
        divider: "rgba(255, 255, 255, 0.05)",

        text: "#ffffff",
        textSecondary: "#9ca3af",
        textTertiary: "#6b7280",

        primary: "#2563eb",
        primaryHover: "#1d4ed8",
        primaryText: "#ffffff",

        success: "#22c55e",
        warning: "#f97316",
        error: "#ef4444",

        progressBackground: "#262626",
    },
} as const;

export function getColors(scheme: ColorSchemeName) {
    return Colors[scheme === "dark" ? "dark" : "light"];
}

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
    ios: {
        /** iOS `UIFontDescriptorSystemDesignDefault` */
        sans: "system-ui",
        /** iOS `UIFontDescriptorSystemDesignSerif` */
        serif: "ui-serif",
        /** iOS `UIFontDescriptorSystemDesignRounded` */
        rounded: "ui-rounded",
        /** iOS `UIFontDescriptorSystemDesignMonospaced` */
        mono: "ui-monospace",
    },
    default: {
        sans: "normal",
        serif: "serif",
        rounded: "normal",
        mono: "monospace",
    },
    web: {
        sans: "var(--font-display)",
        serif: "var(--font-serif)",
        rounded: "var(--font-rounded)",
        mono: "var(--font-mono)",
    },
});

export const Spacing = {
    half: 2,
    one: 4,
    two: 8,
    three: 16,
    four: 24,
    five: 32,
    six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
