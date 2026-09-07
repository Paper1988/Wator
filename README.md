# Wator 💧

A simple hydration reminder app built with React Native and Expo.

Wator helps you keep track of your daily water intake with a lightweight, local-first experience.

## ✨ Features

- 💧 Track daily water intake
- 🎯 Customizable daily hydration goal
- 🥤 Customizable quick-add drink amount
- 📊 View hydration history
- ↩️ Undo the latest drink record
- 🔔 Configurable water reminders
- 🌙 Light and dark themes
- 💾 Local data storage with SQLite
- 📱 Built for iOS with React Native and Expo

## 🛠️ Tech Stack

- React Native
- Expo
- TypeScript
- Expo Router
- Expo SQLite
- Expo Notifications
- Lucide React Native
- pnpm

## 📱 Screens

> Screenshots coming soon.

## 🚀 Getting Started

### Prerequisites

- Node.js
- pnpm
- Expo Go

### Installation

Clone the repository:

```bash
git clone <repository-url>
cd wator
```

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm expo start
```

Then scan the QR code with Expo Go to run the app on your device.

## 🗂️ Project Structure

```text
src/
├── app/
│   ├── index.tsx
│   ├── history.tsx
│   └── settings.tsx
├── components/
├── features/
│   ├── hydration/
│   └── reminder/
├── storage/
│   └── database.ts
└── constants/
    └── hydration.ts
```

## 💾 Data & Privacy

Wator uses local SQLite storage for hydration records and app settings.

Your hydration data stays on your device and is not sent to a remote server.

## 🧪 Development Status

Wator is currently under active development.

### Completed

- [x] Home screen
- [x] Hydration tracking
- [x] SQLite persistence
- [x] History
- [x] Undo
- [x] Settings
- [x] Custom hydration goal
- [x] Custom drink amount
- [x] Light / dark theme
- [x] Local notifications
- [x] Configurable reminders

### Planned

- [ ] UI / UX polish
- [ ] Improved hydration statistics
- [ ] More detailed history
- [ ] App icon and branding
- [ ] First stable release

## 📄 License

This project is currently for personal and educational use.
