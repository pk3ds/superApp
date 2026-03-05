import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAppDispatch } from '../../app/hooks';
import { addProduct, updateProduct, Product } from '../../features/products/productsSlice';

type RouteParams = {
  AddProduct: { product?: Product };
};

const ICON_OPTIONS: { icon: string; label: string }[] = [
  { icon: 'git-network-outline', label: 'Network' },
  { icon: 'cloud-outline', label: 'Cloud' },
  { icon: 'chatbubbles-outline', label: 'Comms' },
  { icon: 'shield-outline', label: 'Security' },
  { icon: 'desktop-outline', label: 'Workplace' },
  { icon: 'wifi-outline', label: 'Wireless' },
  { icon: 'medkit-outline', label: 'Health' },
  { icon: 'lock-closed-outline', label: 'Endpoint' },
  { icon: 'business-outline', label: 'Smart City' },
  { icon: 'server-outline', label: 'Data Centre' },
  { icon: 'analytics-outline', label: 'Analytics' },
  { icon: 'globe-outline', label: 'Internet' },
];

export default function AddProductScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'AddProduct'>>();

  const existing = route.params?.product;
  const isEdit = !!existing;

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit Product' : 'Add Product' });
  }, [navigation, isEdit]);

  const [name, setName] = useState(existing?.name ?? '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [price, setPrice] = useState(existing?.price?.toString() ?? '');
  const [selectedIcon, setSelectedIcon] = useState(existing?.icon ?? ICON_OPTIONS[0].icon);

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Validation', 'Product name is required.');
      return;
    }
    if (!category.trim()) {
      Alert.alert('Validation', 'Category is required.');
      return;
    }
    const parsedPrice = parseFloat(price);
    if (!price || isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Validation', 'Enter a valid price.');
      return;
    }

    if (isEdit && existing) {
      dispatch(
        updateProduct({
          id: existing.id,
          name: name.trim(),
          category: category.trim(),
          price: parsedPrice,
          icon: selectedIcon,
        })
      );
    } else {
      dispatch(
        addProduct({
          name: name.trim(),
          category: category.trim(),
          price: parsedPrice,
          icon: selectedIcon,
        })
      );
    }
    navigation.goBack();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <Text style={styles.label}>Product Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Managed SD-WAN"
            value={name}
            onChangeText={setName}
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Network Services"
            value={category}
            onChangeText={setCategory}
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Price (RM)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1200.00"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconGrid}>
            {ICON_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.icon}
                style={[
                  styles.iconOption,
                  selectedIcon === opt.icon && styles.iconOptionSelected,
                ]}
                onPress={() => setSelectedIcon(opt.icon)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={24}
                  color={selectedIcon === opt.icon ? '#3333CC' : '#999'}
                />
                <Text
                  style={[
                    styles.iconLabel,
                    selectedIcon === opt.icon && styles.iconLabelSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Ionicons
            name={isEdit ? 'checkmark-circle-outline' : 'add-circle-outline'}
            size={20}
            color="#fff"
          />
          <Text style={styles.saveBtnText}>{isEdit ? 'Save Changes' : 'Add Product'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: '22%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  iconOptionSelected: {
    borderColor: '#3333CC',
    backgroundColor: '#3333CC0D',
  },
  iconLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  iconLabelSelected: {
    color: '#3333CC',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#3333CC',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
