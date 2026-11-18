import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import { COLORS } from '../app/utils/theme';

const SAMPLE_LRS = [
  { id: 'LR-5012', transporter: 'Sharma Transport', from: 'Bengaluru', to: 'Chennai', status: 'In Transit', date: '23 May 2024' },
  { id: 'LR-5011', transporter: 'Kumar Logistics', from: 'Mumbai', to: 'Pune', status: 'Delivered', date: '21 May 2024' },
  { id: 'LR-5010', transporter: 'Sharma Transport', from: 'Delhi', to: 'Jaipur', status: 'Delivered', date: '19 May 2024' },
];

function StatusPill({ status }) {
  const delivered = status === 'Delivered';
  return (
    <View style={[styles.pill, delivered ? styles.pillDelivered : styles.pillTransit]}>
      <Text style={[styles.pillText, delivered ? styles.pillTextDelivered : styles.pillTextTransit]}>
        {status}
      </Text>
    </View>
  );
}

export default function ViewLRsScreen({ navigation = null, lrs = SAMPLE_LRS, onBack, onLRPress, onAddLR }) {
  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LR's (Lorry Receipts)</Text>
        <TouchableOpacity onPress={onAddLR} style={styles.backButton}>
          <Text style={styles.addIcon}>➕</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={lrs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.lrRow}
            activeOpacity={0.7}
            onPress={() => onLRPress && onLRPress(item)}
          >
            <View style={styles.lrTopRow}>
              <Text style={styles.lrId}>{item.id}</Text>
              <StatusPill status={item.status} />
            </View>
            <Text style={styles.transporterText}>{item.transporter}</Text>
            <View style={styles.routeRow}>
              <Text style={styles.routeText}>{item.from}</Text>
              <Text style={styles.routeArrow}>→</Text>
              <Text style={styles.routeText}>{item.to}</Text>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No LR's recorded yet</Text>}
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 22, color: COLORS.navy },
  addIcon: { fontSize: 16 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.navy },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  lrRow: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  lrTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  lrId: { fontSize: 14, fontWeight: '700', color: COLORS.navy },
  transporterText: { fontSize: 13, color: COLORS.gray, marginBottom: 10 },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  routeText: { fontSize: 13, color: COLORS.navy, fontWeight: '600' },
  routeArrow: { fontSize: 13, color: COLORS.lightGray, marginHorizontal: 8 },
  dateText: { fontSize: 11, color: COLORS.lightGray, marginLeft: 'auto' },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pillDelivered: { backgroundColor: COLORS.greenBg },
  pillTransit: { backgroundColor: COLORS.orangeBg },
  pillText: { fontSize: 11, fontWeight: '700' },
  pillTextDelivered: { color: COLORS.green },
  pillTextTransit: { color: COLORS.orange },
  emptyText: { textAlign: 'center', color: COLORS.gray, marginTop: 40 },
});