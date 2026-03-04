# SuperApp Framework (React Native)

A modular SuperApp mobile application built with React Native (Expo) that supports multiple Mini Apps under a single container with shared authentication.

---

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

---

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

**Required Mini Apps:**
- **Dashboard** — Welcome message and role-based content
- **Profile** — Displays logged-in user information with logout

**Additional Mini Apps (see Initiatives):**
- **Geomatics (Map View)** — Interactive map showing nearby TM work locations

### 4. Navigation

Uses React Navigation with conditional rendering:

- **Unauthenticated** → Native Stack with Login screen
- **Authenticated** → Bottom Tab Navigator hosting the Mini Apps

Role-based tab visibility: the **Maps** tab is hidden for the `user` role and only visible to `admin` and `superadmin`.

### Data Flow

```
User Login → dispatch(login(profile)) → Redux Store (authSlice) → AsyncStorage (persist)
                                                ↓
                                    All Mini Apps read via useAppSelector
                                        ├── Dashboard Mini App
                                        ├── Profile Mini App
                                        └── Geomatics Mini App (admin/superadmin only)
```

---

## Folder Structure

```
superApp/
├── App.tsx                                   # Entry point — Provider wrappers (Redux, Persist, Navigation)
├── src/
│   ├── app/
│   │   ├── store.ts                          # Redux store config with redux-persist
│   │   └── hooks.ts                          # Typed useAppSelector & useAppDispatch hooks
│   ├── features/
│   │   ├── auth/
│   │   │   ├── authSlice.ts                  # Auth Redux slice (login/logout reducers)
│   │   │   └── types.ts                      # UserProfile & AuthState TypeScript interfaces
│   │   └── geomatics/                        # [Initiative] Geomatics feature state
│   │       ├── geomaticsSlice.ts             # Location & map settings Redux slice
│   │       ├── types.ts                      # Coordinate, MapSettings TypeScript interfaces
│   │       └── index.ts                      # Barrel export
│   ├── miniApps/
│   │   ├── dashboard/
│   │   │   └── DashboardScreen.tsx           # Dashboard — welcome message & role-based content
│   │   ├── profile/
│   │   │   └── ProfileScreen.tsx             # Profile — user info & logout
│   │   └── geomatics/                        # [Initiative] Geomatics Mini App
│   │       ├── MapViewScreen.tsx             # Interactive map with TM work locations
│   │       ├── workLocations.ts              # Static TM location data
│   │       └── index.ts                      # Barrel export
│   ├── screens/
│   │   └── LoginScreen.tsx                   # Login screen with mock authentication
│   └── navigation/
│       └── AppNavigator.tsx                  # Auth flow, bottom tabs, role-based tab visibility
├── app.json                                  # Expo configuration
├── package.json
└── tsconfig.json
```

---

## State Management

### Redux Toolkit

The app uses **Redux Toolkit** with two slices managing different domains of global state.

**Store structure:**

```typescript
{
  auth: {
    user: UserProfile | null;   // Logged-in user's profile
    isAuthenticated: boolean;   // Authentication status
  },
  geomatics: {                  // [Initiative]
    currentLocation: Coordinate | null; // User's current GPS position
    mapSettings: MapSettings;   // Map type (standard/satellite/hybrid)
  }
}
```

**UserProfile interface (as per assignment):**

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'user';
}
```

### Slices

**`authSlice`** (`src/features/auth/authSlice.ts`)
- `login(profile)` — Sets the user and marks as authenticated
- `logout()` — Clears the user and marks as unauthenticated

**`geomaticsSlice`** (`src/features/geomatics/geomaticsSlice.ts`) — *[Initiative]*
- `setCurrentLocation(coordinate)` — Updates the user's current GPS position
- `updateMapSettings(settings)` — Updates map display settings (type, zoom, etc.)

### Typed Hooks

Typed hooks (`useAppSelector`, `useAppDispatch`) in `src/app/hooks.ts` ensure full TypeScript type safety when reading state or dispatching actions.

### State Persistence

The `auth` slice is persisted to device storage using `redux-persist` with `AsyncStorage`:

- Users remain logged in after closing and reopening the app
- Logging out clears both the Redux store and persisted storage
- `PersistGate` in `App.tsx` ensures state rehydration before rendering

---

## How to Add New Mini Apps

Adding a new Mini App requires 3 steps.

### Step 1: Create the Mini App screen

```
src/miniApps/<featureName>/
└── <Feature>Screen.tsx
```

### Step 2: Build the screen component

Use the shared typed hooks to access global state:

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useAppSelector } from '../../app/hooks';

export default function MyFeatureScreen() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <View>
      <Text>Hello, {user?.name}</Text>
    </View>
  );
}
```

