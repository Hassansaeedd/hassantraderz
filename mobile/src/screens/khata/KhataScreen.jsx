// mobile/src/screens/khata/KhataScreen.jsx — Customer Khata & Credit Ledger
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, Linking
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function KhataScreen() {
  const [customers, setCustomers] = useState([
    { id: '1', name: 'Zubair Ahmad', phone: '03214445566', balance: 35000, lastPayment: '10,000 PKR on 18 Aug' },
    { id: '2', name: 'Muhammad Ali', phone: '03001234567', balance: 18500, lastPayment: '5,000 PKR on 15 Aug' },
    { id: '3', name: 'Kamran Khan', phone: '03338889900', balance: 42000, lastPayment: 'No payments yet' },
  ]);

  const [selectedCust, setSelectedCust] = useState(null);
  const [amount, setAmount] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const handleRecordPayment = () => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter payment amount.');
      return;
    }

    const pay = Number(amount);
    setCustomers(customers.map(c => {
      if (c.id === selectedCust.id) {
        return {
          ...c,
          balance: Math.max(0, c.balance - pay),
          lastPayment: `₨ ${pay.toLocaleString()} on ${new Date().toLocaleDateString()}`
        };
      }
      return c;
    }));

    setModalVisible(false);
    setAmount('');
    Alert.alert('Payment Recorded! 🎉', `Received ₨ ${pay.toLocaleString()} from ${selectedCust.name}.`);
  };

  const handleSendReminder = (cust) => {
    const text = `*Hassan Traderz — Khata Payment Reminder*\nDear ${cust.name},\nYour outstanding credit balance is *₨ ${cust.balance.toLocaleString()}*.\nPlease clear your dues at your earliest convenience.\nThank you!`;
    Linking.openURL(`whatsapp://send?phone=${cust.phone}&text=${encodeURIComponent(text)}`);
  };

  const formatPKR = (v) => `₨ ${(Number(v) || 0).toLocaleString()}`;
  const totalKhata = customers.reduce((sum, c) => sum + c.balance, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Customer Khata (گاہک کھاتہ)</Text>
          <Text style={styles.headerSub}>Total Outstanding: {formatPKR(totalKhata)}</Text>
        </View>
      </View>

      <FlatList
        data={customers}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.phone}>{item.phone}</Text>
              </View>
              <View style={styles.balanceBox}>
                <Text style={styles.balLabel}>Balance Due</Text>
                <Text style={styles.balVal}>{formatPKR(item.balance)}</Text>
              </View>
            </View>

            <Text style={styles.lastPay}>Last: {item.lastPayment}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.payBtn}
                onPress={() => { setSelectedCust(item); setModalVisible(true); }}
              >
                <Feather name="plus-circle" size={16} color="#fff" />
                <Text style={styles.payBtnText}>Record Payment</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.waBtn} onPress={() => handleSendReminder(item)}>
                <MaterialCommunityIcons name="whatsapp" size={18} color="#fff" />
                <Text style={styles.waBtnText}>Reminder</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* RECORD PAYMENT MODAL */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Receive Installment / Khata</Text>
            <Text style={styles.custName}>{selectedCust?.name}</Text>
            <Text style={styles.currBal}>Current Due: {formatPKR(selectedCust?.balance)}</Text>

            <TextInput
              style={styles.input}
              placeholder="Amount Received (₨) *"
              placeholderTextColor={colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleRecordPayment}>
              <Text style={styles.submitBtnText}>Save Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ alignItems: 'center', padding: 12 }} onPress={() => setModalVisible(false)}>
              <Text style={{ color: colors.textMuted, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  headerSub: { fontSize: 13, color: colors.danger, fontWeight: '700', marginTop: 2 },
  listContent: { padding: 16 },
  card: { backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  name: { fontSize: 16, fontWeight: '800', color: colors.text },
  phone: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  balanceBox: { alignItems: 'flex-end' },
  balLabel: { fontSize: 10.5, color: colors.textMuted, fontWeight: '700' },
  balVal: { fontSize: 16, fontWeight: '900', color: colors.danger },
  lastPay: { fontSize: 11.5, color: colors.textSecondary, marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  payBtn: { flex: 1, flexDirection: 'row', gap: 6, backgroundColor: colors.primary, borderRadius: 10, height: 40, alignItems: 'center', justifyContent: 'center' },
  payBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  waBtn: { flexDirection: 'row', gap: 6, backgroundColor: '#25D366', borderRadius: 10, paddingHorizontal: 14, height: 40, alignItems: 'center', justifyContent: 'center' },
  waBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: colors.bgSurface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border },
  modalTitle: { fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center' },
  custName: { fontSize: 15, fontWeight: '700', color: colors.primary, textAlign: 'center', marginTop: 4 },
  currBal: { fontSize: 13, color: colors.danger, textAlign: 'center', marginBottom: 16, fontWeight: '600' },
  input: { backgroundColor: colors.bgElevated, borderRadius: 10, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 14, height: 48, marginBottom: 14, fontSize: 16 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
