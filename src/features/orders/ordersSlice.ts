import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { logout } from '../auth/authSlice';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  icon: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ord-1',
    orderNumber: 'ORD-0001',
    items: [
      { id: '1', name: 'Managed SD-WAN', price: 1200.0, quantity: 1, category: 'Network Services', icon: 'git-network-outline' },
      { id: '2', name: 'Cloud Alpha Edge', price: 3500.0, quantity: 1, category: 'Cloud Services', icon: 'cloud-outline' },
    ],
    total: 4700.0,
    status: 'completed',
    createdAt: '2026-01-15T09:30:00.000Z',
  },
  {
    id: 'ord-2',
    orderNumber: 'ORD-0002',
    items: [
      { id: '4', name: 'Network Security Services', price: 2200.0, quantity: 2, category: 'Cybersecurity', icon: 'shield-outline' },
    ],
    total: 4400.0,
    status: 'processing',
    createdAt: '2026-02-20T14:15:00.000Z',
  },
];

interface OrdersState {
  items: Order[];
  nextNumber: number;
}

const initialState: OrdersState = {
  items: DEFAULT_ORDERS,
  nextNumber: 3,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    placeOrder(state, action: PayloadAction<{ items: OrderItem[]; total: number }>) {
      const num = state.nextNumber.toString().padStart(4, '0');
      state.items.unshift({
        id: `ord-${Date.now()}`,
        orderNumber: `ORD-${num}`,
        items: action.payload.items,
        total: action.payload.total,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      state.nextNumber += 1;
    },
    cancelOrder(state, action: PayloadAction<string>) {
      const order = state.items.find((o) => o.id === action.payload);
      if (order && order.status === 'pending') {
        order.status = 'cancelled';
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.items = DEFAULT_ORDERS;
      state.nextNumber = 3;
    });
  },
});

export const { placeOrder, cancelOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
