import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import {
  removeFromCart,
  updateQuantity,
  clearCart,
  CartItem,
} from '../../features/cart/cartSlice';
import { placeOrder } from '../../features/orders/ordersSlice';

function CartRow({ item }: { item: CartItem }) {
  const dispatch = useAppDispatch();

  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={item.icon as any} size={24} color="#3333CC" />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowPrice}>RM {item.price.toFixed(2)}</Text>
      </View>
      <View style={styles.qtyRow}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() =>
            dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))
          }
        >
          <Ionicons name="remove" size={16} color="#3333CC" />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() =>
            dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))
          }
        >
          <Ionicons name="add" size={16} color="#3333CC" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => dispatch(removeFromCart(item.id))}
      >
        <Ionicons name="trash-outline" size={18} color="#e74c3c" />
      </TouchableOpacity>
    </View>
  );
}

export default function CartScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const items = useAppSelector((state) => state.cart.items);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  function handleCheckout() {
    Alert.alert(
      'Place Order',
      `Confirm order of ${itemCount} item${itemCount !== 1 ? 's' : ''} for RM ${total.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Place Order',
          onPress: () => {
            dispatch(
              placeOrder({
                items: items.map((i) => ({
                  id: i.id,
                  name: i.name,
                  price: i.price,
                  quantity: i.quantity,
                  category: i.category,
                  icon: i.icon,
                })),
                total,
              })
            );
            dispatch(clearCart());
            navigation.replace('Orders');
          },
        },
      ]
    );
  }

  function handleClear() {
    Alert.alert('Clear Cart', 'Remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => dispatch(clearCart()),
      },
    ]);
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="cart-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Your cart is empty</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CartRow item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Summary Footer */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {itemCount} item{itemCount !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.total}>RM {total.toFixed(2)}</Text>
        </View>
        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
            <Text style={styles.checkoutBtnText}>Checkout</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
    paddingBottom: 8,
  },
  empty: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#aaa',
  },
  row: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#3333CC18',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowBody: {
    flex: 1,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  rowPrice: {
    fontSize: 13,
    color: '#E85A00',
    marginTop: 3,
    fontWeight: '500',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    gap: 6,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#3333CC18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    minWidth: 20,
    textAlign: 'center',
  },
  deleteBtn: {
    padding: 4,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#888',
  },
  total: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  clearBtn: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  checkoutBtn: {
    flex: 1,
    backgroundColor: '#3333CC',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
