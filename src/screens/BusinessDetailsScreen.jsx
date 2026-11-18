import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DropdownField from '../components/DropdownField';

const COLORS = {
  navy: '#1B2559',
  white: '#FFFFFF',
  gray: '#6B7280',
  lightGray: '#9CA3AF',
  border: '#E5E7EB',
  blue: '#3B5BDB',
  bg: '#FFFFFF',
  error: '#DC2626',
};

const BUSINESS_TYPES = ['Commission Agent', 'Trader', 'Distributor', 'Broker', 'Other'];

// Replace with your real data source (API, static list per country, etc.)
const CITIES = ['Bengaluru', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata'];
const STATES = ['Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Telangana', 'West Bengal'];

export default function BusinessDetailsScreen({ navigation = null, onBack, onContinue }) {
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Commission Agent');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [errors, setErrors] = useState({ businessName: '', city: '', state: '' });

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
  };

  const handleBusinessNameChange = (text) => {
    setBusinessName(text);
    if (errors.businessName) setErrors((e) => ({ ...e, businessName: '' }));
  };

  const validate = () => {
    const next = { businessName: '', city: '', state: '' };
    if (!businessName.trim()) next.businessName = 'Business name is required';
    if (!city) next.city = 'Select a city';
    if (!state) next.state = 'Select a state';
    setErrors(next);
    return !next.businessName && !next.city && !next.state;
  };

  const handleContinue = () => {
    if (!validate()) return;
    if (onContinue) {
      onContinue({
        businessName: businessName.trim(),
        businessType,
        city,
        state,
      });
    }
    // navigation?.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          {/* Heading */}
          <Text style={styles.title}>Tell us about{'\n'}your business</Text>
          <Text style={styles.subtitle}>Help us personalize your experience.</Text>

          {/* Business Name */}
          <Text style={styles.label}>Business Name</Text>
          <View style={[styles.inputRow, errors.businessName ? styles.inputRowError : null]}>
            <Text style={styles.iconText}>💼</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter business name"
              placeholderTextColor={COLORS.lightGray}
              value={businessName}
              onChangeText={handleBusinessNameChange}
            />
          </View>
          {errors.businessName ? <Text style={styles.errorText}>{errors.businessName}</Text> : null}

          {/* Business Type */}
          <Text style={[styles.label, styles.labelSpacing]}>Business Type</Text>
          <View style={styles.radioGroup}>
            {BUSINESS_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.radioRow}
                onPress={() => setBusinessType(type)}
                activeOpacity={0.7}
              >
                <View style={styles.radioOuter}>
                  {businessType === type ? <View style={styles.radioInner} /> : null}
                </View>
                <Text style={styles.radioLabel}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Business Location */}
          <Text style={[styles.label, styles.labelSpacing]}>Business Location</Text>
          <View style={styles.locationRow}>
            <View style={styles.locationField}>
              <DropdownField
                value={city}
                options={CITIES}
                allowCustom
                title="Select City"
                placeholder="Select city"
                error={errors.city}
                onSelect={(v) => { setCity(v); if (errors.city) setErrors((e) => ({ ...e, city: '' })); }}
              />
              {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
            </View>
            <View style={styles.locationGap} />
            <View style={styles.locationField}>
              <DropdownField
                value={state}
                options={STATES}
                allowCustom
                title="Select State"
                placeholder="Select state"
                error={errors.state}
                onSelect={(v) => { setState(v); if (errors.state) setErrors((e) => ({ ...e, state: '' })); }}
              />
              {errors.state ? <Text style={styles.errorText}>{errors.state}</Text> : null}
            </View>
          </View>

          {/* Continue button */}
          <TouchableOpacity
            style={styles.continueButton}
            activeOpacity={0.85}
            onPress={handleContinue}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

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
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.navy,
    lineHeight: 30,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.navy,
    marginBottom: 8,
  },
  labelSpacing: {
    marginTop: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputRowError: {
    borderColor: COLORS.error,
  },
  iconText: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.navy,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 6,
  },
  radioGroup: {
    marginTop: 4,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
  locationRow: {
    flexDirection: 'row',
  },
  locationField: {
    flex: 1,
  },
  locationGap: {
    width: 12,
  },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  selectPlaceholderText: {
    fontSize: 14,
    color: COLORS.lightGray,
  },
  selectValueText: {
    fontSize: 14,
    color: COLORS.navy,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 14,
    color: COLORS.gray,
  },
  continueButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  continueText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItemText: {
    fontSize: 15,
    color: COLORS.navy,
  },
  modalCancel: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray,
  },
});