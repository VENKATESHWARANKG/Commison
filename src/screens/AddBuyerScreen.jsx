import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../app/utils/theme';
import { validateName, validateMobile, validateEmail, validateRequired } from '../app/utils/validators';

export default function AddBuyerScreen({ navigation = null, onBack, onSave }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gst, setGst] = useState('');
  const [errors, setErrors] = useState({});

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
  };

  const clearError = (field) => setErrors((e) => ({ ...e, [field]: '' }));

  const validate = () => {
    const next = {
      name: validateName(name),
      mobile: validateMobile(mobile),
      email: validateEmail(email, false),
      address: validateRequired(address, 'Address'),
    };
    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const handleSave = () => {
    if (!validate()) return;
    if (onSave) onSave({ name: name.trim(), mobile, email: email.trim(), address: address.trim(), gst: gst.trim() });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Buyer</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Buyer Name</Text>
          <View style={[styles.inputRow, errors.name ? styles.inputRowError : null]}>
            <TextInput
              style={styles.input}
              placeholder="Enter buyer's full name"
              placeholderTextColor={COLORS.lightGray}
              value={name}
              onChangeText={(t) => { setName(t); clearError('name'); }}
              autoCapitalize="words"
            />
          </View>
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Mobile Number</Text>
          <View style={[styles.inputRow, errors.mobile ? styles.inputRowError : null]}>
            <Text style={styles.prefixText}>+91</Text>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="Enter mobile number"
              placeholderTextColor={COLORS.lightGray}
              keyboardType="number-pad"
              maxLength={10}
              value={mobile}
              onChangeText={(t) => { setMobile(t.replace(/[^0-9]/g, '')); clearError('mobile'); }}
            />
          </View>
          {errors.mobile ? <Text style={styles.errorText}>{errors.mobile}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Email Address (optional)</Text>
          <View style={[styles.inputRow, errors.email ? styles.inputRowError : null]}>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              placeholderTextColor={COLORS.lightGray}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(t) => { setEmail(t); clearError('email'); }}
            />
          </View>
          {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Address</Text>
          <View style={[styles.inputRow, styles.textArea, errors.address ? styles.inputRowError : null]}>
            <TextInput
              style={[styles.input, styles.textAreaInput]}
              placeholder="Enter full address"
              placeholderTextColor={COLORS.lightGray}
              value={address}
              onChangeText={(t) => { setAddress(t); clearError('address'); }}
              multiline
            />
          </View>
          {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>GSTIN (optional)</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Enter GST number"
              placeholderTextColor={COLORS.lightGray}
              autoCapitalize="characters"
              value={gst}
              onChangeText={setGst}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
            <Text style={styles.saveText}>Save Buyer</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  container: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.navy, marginBottom: 8 },
  labelSpacing: { marginTop: 16 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputRowError: { borderColor: COLORS.red },
  prefixText: { fontSize: 15, color: COLORS.navy, fontWeight: '600' },
  divider: { width: 1, height: '60%', backgroundColor: COLORS.border, marginHorizontal: 12 },
  input: { flex: 1, fontSize: 15, color: COLORS.navy },
  textArea: { height: 90, alignItems: 'flex-start', paddingTop: 12 },
  textAreaInput: { height: '100%', textAlignVertical: 'top' },
  errorText: { fontSize: 12, color: COLORS.red, marginTop: 6 },
  saveButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});