### Step 3: Register in AppNavigator

In `src/navigation/AppNavigator.tsx`, add a `Tab.Screen` inside `MiniAppTabs`:

```tsx
import MyFeatureScreen from '../miniApps/myFeature/MyFeatureScreen';

<Tab.Screen
  name="MyFeature"
  component={MyFeatureScreen}
  options={{
    title: 'My Feature',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="star-outline" size={size} color={color} />
    ),
  }}
/>
```

### Optional: Add Mini App-specific state

1. Create `src/features/<featureName>/featureSlice.ts`
2. Register it in `src/app/store.ts`:

```typescript
import featureReducer from '../features/featureName/featureSlice';

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    feature: featureReducer,
  },
});
```

---

## Initiatives (Beyond Assignment Scope)

### 1. Geomatics Mini App (Map View)

An interactive map screen displaying nearby TM work locations:
- Map style switching (Standard / Satellite / Hybrid) via Leaflet in a WebView
- User location dot with auto-centering
- TM office markers with distance calculation (Haversine formula)
- Draggable bottom sheet listing locations sorted by distance
- Tap navigate icon → opens Apple Maps / Google Maps / Waze

### 2. Role-Based Access Control (RBAC)

A basic RBAC system implemented at the navigation level using the authenticated user's `role` field from the Redux store:

| Tab / Mini App | `superadmin` | `admin` | `user` |
| -------------- | :----------: | :-----: | :----: |
| Dashboard      | ✅           | ✅      | ✅     |
| Maps           | ✅           | ✅      | ❌     |
| Profile        | ✅           | ✅      | ✅     |

Only the **Maps** tab is access-restricted. All other Mini Apps are visible to every authenticated role. Enforced in `AppNavigator.tsx`:

```tsx
{userRole !== 'user' && (
  <Tab.Screen name="Maps" component={MapViewScreen} ... />
)}
```

### 3. Persistent Login Session (redux-persist)

The assignment requires login/logout but does not specify that the session must survive app restarts. This app uses `redux-persist` with `AsyncStorage` to persist auth state, so users remain logged in after closing and reopening the app without re-entering credentials.

```typescript
const authPersistConfig = { key: 'auth', storage: AsyncStorage };
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
```

### 4. Enhanced UI

- Password visibility toggle on the Login screen
- Time-aware greeting on the Dashboard (Good morning / afternoon / evening)
- Role description cards with quick action shortcuts on the Dashboard

---

## Assumptions

- **Mock authentication** — No backend is used. Three hardcoded accounts are provided for testing different roles.
- **Expo managed workflow** — Uses Expo's managed workflow. No native module configuration is required.
- **Functional components only** — All components use React functional components with hooks, as required by the assignment.
- **TM work locations are static** — The list of company locations in the Geomatics Mini App is hardcoded in `src/miniApps/geomatics/workLocations.ts` and does not fetch from a live API.

---

## Tech Stack

| Technology                | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| React Native (Expo)       | Mobile framework                              |
| TypeScript                | Type-safe development                         |
| Redux Toolkit             | Global state management                       |
| redux-persist             | Auth state persistence across restarts        |
| AsyncStorage              | Device storage for persistence                |
| React Navigation          | Screen navigation (stack + bottom tabs)       |
| @expo/vector-icons        | Tab bar and UI icons                          |
| expo-location             | GPS location for map centering *[Initiative]* |
| react-native-webview      | Leaflet map rendering *[Initiative]*          |

---

## Demo Accounts

| Email            | Password | Role       | Maps Access |
| ---------------- | -------- | ---------- | ----------- |
| superadmin@a.com | password | superadmin | Yes         |
| admin@a.com      | password | admin      | Yes         |
| user@a.com       | password | user       | No          |
