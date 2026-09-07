import { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Pressable,
    StyleSheet,
    Text,
    View,
    useColorScheme,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    addWater as saveWater,
    getSettings,
    getTodayWater,
    undoLastWater,
} from "@/storage/database";
import { Undo2 } from "lucide-react-native";
import { getColors } from "@/constants/theme";

const DIGIT_HEIGHT = 76;

type AnimationDirection = "up" | "down";

function AnimatedDigit({
    digit,
    previousDigit,
    color,
    direction,
}: {
    digit: string;
    previousDigit: string;
    color: string;
    direction: AnimationDirection;
}) {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (digit === previousDigit) {
            return;
        }

        translateY.stopAnimation();

        const isUp = direction === "up";

        translateY.setValue(isUp ? 0 : -DIGIT_HEIGHT);

        const animation = Animated.timing(translateY, {
            toValue: isUp ? -DIGIT_HEIGHT : 0,
            duration: 180,
            useNativeDriver: true,
        });

        animation.start();

        return () => {
            animation.stop();
        };
    }, [digit, previousDigit, direction, translateY]);

    if (digit === previousDigit) {
        return (
            <View style={styles.digitWindow}>
                <Text
                    style={[
                        styles.amount,
                        styles.digit,
                        { color },
                    ]}
                >
                    {digit}
                </Text>
            </View>
        );
    }

    const oldDigit = (
        <Text
            style={[
                styles.amount,
                styles.digit,
                { color },
            ]}
        >
            {previousDigit}
        </Text>
    );

    const newDigit = (
        <Text
            style={[
                styles.amount,
                styles.digit,
                { color },
            ]}
        >
            {digit}
        </Text>
    );

    return (
        <View style={styles.digitWindow}>
            <Animated.View
                style={[
                    styles.digitStack,
                    {
                        transform: [{ translateY }],
                    },
                ]}
            >
                {direction === "up" ? (
                    <>
                        {oldDigit}
                        {newDigit}
                    </>
                ) : (
                    <>
                        {newDigit}
                        {oldDigit}
                    </>
                )}
            </Animated.View>
        </View>
    );
}

function AnimatedAmount({
    value,
    color,
    unitColor,
}: {
    value: number;
    color: string;
    unitColor: string;
}) {
    const currentValue = String(value);
    const previousValue = useRef(currentValue);
    const previous = previousValue.current;

    const length = Math.max(previous.length, currentValue.length);
    const previousDigits = previous.padStart(length, " ");
    const currentDigits = currentValue.padStart(length, " ");

    const overallDirection: AnimationDirection =
        value >= Number(previous) ? "up" : "down";

    useEffect(() => {
        previousValue.current = currentValue;
    }, [currentValue]);

    return (
        <View style={styles.amountRow}>
            {currentDigits.split("").map((digit, index) => {
                const previousDigit = previousDigits[index];

                return (
                    <AnimatedDigit
                        key={index}
                        digit={digit}
                        previousDigit={previousDigit}
                        color={color}
                        direction={overallDirection}
                    />
                );
            })}

            <Text style={[styles.unit, { color: unitColor }]}>mL</Text>
        </View>
    );
}

export default function HomeScreen() {
    const [water, setWater] = useState(0);
    const [dailyGoal, setDailyGoal] = useState(2000);
    const [waterAmount, setWaterAmount] = useState(250);

    const goalReachedOpacity = useRef(new Animated.Value(0)).current;
    const goalReachedTranslateY = useRef(new Animated.Value(4)).current;
    const goalReachedScale = useRef(new Animated.Value(0.95)).current;

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
        const nextWater = water + waterAmount;

        await saveWater(waterAmount);
        setWater(nextWater);

        if (water < dailyGoal && nextWater >= dailyGoal) {
            goalReachedOpacity.setValue(0);
            goalReachedTranslateY.setValue(4);
            goalReachedScale.setValue(0.95);

            Animated.parallel([
                Animated.timing(goalReachedOpacity, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true,
                }),
                Animated.timing(goalReachedTranslateY, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: true,
                }),
                Animated.spring(goalReachedScale, {
                    toValue: 1,
                    friction: 7,
                    tension: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }

    async function undoWater() {
        const amount = await undoLastWater();

        if (amount === 0) {
            return;
        }

        setWater((current) => Math.max(current - amount, 0));
    }

    const goalProgress = water / dailyGoal;
    const progress = Math.min(goalProgress, 1);
    const percentage = Math.round(goalProgress * 100);

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.appName, { color: colors.text }]}>Wator</Text>
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
                    <Text style={[styles.label, { color: colors.text }]}>Today</Text>

                    <AnimatedAmount
                        value={water}
                        color={colors.text}
                        unitColor={colors.textSecondary}
                    />

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
                                    backgroundColor:
                                        water >= dailyGoal
                                            ? colors.success
                                            : colors.primary,
                                },
                            ]}
                        />
                    </View>

                    <Text
                        style={[
                            styles.percentage,
                            {
                                color:
                                    water >= dailyGoal
                                        ? colors.success
                                        : colors.textSecondary,
                            },
                        ]}
                    >
                        {percentage}%
                    </Text>

                    {water >= dailyGoal && (
                        <Animated.Text
                            style={[
                                styles.goalReached,
                                {
                                    color: colors.success,
                                    opacity: goalReachedOpacity,
                                    transform: [
                                        {
                                            translateY: goalReachedTranslateY,
                                        },
                                        {
                                            scale: goalReachedScale,
                                        },
                                    ],
                                },
                            ]}
                        >
                            Goal reached 🎉
                        </Animated.Text>
                    )}
                </View>

                <View style={styles.buttonRow}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.undoButton,
                            {
                                backgroundColor: colors.surfaceSecondary,
                                transform: [{ scale: pressed ? 0.92 : 1 }],
                            },
                            water === 0 && styles.undoButtonDisabled,
                        ]}
                        onPress={undoWater}
                        disabled={water === 0}
                    >
                        <Undo2 size={24} color={colors.text} strokeWidth={2} />
                    </Pressable>

                    <Pressable
                        style={({ pressed }) => [
                            styles.waterButton,
                            {
                                backgroundColor: colors.primary,
                                transform: [{ scale: pressed ? 0.96 : 1 }],
                            },
                        ]}
                        onPress={addWater}
                    >
                        <Text
                            style={[
                                styles.waterButtonText,
                                { color: "#fff" },
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
        alignItems: "center",
    },

    amount: {
        fontSize: 64,
        fontWeight: "700",
        lineHeight: DIGIT_HEIGHT,
    },

    digitWindow: {
        height: DIGIT_HEIGHT,
        overflow: "hidden",
    },

    digitStack: {},

    digit: {
        height: DIGIT_HEIGHT,
        textAlign: "center",
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
        overflow: "hidden",
        marginTop: 28,
    },

    progress: {
        height: "100%",
        borderRadius: 6,
    },

    percentage: {
        fontSize: 14,
        marginTop: 8,
        opacity: 0.6,
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
    },

    undoButtonDisabled: {
        opacity: 0.4,
    },

    waterButton: {
        flex: 1,
        height: 60,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
    },

    waterButtonText: {
        fontSize: 18,
        fontWeight: "600",
    },

    goalReached: {
        fontSize: 14,
        fontWeight: "600",
        marginTop: 8,
    },
});
