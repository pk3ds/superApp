<div align="center">

<img src="https://www.tmone.com.my/wp-content/uploads/2026/02/RGB-TM80-TMOne-Lockup.svg" height="80" alt="TM One Logo" />

<br/><br/><br/><br/><br/>

# **SuperApp Framework**

### **React Native (Expo)**

<br/><br/><br/><br/><br/><br/>

</div>

---

## Version History

| Version | Date       | Page No | Description of Changes | Author                           |
| ------- | ---------- | ------- | ---------------------- | -------------------------------- |
| 1.0     | 05/03/2026 | All     | Initial Document       | Muhammad Amirul Aiman Bin Azhari |

---

## Cross References

The enclosed document cross refers the following documents:

| Document Ref. No | Document Name |
| ---------------- | ------------- |
| —                | —             |

---

## Distribution

The enclosed document should be distributed to:

| Department Name / Position |
| -------------------------- |
| TM ONE Division Integrated Operation Center / Network Operation Center |
| TM ONE Division Technology Delivery / Technology Engineer |
| TM One Division Product Innovation |

---

## Contents

1. [Overview](#1-overview)
   - [1.1 Application Objectives](#11-application-objectives)
   - [1.2 Tech Stack](#12-tech-stack)
2. [Setup Instructions](#2-setup-instructions)
   - [2.1 Prerequisites](#21-prerequisites)
   - [2.2 Installation](#22-installation)
   - [2.3 Running on Specific Platforms](#23-running-on-specific-platforms)
3. [Architecture](#3-architecture)
   - [3.1 Container App](#31-container-app)
   - [3.2 Shared Authentication Service](#32-shared-authentication-service)
   - [3.3 Mini Apps](#33-mini-apps)
   - [3.4 Navigation](#34-navigation)
   - [3.5 Data Flow](#35-data-flow)
4. [Folder Structure](#4-folder-structure)
5. [State Management](#5-state-management)
   - [5.1 Redux Toolkit](#51-redux-toolkit)
   - [5.2 Slices](#52-slices)
   - [5.3 Typed Hooks](#53-typed-hooks)
   - [5.4 State Persistence](#54-state-persistence)
6. [How to Add New Mini Apps](#6-how-to-add-new-mini-apps)
   - [6.1 Create the Mini App Screen](#61-create-the-mini-app-screen)
   - [6.2 Build the Screen Component](#62-build-the-screen-component)
   - [6.3 Register in AppNavigator](#63-register-in-appnavigator)
   - [6.4 Add Mini App-Specific State (Optional)](#64-add-mini-app-specific-state-optional)
7. [Initiatives](#7-initiatives-beyond-assignment-scope)
   - [7.1 Geomatics Mini App](#71-geomatics-mini-app-map-view)
   - [7.2 Shop Mini App](#72-shop-mini-app)
   - [7.3 Role-Based Access Control (RBAC)](#73-role-based-access-control-rbac)
   - [7.4 Persistent Login Session](#74-persistent-login-session-redux-persist)
   - [7.5 Enhanced UI](#75-enhanced-ui)
8. [Assumptions](#8-assumptions)
9. [Demo Accounts](#9-demo-accounts)

---

## 1. Overview

A modular SuperApp mobile application built with React Native (Expo) that supports multiple Mini Apps under a single container with shared authentication.

### 1.1 Application Objectives

- Provide a single container app hosting multiple self-contained Mini Apps
- Centralise authentication and user session management via Redux
- Enforce role-based access control at the navigation and feature level
- Demonstrate extensible architecture for adding new Mini Apps with minimal boilerplate

### 1.2 Tech Stack

| Technology           | Purpose                                       |
| -------------------- | --------------------------------------------- |
| React Native (Expo)  | Mobile framework                              |
| TypeScript           | Type-safe development                         |
| Redux Toolkit        | Global state management                       |
| redux-persist        | State persistence across restarts             |
| AsyncStorage         | Device storage for persistence                |
| React Navigation     | Screen navigation (stack + bottom tabs)       |
| @expo/vector-icons   | Tab bar and UI icons                          |
| expo-location        | GPS location for map centering _[Initiative]_ |
| react-native-webview | Leaflet map rendering _[Initiative]_          |

---

## 2. Setup Instructions

### 2.1 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo Go app on your phone (for physical device testing) or an iOS/Android simulator

### 2.2 Installation

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

### 2.3 Running on Specific Platforms

```bash
npm run android    # Start on Android
npm run ios        # Start on iOS
npm run web        # Start on Web
```

---

## 3. Architecture

The app follows a **SuperApp container architecture** with the following layers:

### 3.1 Container App

The root application (`App.tsx`) initialises and wraps all providers:

- **Redux Provider** — Makes the global store available to all components
- **PersistGate** — Delays rendering until persisted state is rehydrated from AsyncStorage
- **NavigationContainer** — Provides the navigation context for React Navigation

### 3.2 Shared Authentication Service

Authentication state is managed centrally via Redux Toolkit. All Mini Apps access the same global store through typed hooks (`useAppSelector`, `useAppDispatch`), ensuring a single source of truth for user data. Session persistence is handled by `redux-persist` with `AsyncStorage`, so users remain logged in across app restarts.

### 3.3 Mini Apps

Self-contained feature modules located in `src/miniApps/`. Each Mini App is a standalone screen (or set of screens) that accesses shared state through Redux hooks. Mini Apps are decoupled from each other and only depend on the shared store.

**Required Mini Apps:**

- **Dashboard** — Welcome message and role-based content
- **Profile** — Displays logged-in user information with logout

**Additional Mini Apps (see Initiatives):**

- **Geomatics (Map View)** — Interactive map showing nearby TM work locations
- **Shop** — Product catalogue with cart, orders, search, and role-based product management

### 3.4 Navigation

Uses React Navigation with conditional rendering:

- **Unauthenticated** → Native Stack with Login screen
- **Authenticated** → Bottom Tab Navigator hosting the Mini Apps

Role-based tab visibility: the **Maps** tab is hidden for the `user` role and only visible to `admin` and `superadmin`.

The **Shop** tab uses a nested stack navigator (`ShopHome → Cart → Orders → AddProduct`) to support in-tab screen transitions without affecting the bottom tab bar.

### 3.5 Data Flow

```
User Login → dispatch(login(profile)) → Redux Store (authSlice) → AsyncStorage (persist)
                                                ↓
                                    All Mini Apps read via useAppSelector
                                        ├── Dashboard Mini App
                                        ├── Profile Mini App
                                        ├── Geomatics Mini App (admin/superadmin only)
                                        └── Shop Mini App
                                              ├── productsSlice (catalogue, persisted)
                                              ├── cartSlice (cart items, cleared on logout)
                                              └── ordersSlice (order history, reset on logout)
```

---

## 4. Folder Structure

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
│   │   ├── geomatics/                        # [Initiative] Geomatics feature state
│   │   │   ├── geomaticsSlice.ts             # Location & map settings Redux slice
│   │   │   ├── types.ts                      # Coordinate, MapSettings TypeScript interfaces
│   │   │   └── index.ts                      # Barrel export
│   │   ├── cart/                             # [Initiative] Shopping cart state
│   │   │   └── cartSlice.ts                  # Cart Redux slice (add/remove/update/clear)
│   │   ├── products/                         # [Initiative] Product catalogue state
│   │   │   └── productsSlice.ts              # Products Redux slice (add/update/remove)
│   │   └── orders/                           # [Initiative] Order history state
│   │       └── ordersSlice.ts                # Orders Redux slice (placeOrder/cancelOrder)
│   ├── miniApps/
│   │   ├── dashboard/
│   │   │   └── DashboardScreen.tsx           # Dashboard — welcome message & role-based content
│   │   ├── profile/
│   │   │   └── ProfileScreen.tsx             # Profile — user info & logout
│   │   ├── geomatics/                        # [Initiative] Geomatics Mini App
│   │   │   ├── MapViewScreen.tsx             # Interactive map with TM work locations
│   │   │   ├── workLocations.ts              # Static TM location data
│   │   │   └── index.ts                      # Barrel export
│   │   └── shop/                             # [Initiative] Shop Mini App
│   │       ├── ShopScreen.tsx                # Product listing with search & role-based actions
│   │       ├── CartScreen.tsx                # Cart view with quantity controls & checkout
│   │       ├── OrdersScreen.tsx              # Order history with status badges & cancel
│   │       └── AddProductScreen.tsx          # Add / Edit product form (admin/superadmin)
│   ├── screens/
│   │   └── LoginScreen.tsx                   # Login screen with mock authentication
│   └── navigation/
│       └── AppNavigator.tsx                  # Auth flow, bottom tabs, role-based tab visibility
├── app.json                                  # Expo configuration
├── package.json
└── tsconfig.json
```

---

## 5. State Management

### 5.1 Redux Toolkit

The app uses **Redux Toolkit** with five slices managing different domains of global state.

**Store structure:**

```typescript
{
  auth: {
    user: UserProfile | null;        // Logged-in user's profile
    isAuthenticated: boolean;        // Authentication status
  },
  geomatics: {                       // [Initiative]
    currentLocation: Coordinate | null; // User's current GPS position
    mapSettings: MapSettings;        // Map type (standard/satellite/hybrid)
  },
  products: {                        // [Initiative]
    items: Product[];                // Product catalogue (persisted)
  },
  cart: {                            // [Initiative]
    items: CartItem[];               // Active cart items (cleared on logout)
  },
  orders: {                          // [Initiative]
    items: Order[];                  // Order history (reset on logout)
    nextNumber: number;              // Auto-incrementing order number counter
  }
}
```

**UserProfile interface (as per assignment):**

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "user";
}
```

### 5.2 Slices

**`authSlice`** (`src/features/auth/authSlice.ts`)

- `login(profile)` — Sets the user and marks as authenticated
- `logout()` — Clears the user and marks as unauthenticated

**`geomaticsSlice`** (`src/features/geomatics/geomaticsSlice.ts`) — _[Initiative]_

- `setCurrentLocation(coordinate)` — Updates the user's current GPS position
- `updateMapSettings(settings)` — Updates map display settings (type, zoom, etc.)

**`productsSlice`** (`src/features/products/productsSlice.ts`) — _[Initiative]_

- `addProduct(product)` — Adds a new product to the catalogue
- `updateProduct(product)` — Updates an existing product by id
- `removeProduct(id)` — Removes a product from the catalogue

**`cartSlice`** (`src/features/cart/cartSlice.ts`) — _[Initiative]_

- `addToCart(item)` — Adds item or increments quantity if already in cart
- `updateQuantity({ id, quantity })` — Updates quantity; removes item if quantity reaches 0
- `removeFromCart(id)` — Removes item from cart
- `clearCart()` — Empties the cart
- Automatically clears on `logout` via `extraReducers`

**`ordersSlice`** (`src/features/orders/ordersSlice.ts`) — _[Initiative]_

- `placeOrder({ items, total })` — Creates a new order with auto-incremented order number and `pending` status
- `cancelOrder(id)` — Cancels a `pending` order (no-op on other statuses)
- Automatically resets to seed orders on `logout` via `extraReducers`
- Seeded with 2 past demo orders (ORD-0001 Completed, ORD-0002 Processing)

### 5.3 Typed Hooks

Typed hooks (`useAppSelector`, `useAppDispatch`) in `src/app/hooks.ts` ensure full TypeScript type safety when reading state or dispatching actions.

### 5.4 State Persistence

| Slice       | Persisted | Notes                                          |
| ----------- | :-------: | ---------------------------------------------- |
| `auth`      |    ✅     | Session survives app restarts                  |
| `geomatics` |    ❌     | Resets on restart (location is live data)      |
| `products`  |    ✅     | Admin-added products survive app restarts      |
| `cart`      |    ✅     | Survives restarts; **cleared on logout**       |
| `orders`    |    ✅     | Survives restarts; **reset to seed on logout** |

---

## 6. How to Add New Mini Apps

Adding a new Mini App requires 3 steps.

### 6.1 Create the Mini App Screen

```
src/miniApps/<featureName>/
└── <Feature>Screen.tsx
```

### 6.2 Build the Screen Component

Use the shared typed hooks to access global state:

```tsx
import React from "react";
import { View, Text } from "react-native";
import { useAppSelector } from "../../app/hooks";

export default function MyFeatureScreen() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <View>
      <Text>Hello, {user?.name}</Text>
    </View>
  );
}
```

### 6.3 Register in AppNavigator

In `src/navigation/AppNavigator.tsx`, add a `Tab.Screen` inside `MiniAppTabs`:

```tsx
import MyFeatureScreen from "../miniApps/myFeature/MyFeatureScreen";

<Tab.Screen
  name="MyFeature"
  component={MyFeatureScreen}
  options={{
    title: "My Feature",
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="star-outline" size={size} color={color} />
    ),
  }}
/>;
```

### 6.4 Add Mini App-Specific State (Optional)

1. Create `src/features/<featureName>/featureSlice.ts`
2. Register it in `src/app/store.ts`:

```typescript
import featureReducer from "../features/featureName/featureSlice";

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    feature: featureReducer,
  },
});
```

---

## 7. Initiatives (Beyond Assignment Scope)

### 7.1 Geomatics Mini App (Map View)

An interactive map screen displaying nearby TM work locations:

- Map style switching (Standard / Satellite / Hybrid) via Leaflet in a WebView
- User location dot with auto-centering
- TM office markers with distance calculation (Haversine formula)
- Draggable bottom sheet listing locations sorted by distance
- Tap navigate icon → opens Apple Maps / Google Maps / Waze

### 7.2 Shop Mini App

A product catalogue featuring TM One solutions with a full frontend cart and order management implementation:

- **Product listing** — 10 TM One solutions (Network, Cloud, Cybersecurity, Smart Services, etc.) with mocked RM pricing
- **Search** — Real-time filter by product name or category
- **Cart** — Add to cart from product listing; floating cart FAB with live badge count
- **Cart screen** — Quantity controls (`+`/`-`), remove items, subtotal, clear cart, checkout
- **Checkout** — Confirms order details, places order to `ordersSlice`, clears cart, and navigates to Orders
- **Cart auto-clear** — Cart is wiped on logout so each user starts fresh
- **Order history** — Receipt icon in Shop header navigates to My Orders screen
- **Orders screen** — Lists all orders with color-coded status badges (Pending / Processing / Shipped / Completed / Cancelled), item icons, totals, and per-order cancel button for pending orders
- **Product management** (admin/superadmin only):
  - `+` button in header to add new products
  - Edit (pencil) and Remove (trash) buttons on each product card
  - Shared Add/Edit form with name, category, price, and icon picker
  - Added/edited products persist across app restarts via `redux-persist`

### 7.3 Role-Based Access Control (RBAC)

A basic RBAC system implemented at the navigation level using the authenticated user's `role` field from the Redux store:

| Tab / Mini App | `superadmin` | `admin` | `user` |
| -------------- | :----------: | :-----: | :----: |
| Dashboard      |      ✅      |   ✅    |   ✅   |
| Maps           |      ✅      |   ✅    |   ❌   |
| Shop           |      ✅      |   ✅    |   ✅   |
| Profile        |      ✅      |   ✅    |   ✅   |

| Shop Feature    | `superadmin` | `admin` | `user` |
| --------------- | :----------: | :-----: | :----: |
| Browse & Search |      ✅      |   ✅    |   ✅   |
| Add to Cart     |      ✅      |   ✅    |   ✅   |
| Checkout        |      ✅      |   ✅    |   ✅   |
| View Orders     |      ✅      |   ✅    |   ✅   |
| Cancel Order    |      ✅      |   ✅    |   ✅   |
| Add Product     |      ✅      |   ✅    |   ❌   |
| Edit Product    |      ✅      |   ✅    |   ❌   |
| Remove Product  |      ✅      |   ✅    |   ❌   |

### 7.4 Persistent Login Session (redux-persist)

The assignment requires login/logout but does not specify that the session must survive app restarts. This app uses `redux-persist` with `AsyncStorage` to persist auth state, so users remain logged in after closing and reopening the app without re-entering credentials.

```typescript
const authPersistConfig = { key: "auth", storage: AsyncStorage };
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
```

### 7.5 Enhanced UI

- Password visibility toggle on the Login screen
- Time-aware greeting on the Dashboard (Good morning / afternoon / evening)
- Role description cards with quick action shortcuts on the Dashboard:
  - **Profile** — visible to all roles
  - **Maps** — visible to `admin` and `superadmin` only (mirrors tab visibility)
  - **Shop** — visible to all roles
  - **Help** — visible to all roles

---

## 8. Assumptions

- **Mock authentication** — No backend is used. Three hardcoded accounts are provided for testing different roles.
- **Expo managed workflow** — Uses Expo's managed workflow. No native module configuration is required.
- **Functional components only** — All components use React functional components with hooks, as required by the assignment.
- **TM work locations are static** — The list of company locations in the Geomatics Mini App is hardcoded in `src/miniApps/geomatics/workLocations.ts` and does not fetch from a live API.
- **Shop has no backend** — Product catalogue, cart, and orders are managed entirely in Redux with local persistence. Orders are frontend-only; no payment processing or real fulfilment occurs.

---

## 9. Demo Accounts

| Email            | Password | Role       | Maps Access | Shop Management |
| ---------------- | -------- | ---------- | :---------: | :-------------: |
| superadmin@a.com | password | superadmin |     ✅      |       ✅        |
| admin@a.com      | password | admin      |     ✅      |       ✅        |
| user@a.com       | password | user       |     ❌      |       ❌        |
