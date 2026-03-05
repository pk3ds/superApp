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
import { useAppSelector, useAppDispatch } from '../../app/hooks';
import { cancelOrder, Order, OrderStatus } from '../../features/orders/ordersSlice';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:    { label: 'Pending',    color: '#F39C12', bg: '#F39C1218' },
  processing: { label: 'Processing', color: '#3333CC', bg: '#3333CC18' },
  shipped:    { label: 'Shipped',    color: '#8E44AD', bg: '#8E44AD18' },
  completed:  { label: 'Completed',  color: '#27AE60', bg: '#27AE6018' },
  cancelled:  { label: 'Cancelled',  color: '#999',    bg: '#99999918' },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function OrderCard({ order }: { order: Order }) {
  const dispatch = useAppDispatch();
  const status = STATUS_CONFIG[order.status];
  const itemSummary = order.items
    .map((i) => (i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name))
    .join(', ');

  function handleCancel() {
    Alert.alert(
      'Cancel Order',
      `Cancel order ${order.orderNumber}?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Order',
          style: 'destructive',
          onPress: () => dispatch(cancelOrder(order.id)),
        },
      ]
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderNum}>{order.orderNumber}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.itemsRow}>
        {order.items.slice(0, 3).map((item) => (
          <View key={item.id} style={styles.itemIcon}>
            <Ionicons name={item.icon as any} size={18} color="#3333CC" />
          </View>
        ))}
        {order.items.length > 3 && (
          <View style={styles.itemIconMore}>
            <Text style={styles.itemIconMoreText}>+{order.items.length - 3}</Text>
          </View>
        )}
        <Text style={styles.itemSummary} numberOfLines={1}>
          {itemSummary}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.totalLabel}>
          {order.items.reduce((s, i) => s + i.quantity, 0)} item
          {order.items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.totalAmount}>RM {order.total.toFixed(2)}</Text>
      </View>

      {order.status === 'pending' && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>Cancel Order</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function OrdersScreen() {
  const orders = useAppSelector((state) => state.orders.items);

  if (orders.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="receipt-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No orders yet</Text>
        <Text style={styles.emptySubText}>Your order history will appear here.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <OrderCard order={item} />}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNum: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#3333CC18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIconMore: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIconMoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
  },
  itemSummary: {
    flex: 1,
    fontSize: 13,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: '#999',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e74c3c',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e74c3c',
  },
  empty: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#aaa',
  },
  emptySubText: {
    fontSize: 13,
    color: '#bbb',
  },
});
