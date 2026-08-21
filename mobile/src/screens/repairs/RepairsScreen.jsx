// mobile/src/screens/repairs/RepairsScreen.jsx — Mobile Repair Work Order Intake & Tracking
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, Linking, ScrollView
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

export default function RepairsScreen() {
  const [repairs, setRepairs] = useState([
    {
      id: '1', ticketNo: 'REP-2026-001', customerName: 'Usman Ali', phone: '03018889900',
      device: 'Samsung A54 5G', fault: 'Screen broken, touch dead', cost: 14500, deposit: 2000, status: 'IN_REPAIR'
    },
    {
      id: '2', ticketNo: 'REP-2026-002', customerName: 'Kamran Shah', phone: '03335551212',
      device: 'iPhone 13 Pro', fault: 'Battery replacement (72% BH)', cost: 12000, deposit: 5000, status: 'READY'
    }
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [device, setDevice] = useState('');
  const [fault, setFault] = useState('');
  const [cost, setCost] = useState('');
  const [deposit, setDeposit] = useState('');

  const handleCreateTicket = () => {
    if (!customerName || !device || !fault) {
      Alert.alert('Incomplete Details', 'Please enter customer name, phone, device model and fault.');
      return;
    }

    const newTicket = {
      id: Date.now().toString(),
      ticketNo: `REP-2026-${String(repairs.length + 1).padStart(3, '0')}`,
      customerName,
      phone,
      device,
      fault,
      cost: Number(cost) || 0,
      deposit: Number(deposit) || 0,
      status: 'RECEIVED',
    };

    setRepairs([newTicket, ...repairs]);
    setModalVisible(false);
    setCustomerName(''); setPhone(''); setDevice(''); setFault(''); setCost(''); setDeposit('');
    Alert.alert('Ticket Created!', `Job #${newTicket.ticketNo} registered successfully.`);
  };

  const handleUpdateStatus = (ticketId, nextStatus) => {
    setRepairs(repairs.map(r => r.id === ticketId ? { ...r, status: nextStatus } : r));
  };

  const handleNotifyWhatsApp = (ticket) => {
    const text = `*Hassan Traderz — Repair Update*\nJob #${ticket.ticketNo}\nDevice: ${ticket.device}\nStatus: *${ticket.status === 'READY' ? 'READY FOR PICKUP ✅' : ticket.status}*\nRemaining Balance: ₨ ${(ticket.cost - ticket.deposit).toLocaleString()}\nPlease collect your device from shop.`;
    Linking.openURL(`whatsapp://send?phone=${ticket.phone}&text=${encodeURIComponent(text)}`);
  };

  const formatPKR = (v) => `₨ ${(Number(v) || 0).toLocaleString()}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mobile Repair Work Orders</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={repairs}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isReady = item.status === 'READY';
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item.ticketNo}</Text>
                </View>
                <View style={[styles.statusBadge, isReady ? styles.statusReady : styles.statusProgress]}>
                  <Text style={[styles.statusText, isReady ? { color: colors.success } : { color: colors.warning }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.deviceTitle}>{item.device}</Text>
              <Text style={styles.faultText}><Text style={{ fontWeight: '700' }}>Fault:</Text> {item.fault}</Text>
              <Text style={styles.customerText}><Feather name="user" size={12} /> {item.customerName} ({item.phone})</Text>

              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Est: {formatPKR(item.cost)}</Text>
                <Text style={styles.dueLabel}>Due: {formatPKR(item.cost - item.deposit)}</Text>
              </View>

              {/* Status Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.statusBtn, item.status === 'IN_REPAIR' && styles.statusBtnActive]}
                  onPress={() => handleUpdateStatus(item.id, 'IN_REPAIR')}
                >
                  <Text style={styles.statusBtnText}>In Repair</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusBtn, item.status === 'READY' && styles.statusBtnReadyActive]}
                  onPress={() => handleUpdateStatus(item.id, 'READY')}
                >
                  <Text style={[styles.statusBtnText, item.status === 'READY' && { color: colors.success }]}>Ready</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.waBtn} onPress={() => handleNotifyWhatsApp(item)}>
                  <MaterialCommunityIcons name="whatsapp" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* CREATE TICKET MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Mobile Repair Work Order</Text>

            <TextInput style={styles.input} placeholder="Customer Name *" placeholderTextColor={colors.textMuted} value={customerName} onChangeText={setCustomerName} />
            <TextInput style={styles.input} placeholder="Customer Phone (e.g. 03001234567) *" placeholderTextColor={colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Device Model (e.g. iPhone 13) *" placeholderTextColor={colors.textMuted} value={device} onChangeText={setDevice} />
            <TextInput style={[styles.input, { height: 70 }]} placeholder="Fault / Problem Description *" placeholderTextColor={colors.textMuted} value={fault} onChangeText={setFault} multiline />
            <TextInput style={styles.input} placeholder="Estimated Repair Cost (₨)" placeholderTextColor={colors.textMuted} value={cost} onChangeText={setCost} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Advance Deposit Paid (₨)" placeholderTextColor={colors.textMuted} value={deposit} onChangeText={setDeposit} keyboardType="numeric" />

            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTicket}>
              <Text style={styles.submitBtnText}>Create Ticket & Print Claim</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ alignItems: 'center', padding: 14 }} onPress={() => setModalVisible(false)}>
              <Text style={{ color: colors.textMuted, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgBase },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  addBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16 },
  card: { backgroundColor: colors.bgCard, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tag: { backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  tagText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusProgress: { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  statusReady: { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  statusText: { fontSize: 11, fontWeight: '800' },
  deviceTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 4 },
  faultText: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  customerText: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 },
  costLabel: { fontSize: 13, color: colors.textMuted },
  dueLabel: { fontSize: 13, fontWeight: '800', color: colors.danger },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statusBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.bgElevated, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statusBtnActive: { borderColor: colors.warning, backgroundColor: 'rgba(245, 158, 11, 0.15)' },
  statusBtnReadyActive: { borderColor: colors.success, backgroundColor: 'rgba(16, 185, 129, 0.15)' },
  statusBtnText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  waBtn: { width: 38, height: 38, borderRadius: 8, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: colors.bgSurface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 16, textAlign: 'center' },
  input: { backgroundColor: colors.bgElevated, borderRadius: 10, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 14, height: 48, marginBottom: 12, fontSize: 14 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
