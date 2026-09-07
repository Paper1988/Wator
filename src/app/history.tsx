import { useCallback, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import { getColors } from "@/constants/theme";
import {
    getSettings,
    getWaterHistory,
    type AppSettings,
    type WaterIntake,
} from "@/storage/database";

function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString("zh-TW", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getDateKey(timestamp: string) {
    const date = new Date(timestamp);

    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getDateLabel(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();

    if (getDateKey(timestamp) === getDateKey(now.toISOString())) {
        return "Today";
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (getDateKey(timestamp) === getDateKey(yesterday.toISOString())) {
        return "Yesterday";
    }

    return date.toLocaleDateString("zh-TW", {
        month: "short",
        day: "numeric",
    });
}

type DayGroup = {
    key: string;
    label: string;
    total: number;
    records: WaterIntake[];
};

export default function HistoryScreen() {
    const scheme = useColorScheme();
    const colors = getColors(scheme);

    const [records, setRecords] = useState<WaterIntake[]>([]);
    const [settings, setSettings] = useState<AppSettings>({
        dailyGoal: 2000,
        waterAmount: 250,
        theme: "light",
    });
    const [refreshing, setRefreshing] = useState(false);

    const loadHistory = useCallback(async () => {
        const [history, currentSettings] = await Promise.all([
            getWaterHistory(),
            getSettings(),
        ]);

        setRecords(history);
        setSettings(currentSettings);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [loadHistory]),
    );

    async function refresh() {
        setRefreshing(true);
        await loadHistory();
        setRefreshing(false);
    }

    const groupedRecords = records.reduce<DayGroup[]>((groups, record) => {
        const key = getDateKey(record.timestamp);

        const existingGroup = groups.find((group) => group.key === key);

        if (existingGroup) {
            existingGroup.total += record.amount;
            existingGroup.records.push(record);
            return groups;
        }

        groups.push({
            key,
            label: getDateLabel(record.timestamp),
            total: record.amount,
            records: [record],
        });

        return groups;
    }, []);

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refresh}
                        tintColor={colors.textSecondary}
                    />
                }
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        History
                    </Text>

                    <Text
                        style={[
                            styles.subtitle,
                            { color: colors.textSecondary },
                        ]}
                    >
                        Your hydration records
                    </Text>
                </View>

                {groupedRecords.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text
                            style={[styles.emptyTitle, { color: colors.text }]}
                        >
                            No records yet
                        </Text>

                        <Text
                            style={[
                                styles.emptySubtitle,
                                { color: colors.textSecondary },
                            ]}
                        >
                            Start drinking water to build your history.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.groups}>
                        {groupedRecords.map((group) => {
                            const progress = Math.min(
                                group.total / settings.dailyGoal,
                                1,
                            );

                            return (
                                <View key={group.key} style={styles.dayGroup}>
                                    <View style={styles.dayHeader}>
                                        <View>
                                            <Text
                                                style={[
                                                    styles.dayLabel,
                                                    {
                                                        color: colors.text,
                                                    },
                                                ]}
                                            >
                                                {group.label}
                                            </Text>

                                            <Text
                                                style={[
                                                    styles.dayTotal,
                                                    {
                                                        color: colors.textSecondary,
                                                    },
                                                ]}
                                            >
                                                {group.total.toLocaleString()}{" "}
                                                mL /{" "}
                                                {settings.dailyGoal.toLocaleString()}{" "}
                                                mL
                                            </Text>
                                        </View>

                                        <Text
                                            style={[
                                                styles.dayPercentage,
                                                {
                                                    color: colors.textSecondary,
                                                },
                                            ]}
                                        >
                                            {Math.round(progress * 100)}%
                                        </Text>
                                    </View>

                                    <View
                                        style={[
                                            styles.progressBackground,
                                            {
                                                backgroundColor:
                                                    colors.progressBackground,
                                            },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.progress,
                                                {
                                                    width: `${progress * 100}%`,
                                                    backgroundColor:
                                                        colors.primary,
                                                },
                                            ]}
                                        />
                                    </View>

                                    <View style={styles.recordList}>
                                        {group.records.map((record) => (
                                            <View
                                                key={record.id}
                                                style={[
                                                    styles.record,
                                                    {
                                                        borderBottomColor:
                                                            colors.divider,
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.recordAmount,
                                                        {
                                                            color: colors.text,
                                                        },
                                                    ]}
                                                >
                                                    +{record.amount} mL
                                                </Text>

                                                <Text
                                                    style={[
                                                        styles.recordTime,
                                                        {
                                                            color: colors.textSecondary,
                                                        },
                                                    ]}
                                                >
                                                    {formatTime(
                                                        record.timestamp,
                                                    )}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    content: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 32,
    },

    header: {
        marginBottom: 32,
    },

    title: {
        fontSize: 32,
        fontWeight: "700",
    },

    subtitle: {
        fontSize: 16,
        marginTop: 4,
    },

    groups: {
        gap: 32,
    },

    dayGroup: {
        gap: 16,
    },

    dayHeader: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
    },

    dayLabel: {
        fontSize: 20,
        fontWeight: "700",
    },

    dayTotal: {
        fontSize: 14,
        marginTop: 4,
    },

    dayPercentage: {
        fontSize: 14,
        fontWeight: "600",
    },

    progressBackground: {
        width: "100%",
        height: 8,
        borderRadius: 4,
        overflow: "hidden",
    },

    progress: {
        height: "100%",
        borderRadius: 4,
    },

    recordList: {
        marginTop: 4,
    },

    record: {
        minHeight: 52,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: StyleSheet.hairlineWidth,
    },

    recordAmount: {
        fontSize: 16,
        fontWeight: "500",
    },

    recordTime: {
        fontSize: 14,
    },

    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 120,
    },

    emptyTitle: {
        fontSize: 20,
        fontWeight: "600",
    },

    emptySubtitle: {
        fontSize: 14,
        marginTop: 8,
        textAlign: "center",
    },
});
