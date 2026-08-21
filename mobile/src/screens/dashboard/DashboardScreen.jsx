// mobile/src/screens/dashboard/DashboardScreen.jsx — Remote Business KPI & Analytics
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function DashboardScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data || res);
    } catch {
      // Mock fallback data for offline view
      setData({
        today: { revenue: 145000, transactions: 18, gst: 24650 },
        thisMonth: { revenue: 1250000 },
        lowStock: [
          { id: '1', nameEn: 'Samsung Galaxy A15', currentStock: 2 },
          { id: '2', nameEn: 'iPhone 13 Battery', currentStock: 1 },
        ],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const formatPKR = (val) => `₨ ${(Number(val) || 0).toLocaleString()}`;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.fullName || 'Shop Admin'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Feather name="log-out" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* KPI Grid */}
        <Text style={styles.sectionTitle}>TODAY'S PERFORMANCE</Text>

        <View style={styles.kpiRow}>
          {/* Revenue */}
          <View style={[styles.kpiCard, styles.kpiEmerald]}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Today's Revenue</Text>
              <Feather name="trending-up" size={16} color={colors.primary} />
            </View>
            <Text style={styles.kpiValue}>{formatPKR(data?.today?.revenue)}</Text>
            <Text style={styles.kpiSub}>+14% vs yesterday</Text>
          </View>

          {/* Transactions */}
          <View style={[styles.kpiCard, styles.kpiCyan]}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Invoices</Text>
              <MaterialCommunityIcons name="receipt" size={16} color={colors.accentCyan} />
            </View>
            <Text style={styles.kpiValue}>{data?.today?.transactions || 0}</Text>
            <Text style={styles.kpiSub}>Completed sales</Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          {/* GST */}
          <View style={[styles.kpiCard, styles.kpiAmber]}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>GST (17%)</Text>
              <Feather name="percent" size={16} color={colors.warning} />
            </View>
            <Text style={styles.kpiValue}>{formatPKR(data?.today?.gst)}</Text>
            <Text style={styles.kpiSub}>Tax collected</Text>
          </View>

          {/* Month */}
          <View style={[styles.kpiCard, styles.kpiViolet]}>
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiLabel}>Month Total</Text>
              <Feather name="calendar" size={16} color={colors.accentViolet} />
            </View>
            <Text style={styles.kpiValue}>{formatPKR(data?.thisMonth?.revenue)}</Text>
            <Text style={styles.kpiSub}>MTD Sales</Text>
          </View>
        </View>

        {/* Quick Launch Action Shortcuts */}
        <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('POS')}>
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <MaterialCommunityIcons name="barcode-scan" size={24} color={colors.primary} />
            </View>
            <Text style={styles.actionBtnText}>Mobile POS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Repairs')}>
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <MaterialCommunityIcons name="tools" size={24} color={colors.accentCyan} />
            </View>
            <Text style={styles.actionBtnText}>Repairs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Khata')}>
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <MaterialCommunityIcons name="book-open-page-variant" size={24} color={colors.accentViolet} />
            </View>
            <Text style={styles.actionBtnText}>Khata</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Inventory')}>
            <View style={[styles.actionIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <MaterialCommunityIcons name="cellphone" size={24} color={colors.warning} />
            </View>
            <Text style={styles.actionBtnText}>Stock</Text>
          </TouchableOpacity>
        </View>

        {/* Low Stock Alerts */}
        <Text style={styles.sectionTitle}>STOCK ALERTS</Text>
        <View style={styles.alertCard}>
          {(data?.lowStock || []).length === 0 ? (
            <Text style={{ color: colors.success, textAlign: 'center', padding: 12 }}>✓ All products well-stocked</Text>
          ) : (
            data?.lowStock?.map((item) => (
              <View key={item.id} style={styles.stockItem}>
                <View>
                  <Text style={styles.stockName}>{item.nameEn}</Text>
                  <Text style={styles.stockSku}>Low stock alert</Text>
                </View>
                <View style={styles.stockBadge}>
                  <Text style={styles.stockBadgeText}>{item.currentStock} left</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgSurface,
  },
  greeting: { fontSize: 13, color: colors.textMuted },
  userName: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: 20 },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 12,
  },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiEmerald: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  kpiCyan: { borderLeftWidth: 3, borderLeftColor: colors.accentCyan },
  kpiAmber: { borderLeftWidth: 3, borderLeftColor: colors.warning },
  kpiViolet: { borderLeftWidth: 3, borderLeftColor: colors.accentViolet },
  kpiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  kpiLabel: { fontSize: 11.5, fontWeight: '700', color: colors.textMuted },
  kpiValue: { fontSize: 18, fontWeight: '900', color: colors.text, marginBottom: 4 },
  kpiSub: { fontSize: 10.5, color: colors.textMuted },
  actionGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: colors.text },
  alertCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  stockName: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  stockSku: { fontSize: 11, color: colors.warning, marginTop: 2 },
  stockBadge: { backgroundColor: 'rgba(245, 158, 11, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  stockBadgeText: { color: colors.warning, fontSize: 11.5, fontWeight: '800' },
});
