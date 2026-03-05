import React, { useState, useLayoutEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAppSelector, useAppDispatch } from "../../app/hooks";
import { addToCart } from "../../features/cart/cartSlice";
import { Product, removeProduct } from "../../features/products/productsSlice";

function ProductCard({
  item,
  onAddToCart,
  canManage,
  onEdit,
  onRemove,
}: {
  item: Product;
  onAddToCart: () => void;
  canManage: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon as any} size={32} color="#3333CC" />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.price}>RM {item.price.toFixed(2)}</Text>
      </View>
      <View style={styles.actions}>
        {canManage && (
          <>
            <TouchableOpacity style={styles.editBtn} onPress={onEdit} activeOpacity={0.7}>
              <Ionicons name="pencil-outline" size={16} color="#3333CC" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.removeBtn} onPress={onRemove} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={16} color="#e74c3c" />
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={styles.cartBtn} activeOpacity={0.7} onPress={onAddToCart}>
          <Ionicons name="cart-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ShopScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();

  const products = useAppSelector((state) => state.products.items);
  const cartCount = useAppSelector((state) =>
    state.cart.items.reduce((sum, i) => sum + i.quantity, 0)
  );
  const userRole = useAppSelector((state) => state.auth.user?.role);
  const canAddProduct = userRole === "admin" || userRole === "superadmin";

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [query, products]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Orders")}
            style={{ padding: 4 }}
          >
            <Ionicons name="receipt-outline" size={24} color="#fff" />
          </TouchableOpacity>
          {canAddProduct && (
            <TouchableOpacity
              onPress={() => navigation.navigate("AddProduct")}
              style={{ padding: 4 }}
            >
              <Ionicons name="add-circle-outline" size={26} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      ),
    });
  }, [navigation, canAddProduct]);

  function handleAddToCart(item: Product) {
    dispatch(
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        icon: item.icon,
      })
    );
  }

  function handleRemove(item: Product) {
    Alert.alert(
      'Remove Product',
      `Remove "${item.name}" from the shop?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => dispatch(removeProduct(item.id)),
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products or category..."
          placeholderTextColor="#bbb"
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onAddToCart={() => handleAddToCart(item)}
            canManage={canAddProduct}
            onEdit={() => navigation.navigate("AddProduct", { product: item })}
            onRemove={() => handleRemove(item)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />

      {/* Floating Cart Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("Cart")}
      >
        <Ionicons name="cart-outline" size={26} color="#fff" />
        {cartCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {cartCount > 99 ? "99+" : cartCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#222",
    paddingVertical: 12,
  },
  list: {
    padding: 16,
    paddingBottom: 96,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#3333CC18",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardBody: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },
  category: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  price: {
    fontSize: 15,
    fontWeight: "600",
    color: "#E85A00",
    marginTop: 4,
  },
  actions: {
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#3333CC18",
    justifyContent: "center",
    alignItems: "center",
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#e74c3c18",
    justifyContent: "center",
    alignItems: "center",
  },
  cartBtn: {
    backgroundColor: "#3333CC",
    borderRadius: 10,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E85A00",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E85A00",
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#aaa",
  },
});
