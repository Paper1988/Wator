import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Appearance,
    Keyboard,
    Platform,
    Pressable,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    ScrollView,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getSettings, setSetting, type AppSettings } from "@/storage/database";
import { getColors } from "@/constants/theme";

import {
    disableWaterReminder,
    scheduleWaterReminder,
} from "@/features/reminder/reminder.service";

function sanitizeNumber(value: string) {
    return value.replace(/[^0-9]/g, "");
}

export default function SettingsScreen() {
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [reminderEnabled, setReminderEnabled] = useState(false);
    const [reminderInterval, setReminderInterval] = useState("60");
    const [reminderIntervalError, setReminderIntervalError] = useState("");

    const [settings, setSettings] = useState<AppSettings>({
        dailyGoal: 2000,
        waterAmount: 250,
        theme: "light",
        reminderEnabled: false,
        reminderInterval: 60,
    });

    const scheme = useColorScheme();
    const colors = getColors(scheme);

    const [dailyGoal, setDailyGoal] = useState("2000");
    const [waterAmount, setWaterAmount] = useState("250");

    const [dailyGoalError, setDailyGoalError] = useState("");
    const [waterAmountError, setWaterAmountError] = useState("");
    const [saved, setSaved] = useState(false);

    const [keyboardVisible, setKeyboardVisible] = useState(false);

    const savedOpacity = useRef(new Animated.Value(0)).current;
    const savedTranslateY = useRef(new Animated.Value(6)).current;

    useEffect(() => {
        async function loadSettings() {
            const currentSettings = await getSettings();

            setSettings(currentSettings);

            setDailyGoal(String(currentSettings.dailyGoal));
            setWaterAmount(String(currentSettings.waterAmount));
            setTheme(currentSettings.theme);
            setReminderEnabled(currentSettings.reminderEnabled);
            setReminderInterval(String(currentSettings.reminderInterval));
        }

        loadSettings();
    }, []);

    useEffect(() => {
        const showSubscription = Keyboard.addListener(
            "keyboardWillShow",
            () => {
                setKeyboardVisible(true);
            },
        );

        const hideSubscription = Keyboard.addListener(
            "keyboardWillHide",
            () => {
                setKeyboardVisible(false);
            },
        );

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    async function saveSettings() {
        Keyboard.dismiss();
        const newDailyGoal = Number(dailyGoal);
        const newWaterAmount = Number(waterAmount);
        const newReminderInterval = Number(reminderInterval);

        let valid = true;

        if (
            !Number.isInteger(newDailyGoal) ||
            newDailyGoal < 500 ||
            newDailyGoal > 10000
        ) {
            setDailyGoalError("Enter a value between 500 and 10000 mL.");
            valid = false;
        }

        if (
            !Number.isInteger(newWaterAmount) ||
            newWaterAmount < 50 ||
            newWaterAmount > 2000
        ) {
            setWaterAmountError("Enter a value between 50 and 2000 mL.");
            valid = false;
        }

        if (
            reminderEnabled &&
            (!Number.isInteger(newReminderInterval) ||
                newReminderInterval < 1 ||
                newReminderInterval > 1440)
        ) {
            setReminderIntervalError(
                "Enter a value between 1 and 1440 minutes.",
            );
            valid = false;
        }

        if (!valid) {
            return;
        }

        await setSetting("dailyGoal", newDailyGoal);
        await setSetting("waterAmount", newWaterAmount);
        await setSetting("theme", theme);
        await setSetting("reminderEnabled", reminderEnabled);
        await setSetting("reminderInterval", newReminderInterval);

        Appearance.setColorScheme(theme);

        if (reminderEnabled) {
            const scheduled = await scheduleWaterReminder(newReminderInterval);

            if (!scheduled) {
                setSaved(false);
                return;
            }
        } else {
            await disableWaterReminder();
        }

        setSettings({
            dailyGoal: newDailyGoal,
            waterAmount: newWaterAmount,
            theme: theme,
            reminderEnabled: reminderEnabled,
            reminderInterval: newReminderInterval,
        });

        setSaved(true);

        savedOpacity.setValue(0);
        savedTranslateY.setValue(6);

        Animated.parallel([
            Animated.timing(savedOpacity, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(savedTranslateY, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start();

        setTimeout(() => {
            Animated.timing(savedOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setSaved(false);
            });
        }, 1200);
    }

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <ScrollView
                    contentContainerStyle={[styles.content]}
                    keyboardDismissMode="none"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View>
                        <Text style={[styles.title, { color: colors.text }]}>
                            Settings
                        </Text>
                        <Text
                            style={[
                                styles.subtitle,
                                { color: colors.textSecondary },
                            ]}
                        >
                            Customize your hydration
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text
                            style={[
                                styles.sectionTitle,
                                { color: colors.text },
                            ]}
                        >
                            Daily goal
                        </Text>

                        <View style={styles.inputRow}>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor:
                                            colors.surfaceSecondary,
                                        color: colors.text,
                                        borderColor: dailyGoalError
                                            ? colors.error
                                            : colors.border,
                                    },
                                ]}
                                value={dailyGoal}
                                onChangeText={(value) => {
                                    setDailyGoal(sanitizeNumber(value));
                                    setDailyGoalError("");
                                    setSaved(false);
                                }}
                                onBlur={saveSettings}
                                keyboardType="number-pad"
                            />

                            {dailyGoalError !== "" && (
                                <Text
                                    style={[
                                        styles.errorText,
                                        { color: colors.error },
                                    ]}
                                >
                                    {dailyGoalError}
                                </Text>
                            )}

                            <Text style={styles.unit}>mL</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text
                            style={[
                                styles.sectionTitle,
                                { color: colors.text },
                            ]}
                        >
                            Quick drink amount
                        </Text>

                        <View style={styles.inputRow}>
                            <TextInput
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor:
                                            colors.surfaceSecondary,
                                        color: colors.text,
                                        borderColor: dailyGoalError
                                            ? colors.error
                                            : colors.border,
                                    },
                                ]}
                                value={waterAmount}
                                onChangeText={(value) => {
                                    setWaterAmount(sanitizeNumber(value));
                                    setWaterAmountError("");
                                    setSaved(false);
                                }}
                                onBlur={saveSettings}
                                keyboardType="number-pad"
                            />

                            {waterAmountError !== "" && (
                                <Text
                                    style={[
                                        styles.errorText,
                                        { color: colors.error },
                                    ]}
                                >
                                    {waterAmountError}
                                </Text>
                            )}

                            <Text style={styles.unit}>mL</Text>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text
                            style={[
                                styles.sectionTitle,
                                { color: colors.text },
                            ]}
                        >
                            Appearance
                        </Text>

                        <View style={styles.themeRow}>
                            <Pressable
                                style={({ pressed }) => [
                                    styles.themeButton,
                                    {
                                        backgroundColor:
                                            colors.surfaceSecondary,
                                        borderColor:
                                            theme === "light"
                                                ? colors.primary
                                                : colors.border,
                                    },
                                    pressed && styles.themeButtonPressed,
                                ]}
                                onPress={() => setTheme("light")}
                            >
                                <Text
                                    style={[
                                        styles.themeButtonText,
                                        { color: colors.text },
                                    ]}
                                >
                                    ☀️ Light
                                </Text>
                            </Pressable>

                            <Pressable
                                style={({ pressed }) => [
                                    styles.themeButton,
                                    {
                                        backgroundColor:
                                            colors.surfaceSecondary,
                                        borderColor:
                                            theme === "dark"
                                                ? colors.primary
                                                : colors.border,
                                    },
                                    pressed && styles.themeButtonPressed,
                                ]}
                                onPress={() => setTheme("dark")}
                            >
                                <Text
                                    style={[
                                        styles.themeButtonText,
                                        { color: colors.text },
                                    ]}
                                >
                                    🌙 Dark
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.settingHeader}>
                            <View style={styles.settingText}>
                                <Text
                                    style={[
                                        styles.sectionTitle,
                                        { color: colors.text },
                                    ]}
                                >
                                    Water reminders
                                </Text>

                                <Text
                                    style={[
                                        styles.settingDescription,
                                        { color: colors.textSecondary },
                                    ]}
                                >
                                    Remind me to drink water regularly.
                                </Text>
                            </View>

                            <Switch
                                value={reminderEnabled}
                                onValueChange={setReminderEnabled}
                                trackColor={{
                                    false: colors.surfaceSecondary,
                                    true: colors.primary,
                                }}
                                thumbColor="#ffffff"
                            />
                        </View>

                        {reminderEnabled && (
                            <View style={styles.reminderIntervalRow}>
                                <Text
                                    style={[
                                        styles.intervalLabel,
                                        { color: colors.text },
                                    ]}
                                >
                                    Every
                                </Text>

                                <TextInput
                                    style={[
                                        styles.intervalInput,
                                        {
                                            backgroundColor:
                                                colors.surfaceSecondary,
                                            color: colors.text,
                                            borderColor: reminderIntervalError
                                                ? colors.error
                                                : colors.border,
                                        },
                                    ]}
                                    value={reminderInterval}
                                    onChangeText={(value) => {
                                        setReminderInterval(
                                            value.replace(/[^0-9]/g, ""),
                                        );

                                        setReminderIntervalError("");
                                        setSaved(false);
                                    }}
                                    keyboardType="number-pad"
                                />

                                {reminderIntervalError !== "" && (
                                    <Text
                                        style={[
                                            styles.errorText,
                                            { color: colors.error },
                                        ]}
                                    >
                                        {reminderIntervalError}
                                    </Text>
                                )}

                                <Text
                                    style={[
                                        styles.intervalUnit,
                                        { color: colors.textSecondary },
                                    ]}
                                >
                                    min
                                </Text>
                            </View>
                        )}
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.saveButton,
                            { backgroundColor: colors.primary },
                            pressed && styles.saveButtonPressed,
                        ]}
                        onPress={() => {
                            Keyboard.dismiss();
                            saveSettings();
                        }}
                    >
                        <Text
                            style={[
                                styles.saveButtonText,
                                { color: colors.primaryText },
                            ]}
                        >
                            Save
                        </Text>
                    </Pressable>

                    <Animated.View
                        pointerEvents="none"
                        style={[
                            styles.savedMessage,
                            {
                                opacity: savedOpacity,
                                transform: [
                                    {
                                        translateY: savedTranslateY,
                                    },
                                ],
                            },
                        ]}
                    >
                        <Text
                            style={[styles.savedText, { color: colors.text }]}
                        >
                            Saved ✓
                        </Text>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    content: {
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 32,
        gap: 32,
    },

    title: {
        fontSize: 32,
        fontWeight: "700",
    },

    subtitle: {
        fontSize: 16,
        opacity: 0.5,
        marginTop: 4,
    },

    section: {
        gap: 12,
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: "600",
    },

    inputRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    input: {
        flex: 1,
        height: 52,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: "#e5e7eb",
        fontSize: 18,
    },

    inputError: {
        borderWidth: 1,
        borderColor: "#ef4444",
    },

    unit: {
        marginLeft: 12,
        fontSize: 16,
        opacity: 0.6,
    },

    errorText: {
        fontSize: 13,
        color: "#ef4444",
    },

    themeRow: {
        flexDirection: "row",
        gap: 12,
    },

    themeButton: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
    },

    themeButtonSelected: {
        borderWidth: 2,
        borderColor: "#3b82f6",
    },

    themeButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },

    saveButton: {
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#3b82f6",
    },

    themeButtonPressed: {
        opacity: 0.7,
    },

    saveButtonPressed: {
        opacity: 0.7,
    },

    saveButtonText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "600",
    },

    savedMessage: {
        alignItems: "center",
    },

    savedText: {
        fontSize: 14,
        opacity: 0.6,
    },

    settingHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
    },

    settingText: {
        flex: 1,
        gap: 4,
    },

    settingDescription: {
        fontSize: 14,
        lineHeight: 20,
    },

    reminderIntervalRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    intervalLabel: {
        fontSize: 16,
    },

    intervalInput: {
        width: 90,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 14,
        fontSize: 16,
        textAlign: "center",
    },

    intervalUnit: {
        fontSize: 16,
    },
});
