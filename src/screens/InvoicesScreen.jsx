import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
} from 'react-native';
import { COLORS } from '../app/utils/theme';
import BottomTabBar from '../components/BottomTabBar';
import InvoiceBreakupModal from '../components/InvoiceBreakupModal';
import { dataStore } from '../app/utils/dataStore';
import { summarizeInvoices, getSide } from '../app/utils/invoiceHelpers';

const FILTERS = ['All', 'Paid', 'Pending'];

// Converts a summarized invoice (see summarizeInvoices) into the row shape this list renders.
function toInvoiceRow(s) {
  return {
    id: s.id,
    name: getSide(s) === 'transfer' ? `${s.seller} → ${s.buyer}` : s.party || `Cash · ${s.account || 'Cash'}`,
    status: s.balance <= 0 ? 'Paid' : 'Pending',
    amount: `₹ ${s.gross.toLocaleString('en-IN')}`,
    date: s.date,
    side: getSide(s),
    gross: s.gross,
    returned: s.returned,
    paid: s.paid,
    taxAmount: Number(s.taxAmount) || 0,
    withInvoice: s.withInvoice !== false,
    hasItems: s.hasItems !== false,
    items: s.items || [],
    description: s.description || '',
    buyer: s.buyer,
    seller: s.seller,
    paidIn: s.paidIn || 0,
    paidOut: s.paidOut || 0,
    balanceIn: s.balanceIn || 0,
    balanceOut: s.balanceOut || 0,
  };
}

function StatusBadge({ status }) {
  const isPaid = status === 'Paid';
  return (
    <View style={[styles.badge, isPaid ? styles.badgePaid : styles.badgePending]}>
      <Text style={[styles.badgeText, isPaid ? styles.badgeTextPaid : styles.badgeTextPending]}>{status}</Text>
    </View>
  );
}

export default function InvoicesScreen({
  navigation = null,
  showTabBar = true,
  onBack,
  onInvoicePress,
  onNewInvoice,
  onTabPress,
}) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [breakupInvoice, setBreakupInvoice] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Re-load every time this screen mounts, so an invoice created moments ago shows up right away.
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [records, payments] = await Promise.all([
        dataStore.invoices.getAll(),
        dataStore.payments.getAll(),
      ]);
      if (isMounted) {
        setInvoices(summarizeInvoices(records, payments).map(toInvoiceRow));
        setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesFilter = filter === 'All' || inv.status === filter;
      const matchesSearch =
        !search ||
        inv.id.toLowerCase().includes(search.toLowerCase()) ||
        inv.name.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [invoices, filter, search]);

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Invoice',
      `Delete ${item.id} (${item.name})? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await dataStore.invoices.remove(item.id);
            setInvoices((prev) => prev.filter((i) => i.id !== item.id));
            if (breakupInvoice && breakupInvoice.id === item.id) setBreakupInvoice(null);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.headerRow}>
        {onBack ? (
          <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
        <Text style={styles.headerTitle}>Invoices</Text>
        <TouchableOpacity onPress={onNewInvoice} style={styles.backButton}>
          <Text style={styles.addIcon}>➕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by invoice # or party"
          placeholderTextColor={COLORS.lightGray}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f ? styles.filterChipActive : null]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f ? styles.filterTextActive : null]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.invoiceRow}
              activeOpacity={0.7}
              onPress={() => {
                setBreakupInvoice(item);
                if (onInvoicePress) onInvoicePress(item);
              }}
              onLongPress={() => handleDelete(item)}
            >
              <View style={styles.invoiceLeft}>
                <Text style={styles.invoiceId}>
                  {item.id}
                  {!item.withInvoice ? <Text style={styles.noBillTag}>  NO BILL</Text> : null}
                </Text>
                <Text style={styles.invoiceName}>{item.name}</Text>
              </View>
              <StatusBadge status={item.status} />
              <View style={styles.invoiceRight}>
                <Text style={styles.invoiceAmount}>{item.amount}</Text>
                <Text style={styles.invoiceDate}>{item.date}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No invoices found</Text>}
          ListHeaderComponent={filtered.length > 0 ? <Text style={styles.hintText}>Long-press an invoice to delete it</Text> : null}
        />
      )}

      {showTabBar ? <BottomTabBar activeTab="invoices" onTabPress={onTabPress} /> : null}

      <InvoiceBreakupModal
        visible={!!breakupInvoice}
        invoice={breakupInvoice}
        onClose={() => setBreakupInvoice(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 22, color: COLORS.navy },
  addIcon: { fontSize: 16 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.navy },
  searchWrap: { paddingHorizontal: 20, marginBottom: 10 },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: COLORS.navy,
  },
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
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  invoiceLeft: { flex: 1.3 },
  invoiceId: { fontSize: 14, fontWeight: '700', color: COLORS.navy, marginBottom: 2 },
  invoiceName: { fontSize: 12, color: COLORS.gray },
  invoiceRight: { flex: 1, alignItems: 'flex-end' },
  invoiceAmount: { fontSize: 14, fontWeight: '700', color: COLORS.navy, marginBottom: 2 },
  invoiceDate: { fontSize: 11, color: COLORS.lightGray },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginHorizontal: 6 },
  badgePaid: { backgroundColor: COLORS.greenBg },
  badgePending: { backgroundColor: COLORS.orangeBg },
  badgeText: { fontSize: 11, fontWeight: '700' },
  badgeTextPaid: { color: COLORS.green },
  badgeTextPending: { color: COLORS.orange },
  emptyText: { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
  noBillTag: { fontSize: 10, color: COLORS.orange, fontWeight: '700' },
  hintText: { fontSize: 12, color: COLORS.lightGray, fontStyle: 'italic', marginBottom: 10, textAlign: 'center' },
});