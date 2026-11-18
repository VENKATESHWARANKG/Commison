import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../app/utils/theme';
import BottomTabBar from '../components/BottomTabBar';

const CATEGORY_LABELS = {
  agriculture: 'Agriculture',
  food: 'Food Products',
  wholesale: 'Wholesale',
  manufacturing: 'Manufacturing',
  fmcg: 'FMCG',
  textiles: 'Textiles',
  other: 'Other',
};

const initialsOf = (name) =>
  (name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

function Row({ label, value, last }) {
  return (
    <View style={[styles.row, last ? styles.rowLast : null]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );
}

// profile: { name, mobile, email, businessName, businessType, city, state, categories, role } or null
export default function ProfileScreen({ profile = null, mobile = '', onLogout, onTabPress }) {
  const hasProfile = !!profile;
  const name = hasProfile ? profile.name : '';
  const phone = (hasProfile && profile.mobile) || mobile;
  const location = hasProfile ? [profile.city, profile.state].filter(Boolean).join(', ') : '';
  const categories = hasProfile && Array.isArray(profile.categories) ? profile.categories : [];

  const confirmLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => onLogout && onLogout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Who */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsOf(name) || '👤'}</Text>
          </View>
          <Text style={styles.heroName}>{name || 'Your Profile'}</Text>
          {phone ? <Text style={styles.heroSub}>+91 {phone}</Text> : null}
          {hasProfile && profile.email ? <Text style={styles.heroSub}>{profile.email}</Text> : null}
        </View>

        {hasProfile ? (
          <>
            <Text style={styles.sectionTitle}>Business</Text>
            <View style={styles.card}>
              <Row label="Business Name" value={profile.businessName} />
              <Row label="Business Type" value={profile.businessType} />
              <Row label="Location" value={location} />
              <Row label="Your Role" value={profile.role} last />
            </View>

            <Text style={styles.sectionTitle}>Deals In</Text>
            <View style={styles.card}>
              {categories.length > 0 ? (
                <View style={styles.chipRow}>
                  {categories.map((key) => (
                    <View key={key} style={styles.chip}>
                      <Text style={styles.chipText}>{CATEGORY_LABELS[key] || key}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No categories chosen</Text>
              )}
            </View>
          </>
        ) : (
          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>No profile details saved yet</Text>
            <Text style={styles.noteText}>
              Your name, business and categories appear here once you've signed up on this device.
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={confirmLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomTabBar activeTab="profile" onTabPress={onTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  headerRow: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.navy },
  container: { paddingHorizontal: 20, paddingBottom: 28 },
  hero: { alignItems: 'center', paddingVertical: 20 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '700', color: COLORS.white },
  heroName: { fontSize: 20, fontWeight: '700', color: COLORS.navy },
  heroSub: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.navy, marginTop: 8, marginBottom: 8 },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 13, color: COLORS.gray },
  rowValue: { fontSize: 14, fontWeight: '600', color: COLORS.navy, marginLeft: 16, flexShrink: 1, textAlign: 'right' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 8 },
  chip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.blue },
  emptyText: { fontSize: 13, color: COLORS.gray, paddingVertical: 12 },
  noteCard: { backgroundColor: COLORS.bg, borderRadius: 14, padding: 16, marginBottom: 12 },
  noteTitle: { fontSize: 14, fontWeight: '700', color: COLORS.navy, marginBottom: 4 },
  noteText: { fontSize: 13, color: COLORS.gray, lineHeight: 19 },
  logoutButton: {
    borderWidth: 1.5,
    borderColor: COLORS.red,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: COLORS.red },
});