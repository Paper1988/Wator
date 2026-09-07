import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    addWater as saveWater,
    getSettings,
    getTodayWater,
    undoLastWater,
} from "@/storage/database";
import { Undo2 } from "lucide-react-native";
import { useColorScheme } from "react-native";
import { getColors } from "@/constants/theme";
import { sendTestNotification } from "@/features/reminder/reminder.service";

export default function HomeScreen() {
    const [water, setWater] = useState(0);
    const [dailyGoal, setDailyGoal] = useState(2000);
    const [waterAmount, setWaterAmount] = useState(250);

    const scheme = useColorScheme();
    const colors = getColors(scheme);

    useFocusEffect(
        useCallback(() => {
            async function loadData() {
                const [todayWater, settings] = await Promise.all([
                    getTodayWater(),
                    getSettings(),
                ]);

                setWater(todayWater);
                setDailyGoal(settings.dailyGoal);
                setWaterAmount(settings.waterAmount);
            }

            loadData();
        }, []),
    );

    async function addWater() {
        await saveWater(waterAmount);
        setWater((current) => current + waterAmount);
    }

    async function undoWater() {
        const amount = await undoLastWater();

        if (amount === 0) {
            return;
        }

        setWater((current) => Math.max(current - amount, 0));
    }

    const progress = Math.min(water / dailyGoal, 1);

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.appName, { color: colors.text }]}>
                        Siply
                    </Text>

                    <Text
                        style={[
                            styles.subtitle,
                            { color: colors.textSecondary },
                        ]}
                    >
                        Stay hydrated.
                    </Text>
                </View>

                <View style={styles.progressSection}>
                    <Text style={[styles.label, { color: colors.text }]}>
                        Today
                    </Text>

                    <View style={styles.amountRow}>
                        <Text style={[styles.amount, { color: colors.text }]}>
                            {water}
                        </Text>
                        <Text
                            style={[
                                styles.unit,
                                { color: colors.textSecondary },
                            ]}
                        >
                            mL
                        </Text>
                    </View>

                    <Text
                        style={[styles.goal, { color: colors.textSecondary }]}
                    >
                        of {dailyGoal} mL
                    </Text>

                    <View
                        style={[
                            styles.progressBackground,
                            {
                                backgroundColor: colors.progressBackground,
                            },
                        ]}
                    >
                        <View
                            style={[
                                styles.progress,
                                {
                                    width: `${progress * 100}%`,
                                    backgroundColor: colors.primary,
                                },
                            ]}
                        />
                    </View>

                    <Text
                        style={[
                            styles.percentage,
                            { color: colors.textSecondary },
                        ]}
                    >
                        {Math.round(progress * 100)}%
                    </Text>
                </View>

                <View style={styles.buttonRow}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.undoButton,
                            {
                                backgroundColor: colors.surfaceSecondary,
                            },
                            pressed && styles.undoButtonPressed,
                        ]}
                        onPress={undoWater}
                    >
                        <Undo2 size={24} color={colors.text} strokeWidth={2} />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.waterButton,
                            {
                                backgroundColor: colors.primary,
                            },
                            pressed && styles.waterButtonPressed,
                        ]}
                        onPress={addWater}
                    >
                        <Text
                            style={[
                                styles.waterButtonText,
                                { color: colors.primaryText },
                            ]}
                        >
                            + {waterAmount} mL
                        </Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 24,
        justifyContent: "space-between",
    },
    header: {
        gap: 4,
    },
    appName: {
        fontSize: 32,
        fontWeight: "700",
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.6,
    },
    progressSection: {
        alignItems: "center",
    },
    label: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 12,
    },
    amountRow: {
        flexDirection: "row",
        alignItems: "baseline",
    },
    amount: {
        fontSize: 64,
        fontWeight: "700",
    },
    unit: {
        fontSize: 20,
        marginLeft: 6,
    },
    goal: {
        fontSize: 16,
        opacity: 0.5,
        marginTop: 4,
    },
    progressBackground: {
        width: "100%",
        height: 12,
        borderRadius: 6,
        backgroundColor: "#e5e7eb",
        overflow: "hidden",
        marginTop: 28,
    },
    progress: {
        height: "100%",
        borderRadius: 6,
        backgroundColor: "#3b82f6",
    },
    percentage: {
        fontSize: 14,
        marginTop: 8,
        opacity: 0.6,
    },
    waterButtonPressed: {
        opacity: 0.7,
    },
    waterButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
    },
    buttonRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    undoButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#e5e7eb",
    },
    undoButtonPressed: {
        opacity: 0.7,
    },
    undoButtonText: {
        fontSize: 28,
    },
    waterButton: {
        flex: 1,
        height: 60,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#3b82f6",
    },
});
