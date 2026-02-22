# SuperApp Framework (React Native)

A modular SuperApp mobile application built with React Native (Expo) that supports multiple Mini Apps under a single container with shared authentication.

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on your phone (for physical device testing) or an iOS/Android simulator

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd superApp

# Install dependencies
npm install

# Start the development server
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS) to run on your device.

### Running on Specific Platforms

```bash
npm run android    # Start on Android
npm run ios        # Start on iOS
npm run web        # Start on Web
```

## Architecture Explanation

The app follows a **SuperApp container architecture** with the following layers:

### 1. Container App (`App.tsx`)

The root application that initializes and wraps all providers:

- **Redux Provider** — Makes the global store available to all components
- **PersistGate** — Delays rendering until persisted state is rehydrated from AsyncStorage
- **NavigationContainer** — Provides the navigation context for React Navigation

### 2. Shared Authentication Service

Authentication state is managed centrally via Redux Toolkit. All Mini Apps access the same global store through typed hooks (`useAppSelector`, `useAppDispatch`), ensuring a single source of truth for user data. Session persistence is handled by `redux-persist` with `AsyncStorage`, so users remain logged in across app restarts.

### 3. Mini Apps

Self-contained feature modules located in `src/miniApps/`. Each Mini App is a standalone screen (or set of screens) that accesses shared state through Redux hooks. Mini Apps are decoupled from each other and only depend on the shared store.

### 4. Navigation

Uses React Navigation with conditional rendering:

- **Unauthenticated** → Native Stack with Login screen
- **Authenticated** → Bottom Tab Navigator hosting the Mini Apps (Dashboard, Profile)

### Data Flow

```
User Login → dispatch(login(profile)) → Redux Store (authSlice) → AsyncStorage (persist)
                                                ↓
                                    All Mini Apps read via useAppSelector
                                        ├── Dashboard Mini App
                                        └── Profile Mini App
```

## Folder Structure

```
superApp/
├── App.tsx                              # Entry point - Provider wrappers (Redux, Persist, Navigation)
├── src/
│   ├── app/
│   │   ├── store.ts                     # Redux store config with redux-persist
│   │   └── hooks.ts                     # Typed useAppSelector & useAppDispatch hooks
│   ├── features/
│   │   └── auth/
│   │       ├── authSlice.ts             # Auth Redux slice (login/logout reducers)
│   │       └── types.ts                 # UserProfile & AuthState TypeScript interfaces
│   ├── miniApps/
│   │   ├── profile/
│   │   │   └── ProfileScreen.tsx        # Profile Mini App - displays user info + logout
│   │   └── dashboard/
│   │       └── DashboardScreen.tsx      # Dashboard Mini App - welcome & role-based message
│   ├── screens/
│   │   └── LoginScreen.tsx              # Login screen with hardcoded mock authentication
│   └── navigation/
│       └── AppNavigator.tsx             # Conditional auth flow & bottom tab navigation
├── app.json                             # Expo configuration
├── package.json
└── tsconfig.json
```

### Design Rationale

- **`src/app/`** — Centralized store and hooks, following the official Redux Toolkit recommended structure
- **`src/features/`** — Feature-based grouping (auth slice, types) for scalability
- **`src/miniApps/`** — Each Mini App is isolated in its own folder, making it easy to add or remove modules
- **`src/screens/`** — Container-level screens (Login) that are not Mini Apps
- **`src/navigation/`** — Navigation logic separated from UI components

## State Management

### Redux Toolkit

The app uses **Redux Toolkit** with a single `authSlice` to manage authentication state globally.

**Store structure:**

```typescript
{
  auth: {
    user: UserProfile | null;   // Logged-in user's profile
    isAuthenticated: boolean;   // Authentication status
  }
}
```

**UserProfile interface:**

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user';
}
```

**Auth Slice** (`src/features/auth/authSlice.ts`) provides two reducers:

- `login(state, action: PayloadAction<UserProfile>)` — Sets the user profile and marks as authenticated
- `logout(state)` — Clears the user profile and marks as unauthenticated

### Typed Hooks

Typed hooks (`useAppSelector`, `useAppDispatch`) are defined in `src/app/hooks.ts` and used throughout the app to ensure full TypeScript type safety when reading state or dispatching actions.

### State Persistence

The auth state is persisted to device storage using `redux-persist` with `@react-native-async-storage/async-storage`. This means:

- Users remain logged in after closing and reopening the app
- Logging out clears both the Redux state and persisted storage
- The `PersistGate` component in `App.tsx` ensures the app waits for state rehydration before rendering

### Why This Approach

- **Single source of truth** — One Redux store shared across all Mini Apps
- **Predictable state updates** — Redux's unidirectional data flow ensures consistency
- **Type safety** — TypeScript interfaces + typed hooks prevent runtime errors
- **Persistence** — `redux-persist` provides seamless session management
- **Scalability** — New slices can be added independently for new Mini App features

## How to Add New Mini Apps

Adding a new Mini App to the SuperApp requires just 3 steps:

### Step 1: Create the Mini App

Create a new folder under `src/miniApps/` with your screen component:

```
src/miniApps/settings/
└── SettingsScreen.tsx
```

### Step 2: Build the Screen Component

Use the shared typed hooks to access global state:

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useAppSelector } from '../../app/hooks';

export default function SettingsScreen() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <View>
      <Text>Settings for {user?.name}</Text>
    </View>
  );
}
```

### Step 3: Register in Navigation

Add a new `Tab.Screen` in `src/navigation/AppNavigator.tsx`:

```tsx
import SettingsScreen from '../miniApps/settings/SettingsScreen';

// Inside MiniAppTabs component:
<Tab.Screen
  name="Settings"
  component={SettingsScreen}
  options={{
    title: 'Settings',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="settings-outline" size={size} color={color} />
    ),
  }}
/>
```

### Optional: Add Mini App-Specific State

If the new Mini App needs its own state:

1. Create a new slice in `src/features/<featureName>/`
2. Add the reducer to the store in `src/app/store.ts`

```typescript
// src/app/store.ts
import settingsReducer from '../features/settings/settingsSlice';

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    settings: settingsReducer,  // Add new reducer here
  },
});
```

## Assumptions

- **Mock authentication**: No backend is used. Three hardcoded user accounts are provided for testing different roles (superadmin, admin, user).
- **Persistent session**: Auth state is persisted to device storage via `redux-persist` and `AsyncStorage`. Users remain logged in across app restarts.
- **Expo managed workflow**: The app uses Expo's managed workflow for simplicity. No native module configuration is required.
- **Functional components only**: All components use React functional components with hooks, as required by the assignment.
- **Minimal UI styling**: The focus is on architecture, state management, and modularity rather than pixel-perfect UI design.

## Tech Stack

| Technology                | Purpose                         |
| ------------------------- | ------------------------------- |
| React Native (Expo)       | Mobile framework                |
| TypeScript                | Type-safe development           |
| Redux Toolkit             | Global state management         |
| redux-persist             | State persistence               |
| AsyncStorage              | Device storage for persistence  |
| React Navigation          | Screen navigation               |
| @expo/vector-icons        | Tab bar icons                   |

## Demo Accounts

| Email            | Password | Role       |
| ---------------- | -------- | ---------- |
| superadmin@a.com | password | superadmin |
| admin@a.com      | password | admin      |
| user@a.com       | password | user       |
