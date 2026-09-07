import * as SQLite from "expo-sqlite";

export type WaterIntake = {
    id: number;
    amount: number;
    timestamp: string;
};

export type ThemeMode = "light" | "dark";

export type AppSettings = {
    dailyGoal: number;
    waterAmount: number;
    theme: ThemeMode;
    reminderEnabled: boolean;
    reminderInterval: number;
};

const DEFAULT_SETTINGS: AppSettings = {
    dailyGoal: 2000,
    waterAmount: 250,
    theme: "light",
    reminderEnabled: false,
    reminderInterval: 60,
};

export async function getDatabase() {
    return SQLite.openDatabaseAsync("siply.db");
}

export async function initializeDatabase() {
    const db = await getDatabase();

    await db.execAsync(`
        CREATE TABLE IF NOT EXISTS water_intake (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount INTEGER NOT NULL,
            timestamp TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL
        );

        INSERT OR IGNORE INTO app_settings (key, value)
        VALUES
            ('dailyGoal', '2000'),
            ('waterAmount', '250'),
            ('theme', 'light'),
            ('reminderEnabled', 'false'),
            ('reminderInterval', '60');
    `);

    return db;
}

export async function addWater(amount: number) {
    const db = await initializeDatabase();

    await db.runAsync(
        "INSERT INTO water_intake (amount, timestamp) VALUES (?, ?)",
        amount,
        new Date().toISOString(),
    );
}

export async function getTodayWater() {
    const db = await initializeDatabase();

    const now = new Date();

    const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
    );

    const startOfTomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
    );

    const result = await db.getFirstAsync<{ total: number }>(
        `
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM water_intake
        WHERE timestamp >= ? AND timestamp < ?
        `,
        startOfDay.toISOString(),
        startOfTomorrow.toISOString(),
    );

    return result?.total ?? 0;
}

export async function getWaterHistory(): Promise<WaterIntake[]> {
    const db = await initializeDatabase();

    return db.getAllAsync<WaterIntake>(
        `
        SELECT id, amount, timestamp
        FROM water_intake
        ORDER BY timestamp DESC, id DESC
        `,
    );
}

export async function undoLastWater() {
    const db = await initializeDatabase();

    const lastRecord = await db.getFirstAsync<WaterIntake>(
        `
        SELECT id, amount, timestamp
        FROM water_intake
        ORDER BY timestamp DESC, id DESC
        LIMIT 1
        `,
    );

    if (!lastRecord) {
        return 0;
    }

    await db.runAsync("DELETE FROM water_intake WHERE id = ?", lastRecord.id);

    return lastRecord.amount;
}

export async function getSettings(): Promise<AppSettings> {
    const db = await initializeDatabase();

    const rows = await db.getAllAsync<{
        key: string;
        value: string;
    }>(
        `
        SELECT key, value
        FROM app_settings
        `,
    );

    const settings = {
        ...DEFAULT_SETTINGS,
    };

    for (const row of rows) {
        if (row.key === "theme") {
            if (row.value === "light" || row.value === "dark") {
                settings.theme = row.value;
            }
        }

        if (row.key === "dailyGoal") {
            settings.dailyGoal = Number(row.value);
        }

        if (row.key === "waterAmount") {
            settings.waterAmount = Number(row.value);
        }

        if (row.key === "reminderEnabled") {
            settings.reminderEnabled = row.value === "true";
        }

        if (row.key === "reminderInterval") {
            settings.reminderInterval = Number(row.value);
        }
    }

    return settings;
}

export async function setSetting(
    key: keyof AppSettings,
    value: AppSettings[typeof key],
) {
    const db = await initializeDatabase();

    await db.runAsync(
        `
        INSERT INTO app_settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key)
        DO UPDATE SET value = excluded.value
        `,
        key,
        String(value),
    );
}
