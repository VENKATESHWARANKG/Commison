import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
} from 'react-native';
import { COLORS } from '../app/utils/theme';
import { dataStore } from '../app/utils/dataStore';

const FILTERS = ['All', 'Sales Order', 'Purchase Order'];

function toOrderRow(record) {
  return {
    id: record.id,
    type: record.orderType,
    party: record.party,
    orderDate: record.orderDate,
    deliveryDate: record.deliveryDate,
    itemCount: (record.items || []).length,
    amount: `₹ ${(Number(record.amount) || 0).toLocaleString('en-IN')}`,
    status: record.status || 'Pending',
  };
}

function TypeBadge({ type }) {
  const isSales = type === 'Sales Order';
  return (
    <View style={[styles.badge, isSales ? styles.badgeSales : styles.badgePurchase]}>
      <Text style={[styles.badgeText, isSales ? styles.badgeTextSales : styles.badgeTextPurchase]}>{type}</Text>
    </View>
  );
}

export default function ViewOrdersScreen({ navigation = null, onBack, onAddOrder, onOrderPress }) {
  const [filter, setFilter] = useState('All');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const records = await dataStore.orders.getAll();
      if (isMounted) {
        setOrders(records.map(toOrderRow));
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
    Alert.alert('Delete Order', `Delete ${item.id} (${item.party})? This can't be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await dataStore.orders.remove(item.id);
          setOrders((prev) => prev.filter((o) => o.id !== item.id));
        },
      },
    ]);
  };

  const filtered = useMemo(() => orders.filter((o) => filter === 'All' || o.type === filter), [orders, filter]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Orders</Text>
        <TouchableOpacity onPress={onAddOrder} style={styles.backButton}>
          <Text style={styles.addIcon}>➕</Text>
        </TouchableOpacity>
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
              style={styles.orderRow}
              activeOpacity={0.7}
              onPress={() => onOrderPress && onOrderPress(item)}
              onLongPress={() => handleDelete(item)}
            >
              <View style={styles.topRow}>
                <Text style={styles.orderId}>{item.id}</Text>
                <TypeBadge type={item.type} />
              </View>
              <Text style={styles.partyText}>{item.party}</Text>
              <View style={styles.bottomRow}>
                <Text style={styles.metaText}>
                  {item.itemCount} item{item.itemCount === 1 ? '' : 's'} · Delivery {item.deliveryDate}
                </Text>
                <Text style={styles.amountText}>{item.amount}</Text>
              </View>
              <Text style={styles.statusText}>{item.status} · Ordered {item.orderDate}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No orders yet — tap ➕ to create one</Text>}
          ListHeaderComponent={filtered.length > 0 ? <Text style={styles.hintText}>Long-press an order to delete it</Text> : null}
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
  addIcon: { fontSize: 16 },
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
  orderRow: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14, marginBottom: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderId: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
  partyText: { fontSize: 13, color: COLORS.gray, marginBottom: 8 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaText: { fontSize: 12, color: COLORS.lightGray, flex: 1, marginRight: 8 },
  amountText: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
  statusText: { fontSize: 11, color: COLORS.lightGray, marginTop: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeSales: { backgroundColor: '#E8EEFB' },
  badgePurchase: { backgroundColor: COLORS.orangeBg },
  badgeText: { fontSize: 10.5, fontWeight: '700' },
  badgeTextSales: { color: COLORS.blue },
  badgeTextPurchase: { color: COLORS.orange },
  emptyText: { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
  hintText: { fontSize: 12, color: COLORS.lightGray, fontStyle: 'italic', marginBottom: 10, textAlign: 'center' },
});