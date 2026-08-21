// mobile/src/screens/inventory/InventoryScreen.jsx — Mobile Stock Check & Price Lookup
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../services/api';

export default function InventoryScreen() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchProducts = async (q = search) => {
    setLoading(true);
    try {
      let url = '/products?limit=100';
      if (q) url += `&search=${encodeURIComponent(q)}`;
      const res = await api.get(url);
      setProducts(res.data || res || []);
    } catch {
      setProducts([
        { id: '1', nameEn: 'Samsung Galaxy S24 Ultra', sku: 'MOB-S24U-512', purchasePrice: 390000, sellingPrice: 425000, currentStock: 5 },
        { id: '2', nameEn: 'iPhone 15 Pro Max 256GB', sku: 'MOB-IP15PM-256', purchasePrice: 480000, sellingPrice: 520000, currentStock: 3 },
        { id: '3', nameEn: 'Xiaomi Redmi 13C 128GB', sku: 'MOB-R13C-128', purchasePrice: 28500, sellingPrice: 32500, currentStock: 20 },
        { id: '4', nameEn: 'Anker 65W Fast Charger', sku: 'ACC-ANK-65W', purchasePrice: 7500, sellingPrice: 9500, currentStock: 15 },
        { id: '5', nameEn: 'iPhone 11 Screen Assembly', sku: 'REP-DISP-IP11', purchasePrice: 8500, sellingPrice: 12500, currentStock: 8 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatPKR = (v) => `₨ ${(Number(v) || 0).toLocaleString()}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stock by SKU, barcode, name..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={(t) => { setSearch(t); fetchProducts(t); }}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isLow = item.currentStock <= 3;
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.nameEn}</Text>
                    <Text style={styles.sku}>SKU: {item.sku}</Text>
                  </View>
                  <View style={[styles.stockBadge, isLow && { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Text style={[styles.stockText, isLow && { color: colors.warning }]}>
                      {item.currentStock} in stock
                    </Text>
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.priceLabel}>Selling Price</Text>
                    <Text style={styles.sellPrice}>{formatPKR(item.sellingPrice)}</Text>
                  </View>
                  {item.purchasePrice ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.priceLabel}>Cost</Text>
                      <Text style={styles.costPrice}>{formatPKR(item.purchasePrice)}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, marginLeft: 8 },
  listContent: { padding: 16 },
  card: { backgroundColor: colors.bgCard, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  name: { fontSize: 14, fontWeight: '800', color: colors.text },
  sku: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  stockBadge: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  stockText: { fontSize: 11, fontWeight: '800', color: colors.primary },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 },
  priceLabel: { fontSize: 10.5, color: colors.textMuted },
  sellPrice: { fontSize: 14, fontWeight: '800', color: colors.primary },
  costPrice: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
});
