import { useEffect, useMemo, useState } from 'react';
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
import { isReturn } from '../app/utils/invoiceHelpers';
import { COLORS } from '../app/utils/theme';

const FILTERS = ['All', 'Sales Return', 'Purchase Return', 'Transfer Goods Return'];

function toReturnRow(record) {
  return {
    id: record.id,
    type: record.invoiceType, // 'Sales Return' | 'Purchase Return' | 'Transfer Goods Return'
    // a transfer return runs buyer -> seller (the goods go back the way they came)
    party: record.invoiceType === 'Transfer Goods Return' ? `${record.buyer} → ${record.seller}` : record.party,
    againstInvoice: record.originalInvoice || '—',
    amount: `₹ ${(Number(record.amount) || 0).toLocaleString('en-IN')}`,
    date: record.date,
  };
}

function TypeBadge({ type }) {
  const kind = type === 'Sales Return' ? 'Sales' : type === 'Transfer Goods Return' ? 'Transfer' : 'Purchase';
  return (
    <View style={[styles.badge, styles[`badge${kind}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText${kind}`]]}>{type}</Text>
    </View>
  );
}

export default function ViewReturnsScreen({ navigation = null, onBack, onReturnPress }) {
  const [filter, setFilter] = useState('All');
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const invoices = await dataStore.invoices.getAll();
      const returnRecords = invoices
        .filter(isReturn)
        .map(toReturnRow);
      if (isMounted) {
        setReturns(returnRecords);
        setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Delete Return',
      `Delete ${item.id}? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await dataStore.invoices.remove(item.id);
            setReturns((prev) => prev.filter((r) => r.id !== item.id));
          },
        },
      ]
    );
  };

  const filtered = useMemo(() => {
    return returns.filter((r) => filter === 'All' || r.type === filter);
  }, [returns, filter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Returns</Text>
        <View style={styles.backButton} />
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
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.returnRow}
              activeOpacity={0.7}
              onPress={() => onReturnPress && onReturnPress(item)}
              onLongPress={() => handleDelete(item)}
            >
              <View style={styles.topRow}>
                <Text style={styles.returnId}>{item.id}</Text>
                <TypeBadge type={item.type} />
              </View>
              <Text style={styles.partyText}>{item.party}</Text>
              <View style={styles.bottomRow}>
                <Text style={styles.againstText}>Against {item.againstInvoice}</Text>
                <Text style={styles.amountText}>{item.amount}</Text>
              </View>
              <Text style={styles.dateText}>{item.date}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No returns recorded yet</Text>}
          ListHeaderComponent={filtered.length > 0 ? <Text style={styles.hintText}>Long-press an item to delete it</Text> : null}
        />
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 22, color: COLORS.navy },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.navy },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 14, marginBottom: 8 },
  filterChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 10,
  },
  filterChipActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  filterText: { fontSize: 12.5, color: COLORS.navy, fontWeight: '500' },
  filterTextActive: { color: COLORS.white },
  listContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  returnRow: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  returnId: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
  partyText: { fontSize: 13, color: COLORS.gray, marginBottom: 8 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  againstText: { fontSize: 12, color: COLORS.lightGray },
  amountText: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
  dateText: { fontSize: 11, color: COLORS.lightGray, marginTop: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeSales: { backgroundColor: '#E8EEFB' },
  badgePurchase: { backgroundColor: COLORS.orangeBg },
  badgeTransfer: { backgroundColor: COLORS.purpleBg },
  badgeText: { fontSize: 10.5, fontWeight: '700' },
  badgeTextSales: { color: COLORS.blue },
  badgeTextPurchase: { color: COLORS.orange },
  badgeTextTransfer: { color: COLORS.purple },
  emptyText: { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
  hintText: { fontSize: 12, color: COLORS.lightGray, fontStyle: 'italic', marginBottom: 10, textAlign: 'center' },
});