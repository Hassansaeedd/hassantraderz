// mobile/src/screens/pos/POSScreen.jsx — Floor Mobile POS Counter & Digital Receipt Generator
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, Modal, Alert, ActivityIndicator, Linking, ScrollView
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useCartStore } from '../../store/cartStore';

export default function POSScreen() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const [cartVisible, setCartVisible] = useState(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [completedSale, setCompletedSale] = useState(null);
  const [completing, setCompleting] = useState(false);

  const cart = useCartStore();

  const fetchProducts = async (q = search) => {
    setLoading(true);
    try {
      let url = '/products?limit=50';
      if (q) url += `&search=${encodeURIComponent(q)}`;
      const res = await api.get(url);
      setProducts(res.data || res || []);
    } catch {
      // Mock items for standalone test
      setProducts([
        { id: '1', nameEn: 'Samsung Galaxy A15', sku: 'MOB-A15-128', sellingPrice: 45000, currentStock: 12 },
        { id: '2', nameEn: 'AirPods Pro 2nd Gen', sku: 'ACC-APP2-01', sellingPrice: 68000, currentStock: 8 },
        { id: '3', nameEn: 'Anker 65W Fast Charger', sku: 'ACC-ANK-65W', sellingPrice: 9500, currentStock: 15 },
        { id: '4', nameEn: '9D Glass Screen Protector', sku: 'ACC-PROT-IP15', sellingPrice: 450, currentStock: 100 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    if (product.currentStock <= 0) {
      Alert.alert('Out of Stock', 'This product has 0 units in stock.');
      return;
    }
    const success = cart.addItem(product);
    if (!success) {
      Alert.alert('Stock Limit Reached', 'Cannot add more units than available stock.');
    }
  };

  const handleCheckout = async () => {
    if (cart.items.length === 0) return;
    setCompleting(true);
    try {
      const payload = {
        paymentMethod,
        amountPaid: Number(cart.totalAmount()),
        paidAmount: Number(cart.totalAmount()),
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          discountPct: 0,
        })),
      };

      const res = await api.post('/sales', payload);
      const saleData = res.data?.data || res.data || res;

      // Prepare receipt data
      const finalReceipt = {
        invoiceNumber: saleData.invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
        date: new Date().toLocaleString(),
        totalAmount: cart.totalAmount(),
        subtotal: cart.subtotal(),
        gstAmount: cart.gstAmount(),
        paymentMethod,
        items: [...cart.items],
      };

      setCompletedSale(finalReceipt);
      setPayModalVisible(false);
      setCartVisible(false);
      cart.clearCart();
      fetchProducts();
      setReceiptVisible(true);
    } catch (err) {
      Alert.alert('Checkout Failed', err.message || 'Transaction could not be saved');
    } finally {
      setCompleting(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!completedSale) return;
    let text = `*Hassan Traderz — Invoice ${completedSale.invoiceNumber}*\n`;
    text += `Date: ${completedSale.date}\n------------------\n`;
    completedSale.items.forEach((i) => {
      text += `• ${i.nameEn} x ${i.quantity} = ₨ ${(i.quantity * i.unitPrice).toLocaleString()}\n`;
    });
    text += `------------------\n*Total Amount: ₨ ${completedSale.totalAmount.toLocaleString()}*\n`;
    text += `Payment: ${completedSale.paymentMethod}\n\nThank you for shopping at Hassan Traderz!`;

    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(text)}`);
  };

  const formatPKR = (v) => `₨ ${(Number(v) || 0).toLocaleString()}`;

  return (
    <View style={styles.container}>
      {/* Top Header & Search Bar */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={colors.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search phone, SKU, barcode..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={(t) => {
              setSearch(t);
              fetchProducts(t);
            }}
          />
          {search ? (
            <TouchableOpacity onPress={() => { setSearch(''); fetchProducts(''); }}>
              <Feather name="x" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Floating Cart Button */}
        <TouchableOpacity style={styles.cartButton} onPress={() => setCartVisible(true)}>
          <MaterialCommunityIcons name="cart-outline" size={22} color="#fff" />
          {cart.itemCount() > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cart.itemCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Products FlatList */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const outOfStock = item.currentStock <= 0;
            return (
              <TouchableOpacity
                style={[styles.productCard, outOfStock && { opacity: 0.5 }]}
                onPress={() => handleAddToCart(item)}
                disabled={outOfStock}
              >
                <View style={styles.productIconBox}>
                  <MaterialCommunityIcons name="cellphone" size={26} color={colors.primary} />
                </View>
                <View style={styles.productDetails}>
                  <Text style={styles.productName} numberOfLines={1}>{item.nameEn}</Text>
                  <Text style={styles.productSku}>SKU: {item.sku}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>{formatPKR(item.sellingPrice)}</Text>
                    <View style={[styles.stockPill, outOfStock && { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                      <Text style={[styles.stockPillText, outOfStock && { color: colors.danger }]}>
                        {outOfStock ? 'Out of Stock' : `${item.currentStock} in stock`}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={styles.addBtn}>
                  <Feather name="plus" size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* CART MODAL DRAWER */}
      <Modal visible={cartVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cartDrawer}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Counter Cart ({cart.itemCount()} items)</Text>
              <TouchableOpacity onPress={() => setCartVisible(false)}>
                <Feather name="x" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            {cart.items.length === 0 ? (
              <View style={styles.emptyCart}>
                <MaterialCommunityIcons name="cart-off" size={48} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, marginTop: 12 }}>Your cart is empty</Text>
              </View>
            ) : (
              <FlatList
                data={cart.items}
                keyExtractor={(item) => item.productId}
                renderItem={({ item }) => (
                  <View style={styles.cartItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartItemName} numberOfLines={1}>{item.nameEn}</Text>
                      <Text style={styles.cartItemPrice}>{formatPKR(item.unitPrice)} x {item.quantity}</Text>
                    </View>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => cart.updateQuantity(item.productId, item.quantity - 1)}>
                        <Feather name="minus" size={14} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={styles.qtyNum}>{item.quantity}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => cart.updateQuantity(item.productId, item.quantity + 1)}>
                        <Feather name="plus" size={14} color={colors.text} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.delBtn} onPress={() => cart.removeItem(item.productId)}>
                        <Feather name="trash-2" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            )}

            {/* Cart Footer */}
            {cart.items.length > 0 && (
              <View style={styles.drawerFooter}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryVal}>{formatPKR(cart.subtotal())}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>GST (17%)</Text>
                  <Text style={styles.summaryVal}>{formatPKR(cart.gstAmount())}</Text>
                </View>
                <View style={[styles.summaryRow, { marginTop: 6, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 }]}>
                  <Text style={styles.totalLabel}>Total Payable</Text>
                  <Text style={styles.totalVal}>{formatPKR(cart.totalAmount())}</Text>
                </View>

                <TouchableOpacity style={styles.checkoutBtn} onPress={() => setPayModalVisible(true)}>
                  <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* PAYMENT METHOD MODAL */}
      <Modal visible={payModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.payCard}>
            <Text style={styles.payTitle}>Select Payment Method</Text>
            <Text style={styles.paySub}>Total: {formatPKR(cart.totalAmount())}</Text>

            {['CASH', 'EASYPAISA', 'JAZZCASH', 'CARD'].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.methodPill, paymentMethod === m && styles.methodPillActive]}
                onPress={() => setPaymentMethod(m)}
              >
                <Text style={[styles.methodText, paymentMethod === m && styles.methodTextActive]}>
                  {m === 'CASH' && '💵 Cash Payment'}
                  {m === 'EASYPAISA' && '📱 EasyPaisa'}
                  {m === 'JAZZCASH' && '📱 JazzCash'}
                  {m === 'CARD' && '💳 Debit / Credit Card'}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.paySubmitBtn, completing && { opacity: 0.6 }]}
              onPress={handleCheckout}
              disabled={completing}
            >
              {completing ? <ActivityIndicator color="#fff" /> : <Text style={styles.paySubmitText}>Generate Sale & Receipt</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPayModalVisible(false)}>
              <Text style={{ color: colors.textMuted, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FULL-SCREEN DIGITAL RECEIPT MODAL */}
      <Modal visible={receiptVisible} animationType="slide" transparent>
        <View style={styles.receiptOverlay}>
          <View style={styles.receiptCard}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <View style={styles.receiptHeader}>
                <Text style={styles.receiptShopName}>HASSAN TRADERZ</Text>
                <Text style={styles.receiptShopSub}>Mobile Phones & Accessories House</Text>
                <Text style={styles.receiptShopContact}>Main Bazaar, Lahore | Ph: 0300-0000000</Text>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptMetaBold}>Invoice #:</Text>
                <Text style={styles.receiptMetaVal}>{completedSale?.invoiceNumber}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptMeta}>Date:</Text>
                <Text style={styles.receiptMetaVal}>{completedSale?.date}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptMeta}>Payment:</Text>
                <Text style={styles.receiptMetaVal}>{completedSale?.paymentMethod}</Text>
              </View>

              <View style={styles.receiptDivider} />

              <Text style={[styles.receiptMetaBold, { marginBottom: 6 }]}>ITEMS PURCHASED:</Text>
              {completedSale?.items?.map((item, idx) => (
                <View key={idx} style={styles.receiptItemRow}>
                  <Text style={styles.receiptItemName}>{item.nameEn} x{item.quantity}</Text>
                  <Text style={styles.receiptItemPrice}>₨ {(item.quantity * item.unitPrice).toLocaleString()}</Text>
                </View>
              ))}

              <View style={styles.receiptDivider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptMeta}>Subtotal:</Text>
                <Text style={styles.receiptMetaVal}>₨ {completedSale?.subtotal?.toLocaleString()}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptMeta}>GST (17%):</Text>
                <Text style={styles.receiptMetaVal}>₨ {completedSale?.gstAmount?.toLocaleString()}</Text>
              </View>

              <View style={[styles.receiptRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 }]}>
                <Text style={styles.receiptTotalLabel}>TOTAL PAID:</Text>
                <Text style={styles.receiptTotalVal}>₨ {completedSale?.totalAmount?.toLocaleString()}</Text>
              </View>

              <Text style={styles.receiptThankYou}>Thank you for shopping at Hassan Traderz!</Text>
            </ScrollView>

            <View style={styles.receiptActionFooter}>
              <TouchableOpacity style={styles.receiptWaBtn} onPress={handleShareWhatsApp}>
                <MaterialCommunityIcons name="whatsapp" size={20} color="#fff" />
                <Text style={styles.receiptWaBtnText}>Share on WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.receiptDoneBtn} onPress={() => setReceiptVisible(false)}>
                <Text style={styles.receiptDoneBtnText}>Done (New Sale)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBox: {
    flex: 1,
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
  cartButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  listContent: { padding: 16 },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productDetails: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '700', color: colors.text },
  productSku: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  productPrice: { fontSize: 14, fontWeight: '800', color: colors.primary },
  stockPill: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  stockPillText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  addBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  cartDrawer: { backgroundColor: colors.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  drawerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  emptyCart: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  cartItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  cartItemName: { fontSize: 13.5, fontWeight: '700', color: colors.text },
  cartItemPrice: { fontSize: 12, color: colors.primary, marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: colors.bgElevated, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { color: colors.text, fontWeight: '700', fontSize: 13 },
  delBtn: { marginLeft: 6, padding: 4 },
  drawerFooter: { marginTop: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel: { fontSize: 12.5, color: colors.textMuted },
  summaryVal: { fontSize: 13, color: colors.text, fontWeight: '600' },
  totalLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  totalVal: { fontSize: 18, fontWeight: '900', color: colors.primary },
  checkoutBtn: { backgroundColor: colors.primary, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  checkoutBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  payCard: { backgroundColor: colors.bgSurface, borderRadius: 20, padding: 24, margin: 20, borderWidth: 1, borderColor: colors.border },
  payTitle: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center' },
  paySub: { fontSize: 14, color: colors.primary, fontWeight: '700', textAlign: 'center', marginBottom: 16, marginTop: 4 },
  methodPill: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, backgroundColor: colors.bgElevated, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  methodPillActive: { borderColor: colors.primary, backgroundColor: 'rgba(16, 185, 129, 0.12)' },
  methodText: { color: colors.text, fontSize: 13.5, fontWeight: '600' },
  methodTextActive: { color: colors.primary, fontWeight: '800' },
  paySubmitBtn: { backgroundColor: colors.primary, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  paySubmitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  receiptOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  receiptCard: { backgroundColor: '#fff', borderRadius: 20, maxHeight: '85%', overflow: 'hidden' },
  receiptHeader: { alignItems: 'center', marginBottom: 10 },
  receiptShopName: { fontSize: 20, fontWeight: '900', color: '#0f172a', letterSpacing: 0.5 },
  receiptShopSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  receiptShopContact: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  receiptDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  receiptMeta: { fontSize: 12.5, color: '#64748b' },
  receiptMetaBold: { fontSize: 12.5, fontWeight: '700', color: '#0f172a' },
  receiptMetaVal: { fontSize: 12.5, fontWeight: '600', color: '#0f172a' },
  receiptItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
  receiptItemName: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  receiptItemPrice: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  receiptTotalLabel: { fontSize: 16, fontWeight: '900', color: '#059669' },
  receiptTotalVal: { fontSize: 18, fontWeight: '900', color: '#059669' },
  receiptThankYou: { textAlign: 'center', fontSize: 12, color: '#64748b', marginTop: 16 },
  receiptActionFooter: { padding: 16, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#e2e8f0', gap: 10 },
  receiptWaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#25D366', height: 46, borderRadius: 12 },
  receiptWaBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  receiptDoneBtn: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', height: 46, borderRadius: 12 },
  receiptDoneBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
