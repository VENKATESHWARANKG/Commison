import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../app/utils/theme';

// Everything that used to live under the "More" tab
const SECTIONS = [
  {
    title: 'Orders',
    items: [
      { key: 'createOrder', label: 'Create Order', emoji: '📝' },
      { key: 'viewOrders', label: 'View Orders', emoji: '📦' },
    ],
  },
  {
    title: 'Accounts',
    items: [
      { key: 'recordExpense', label: 'Record Expense', emoji: '🧾' },
      { key: 'reports', label: 'Reports', emoji: '📊' },
    ],
  },
  {
    title: 'Transport',
    items: [
      { key: 'addTransporter', label: 'Add Transporter', emoji: '🚛' },
      { key: 'viewLRs', label: "View LR's", emoji: '📋' },
    ],
  },
];

const initialOf = (name) => (name || '').trim().charAt(0).toUpperCase() || '👤';

export default function MenuDrawer({ visible, name, subtitle, onClose, onSelect }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.drawer}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initialOf(name)}</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.name} numberOfLines={1}>{name || 'Commission Agent'}</Text>
                {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.body}>
              {SECTIONS.map((section) => (
                <View key={section.title} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  {section.items.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={styles.row}
                      activeOpacity={0.7}
                      onPress={() => onSelect && onSelect(item.key)}
                    >
                      <View style={styles.iconWrap}>
                        <Text style={styles.iconEmoji}>{item.emoji}</Text>
                      </View>
                      <Text style={styles.rowLabel}>{item.label}</Text>
                      <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>

        {/* tapping the dimmed area closes the menu */}
        <Pressable style={styles.backdrop} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  drawer: { width: '80%', maxWidth: 340, backgroundColor: COLORS.white },
  safeArea: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.navy,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 22,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { fontSize: 20, fontWeight: '700', color: COLORS.navy },
  headerText: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  subtitle: { fontSize: 12, color: '#C6CBEA', marginTop: 2 },
  closeButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 18, color: COLORS.white },
  body: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  section: { marginTop: 10 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.lightGray,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
    marginLeft: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 6, borderRadius: 10 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.purpleBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconEmoji: { fontSize: 17 },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.navy },
  chevron: { fontSize: 20, color: COLORS.lightGray },
});