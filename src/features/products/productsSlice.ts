import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  icon: string;
}

const DEFAULT_PRODUCTS: Product[] = [
  { id: '1', name: 'Managed SD-WAN', price: 1200.0, category: 'Network Services', icon: 'git-network-outline' },
  { id: '2', name: 'Cloud Alpha Edge', price: 3500.0, category: 'Cloud Services', icon: 'cloud-outline' },
  { id: '3', name: 'Unified Communication', price: 850.0, category: 'Collaboration', icon: 'chatbubbles-outline' },
  { id: '4', name: 'Network Security Services', price: 2200.0, category: 'Cybersecurity', icon: 'shield-outline' },
  { id: '5', name: 'Digital Workplace', price: 650.0, category: 'Collaboration', icon: 'desktop-outline' },
  { id: '6', name: 'Private Network', price: 4800.0, category: 'Mobile & Wireless', icon: 'wifi-outline' },
  { id: '7', name: 'Smart Healthcare', price: 5500.0, category: 'Smart Services', icon: 'medkit-outline' },
  { id: '8', name: 'Endpoint Security Services', price: 980.0, category: 'Cybersecurity', icon: 'lock-closed-outline' },
  { id: '9', name: 'Smart City', price: 9800.0, category: 'Smart Services', icon: 'business-outline' },
  { id: '10', name: 'Data Centre (Tier III)', price: 7200.0, category: 'Data Centre', icon: 'server-outline' },
];

interface ProductsState {
  items: Product[];
}

const initialState: ProductsState = {
  items: DEFAULT_PRODUCTS,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    addProduct(state, action: PayloadAction<Omit<Product, 'id'>>) {
      const newId = (
        Math.max(0, ...state.items.map((p) => parseInt(p.id, 10))) + 1
      ).toString();
      state.items.push({ id: newId, ...action.payload });
    },
    updateProduct(state, action: PayloadAction<Product>) {
      const index = state.items.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeProduct(state, action: PayloadAction<string>) {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },
  },
});

export const { addProduct, updateProduct, removeProduct } = productsSlice.actions;
export default productsSlice.reducer;
