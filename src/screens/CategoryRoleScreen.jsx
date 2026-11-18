import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';

const COLORS = {
  navy: '#1B2559',
  white: '#FFFFFF',
  gray: '#6B7280',
  border: '#E5E7EB',
  blue: '#3B5BDB',
  lightBlueBg: '#EEF2FF',
  bg: '#FFFFFF',
  error: '#DC2626',
};

const CATEGORIES = [
  { key: 'agriculture', label: 'Agriculture', emoji: '🌱' },
  { key: 'food', label: 'Food Products', emoji: '📦' },
  { key: 'wholesale', label: 'Wholesale', emoji: '🛒' },
  { key: 'manufacturing', label: 'Manufacturing', emoji: '🏭' },
  { key: 'fmcg', label: 'FMCG', emoji: '🧴' },
  { key: 'textiles', label: 'Textiles', emoji: '👕' },
  { key: 'other', label: 'Other', emoji: '⋯' },
];

const ROLES = ['Owner', 'Manager', 'Partner', 'Agent'];

export default function CategoryRoleScreen({ navigation = null, onBack, onFinishSetup }) {
  const [selectedCategories, setSelectedCategories] = useState(['agriculture']);
  const [role, setRole] = useState('Owner');
  const [errors, setErrors] = useState({ categories: '', role: '' });

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
  };

  const toggleCategory = (key) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
    if (errors.categories) setErrors((e) => ({ ...e, categories: '' }));
  };

  const handleRoleSelect = (r) => {
    setRole(r);
    if (errors.role) setErrors((e) => ({ ...e, role: '' }));
  };

  const validate = () => {
    const next = { categories: '', role: '' };
    if (selectedCategories.length === 0) next.categories = 'Select at least one category';
    if (!role) next.role = 'Select your role';
    setErrors(next);
    return !next.categories && !next.role;
  };

  const handleFinishSetup = () => {
    if (!validate()) return;
    if (onFinishSetup) onFinishSetup({ categories: selectedCategories, role });
    // navigation?.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back button */}
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Heading */}
        <Text style={styles.title}>What do you deal with?</Text>
        <Text style={styles.subtitle}>Select one or more categories</Text>

        {/* Category grid */}
        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const selected = selectedCategories.includes(cat.key);
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.categoryCard, selected ? styles.categoryCardSelected : null]}
                activeOpacity={0.8}
                onPress={() => toggleCategory(cat.key)}
              >
                {selected ? (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkBadgeText}>✓</Text>
                  </View>
                ) : null}
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {errors.categories ? <Text style={styles.errorText}>{errors.categories}</Text> : null}

        {/* Your Role */}
        <Text style={[styles.label, styles.labelSpacing]}>Your Role</Text>
        <View style={styles.roleGrid}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r}
              style={styles.roleRow}
              activeOpacity={0.7}
              onPress={() => handleRoleSelect(r)}
            >
              <View style={styles.radioOuter}>
                {role === r ? <View style={styles.radioInner} /> : null}
              </View>
              <Text style={styles.radioLabel}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.role ? <Text style={styles.errorText}>{errors.role}</Text> : null}

        {/* Finish Setup button */}
        <TouchableOpacity
          style={styles.finishButton}
          activeOpacity={0.85}
          onPress={handleFinishSetup}
        >
          <Text style={styles.finishText}>Finish Setup</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    flexGrow: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 12,
  },
  backArrow: {
    fontSize: 22,
    color: COLORS.navy,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '31%',
    aspectRatio: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  categoryCardSelected: {
    borderColor: COLORS.blue,
    backgroundColor: COLORS.lightBlueBg,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  categoryEmoji: {
    fontSize: 26,
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.navy,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 2,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 12,
  },
  labelSpacing: {
    marginTop: 12,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 16,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.blue,
  },
  radioLabel: {
    fontSize: 15,
    color: COLORS.navy,
  },
  finishButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  finishText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});