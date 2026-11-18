import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { dataStore } from '../app/utils/dataStore';
import { COLORS } from '../app/utils/theme';
import BottomTabBar from '../components/BottomTabBar';

function toPartyRow(record) {
  return {
    id: record.id,
    name: record.name,
    mobile: record.mobile ? `+91 ${record.mobile}` : '',
  };
}

export default function PartiesScreen({
  navigation = null,
  onPartyPress,
  onAddBuyer,
  onAddSeller,
  onTabPress,
}) {
  const [tab, setTab] = useState('buyers');
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Re-load every time this screen mounts, so a buyer/seller added moments ago shows up right away.
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [buyerRecords, sellerRecords] = await Promise.all([
        dataStore.buyers.getAll(),
        dataStore.sellers.getAll(),
      ]);
      if (isMounted) {
        setBuyers(buyerRecords.map(toPartyRow));
        setSellers(sellerRecords.map(toPartyRow));
        setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const list = tab === 'buyers' ? buyers : sellers;

  const handleDelete = (item) => {
    const label = tab === 'buyers' ? 'Buyer' : 'Seller';
    Alert.alert(
      `Delete ${label}`,
      `Delete ${item.name}? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (tab === 'buyers') {
              await dataStore.buyers.remove(item.id);
              setBuyers((prev) => prev.filter((p) => p.id !== item.id));
            } else {
              await dataStore.sellers.remove(item.id);
              setSellers((prev) => prev.filter((p) => p.id !== item.id));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Parties</Text>
        <TouchableOpacity
          onPress={() => (tab === 'buyers' ? onAddBuyer && onAddBuyer() : onAddSeller && onAddSeller())}
          style={styles.addButton}
        >
          <Text style={styles.addIcon}>➕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[styles.segment, tab === 'buyers' ? styles.segmentActive : null]}
          onPress={() => setTab('buyers')}
        >
          <Text style={[styles.segmentText, tab === 'buyers' ? styles.segmentTextActive : null]}>
            Buyers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, tab === 'sellers' ? styles.segmentActive : null]}
          onPress={() => setTab('sellers')}
        >
          <Text style={[styles.segmentText, tab === 'sellers' ? styles.segmentTextActive : null]}>
            Sellers
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Text style={styles.emptyText}>Loading…</Text>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.partyRow}
              activeOpacity={0.7}
              onPress={() => onPartyPress && onPartyPress({ ...item, type: tab })}
              onLongPress={() => handleDelete(item)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.partyInfo}>
                <Text style={styles.partyName}>{item.name}</Text>
                <Text style={styles.partyMobile}>{item.mobile}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No {tab} added yet</Text>}
          ListHeaderComponent={list.length > 0 ? <Text style={styles.hintText}>Long-press a party to delete it</Text> : null}
        />
      )}

      <BottomTabBar activeTab="parties" onTabPress={onTabPress} />
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
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy },
  addButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  addIcon: { fontSize: 16 },
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  segmentActive: { backgroundColor: COLORS.white, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  segmentText: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  segmentTextActive: { color: COLORS.navy },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.purpleBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: COLORS.purple },
  partyInfo: { flex: 1 },
  partyName: { fontSize: 14, fontWeight: '700', color: COLORS.navy, marginBottom: 2 },
  partyMobile: { fontSize: 12, color: COLORS.gray },
  chevron: { fontSize: 20, color: COLORS.lightGray },
  emptyText: { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
  hintText: { fontSize: 12, color: COLORS.lightGray, fontStyle: 'italic', marginBottom: 10, textAlign: 'center' },
});