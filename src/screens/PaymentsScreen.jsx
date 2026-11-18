import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { dataStore } from '../app/utils/dataStore';
import { COLORS } from '../app/utils/theme';
import BottomTabBar from '../components/BottomTabBar';

const FILTERS = ['All', 'Payment', 'Receipt', 'Contra', 'Settlement'];

const money = (n) => `₹ ${(Number(n) || 0).toLocaleString('en-IN')}`;

// Payments saved before the four types existed have no voucherType: work it out from their direction
function paymentType(record) {
  if (record.voucherType) return record.voucherType;
  return record.direction === 'in' ? 'Receipt' : 'Payment';
}

function toPaymentRow(record) {
  const type = paymentType(record);
  const isContra = type === 'Contra';
  return {
    id: record.id,
    kind: 'payment', // saved in the payments store
    type,
    party: isContra ? `${record.fromAccount} → ${record.toAccount}` : record.party,
    amount: money(record.amount),
    mode: isContra ? `${record.contraType}${record.reference ? ` · ${record.reference}` : ''}` : record.mode,
    date: record.date,
    createdAt: record.createdAt || '',
  };
}

// Settlements (and the older single journal entries) are saved in the journals store
function toSettlementRow(record) {
  const invoiceIds = (record.invoices || []).map((i) => i.id).join(', ');
  return {
    id: record.id,
    kind: 'settlement',
    type: 'Settlement',
    party: `${record.fromParty} → ${record.toParty}`,
    amount: money(record.amount),
    mode: invoiceIds ? `Settlement · ${invoiceIds}` : `Journal · ${record.againstType}: ${record.againstRef}`,
    date: record.date,
    createdAt: record.createdAt || '',
  };
}

export default function PaymentsScreen({
  navigation = null,
  onPaymentPress,
  onRecordPayment,
  onTabPress,
}) {
  const [filter, setFilter] = useState('All');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Re-load every time this screen mounts, so an entry recorded moments ago shows up right away.
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [records, settlements] = await Promise.all([dataStore.payments.getAll(), dataStore.journals.getAll()]);
      if (isMounted) {
        const rows = [...records.map(toPaymentRow), ...settlements.map(toSettlementRow)];
        rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        setPayments(rows);
        setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleDelete = (item) => {
    const effect = item.type === 'Contra' ? '' : ' Invoice balances will go back up.';
    Alert.alert(
      `Delete ${item.type}`,
      `Delete this ${item.type.toLowerCase()} (${item.party}, ${item.amount})?${effect} This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await (item.kind === 'settlement' ? dataStore.journals : dataStore.payments).remove(item.id);
            setPayments((prev) => prev.filter((p) => !(p.id === item.id && p.kind === item.kind)));
          },
        },
      ]
    );
  };

  // Icon, sign and colours for each type
  const metaFor = (type) => {
    if (type === 'Payment') return { icon: '↗️', sign: '- ', iconStyle: styles.iconWrapOut, amountStyle: styles.amountTextOut };
    if (type === 'Receipt') return { icon: '↙️', sign: '+ ', iconStyle: null, amountStyle: styles.amountTextIn };
    if (type === 'Contra') return { icon: '🏦', sign: '', iconStyle: styles.iconWrapNeutral, amountStyle: styles.amountTextNeutral };
    return { icon: '🔁', sign: '', iconStyle: styles.iconWrapNeutral, amountStyle: styles.amountTextNeutral };
  };

  const filtered = payments.filter((p) => filter === 'All' || p.type === filter);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Payments</Text>
        <TouchableOpacity onPress={onRecordPayment} style={styles.addButton}>
          <Text style={styles.addIcon}>➕</Text>
        </TouchableOpacity>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f ? styles.filterChipActive : null]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f ? styles.filterTextActive : null]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => `${item.kind}-${item.id}`}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const meta = metaFor(item.type);
            return (
              <TouchableOpacity
                style={styles.paymentRow}
                activeOpacity={0.7}
                onPress={() => onPaymentPress && onPaymentPress(item)}
                onLongPress={() => handleDelete(item)}
              >
                <View style={[styles.iconWrap, meta.iconStyle]}>
                  <Text style={styles.iconEmoji}>{meta.icon}</Text>
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={styles.partyName}>{item.party}</Text>
                  <Text style={styles.modeText}>{item.mode ? `${item.mode} · ` : ''}{item.date}</Text>
                  {/^(PAY|RCT|CON|STL|JV)-/.test(item.id) ? <Text style={styles.refText}>Ref: {item.id}</Text> : null}
                </View>
                <Text style={[styles.amountText, meta.amountStyle]}>
                  {meta.sign}{item.amount}
                </Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={styles.emptyText}>No payments found</Text>}
          ListHeaderComponent={filtered.length > 0 ? <Text style={styles.hintText}>Long-press an item to delete it</Text> : null}
        />
      )}

      <BottomTabBar activeTab="payments" onTabPress={onTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy },
  addButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  addIcon: { fontSize: 16 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12 },
  filterChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginRight: 10,
  },
  filterChipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  filterText: { fontSize: 13, color: COLORS.navy, fontWeight: '500' },
  filterTextActive: { color: COLORS.white },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.greenBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconEmoji: { fontSize: 18 },
  iconWrapOut: { backgroundColor: COLORS.orangeBg },
  iconWrapNeutral: { backgroundColor: '#E8EEFB' },
  paymentInfo: { flex: 1 },
  partyName: { fontSize: 14, fontWeight: '700', color: COLORS.navy, marginBottom: 2 },
  modeText: { fontSize: 12, color: COLORS.gray },
  refText: { fontSize: 11, color: COLORS.lightGray, marginTop: 2 },
  amountText: { fontSize: 14, fontWeight: '700' },
  amountTextIn: { color: COLORS.green },
  amountTextOut: { color: COLORS.orange },
  amountTextNeutral: { color: COLORS.blue },
  emptyText: { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
  hintText: { fontSize: 12, color: COLORS.lightGray, fontStyle: 'italic', marginBottom: 10, textAlign: 'center' },
});