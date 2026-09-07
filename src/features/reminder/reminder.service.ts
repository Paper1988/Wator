import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function requestNotificationPermission() {
    const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

    if (existingStatus === "granted") {
        return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();

    return status === "granted";
}

export async function scheduleWaterReminder(intervalMinutes: number) {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const hasPermission = await requestNotificationPermission();

    if (!hasPermission) {
        return false;
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Time for a sip 💧",
            body: "Take a moment to drink some water.",
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: intervalMinutes * 60,
            repeats: true,
        },
    });

    return true;
}

export async function disableWaterReminder() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function sendTestNotification() {
    const hasPermission = await requestNotificationPermission();

    if (!hasPermission) {
        return false;
    }

    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Siply 💧",
            body: "This is a test notification.",
        },
        trigger: null,
    });

    return true;
}
