import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from '../features/auth/authSlice';
import geomaticsReducer from '../features/geomatics/geomaticsSlice';
import cartReducer from '../features/cart/cartSlice';
import productsReducer from '../features/products/productsSlice';
import ordersReducer from '../features/orders/ordersSlice';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
};

const cartPersistConfig = {
  key: 'cart',
  storage: AsyncStorage,
};

const productsPersistConfig = {
  key: 'products',
  storage: AsyncStorage,
};

const ordersPersistConfig = {
  key: 'orders',
  storage: AsyncStorage,
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedCartReducer = persistReducer(cartPersistConfig, cartReducer);
const persistedProductsReducer = persistReducer(productsPersistConfig, productsReducer);
const persistedOrdersReducer = persistReducer(ordersPersistConfig, ordersReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    geomatics: geomaticsReducer,
    cart: persistedCartReducer,
    products: persistedProductsReducer,
    orders: persistedOrdersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
