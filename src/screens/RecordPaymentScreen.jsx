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
import { validateRequired, validateAmount } from '../app/utils/validators';

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque'];

export default function RecordPaymentScreen({ navigation = null, parties = ['Ravi Traders', 'S.K. Enterprises'], onBack, onSave }) {
  const [party, setParty] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('Cash');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
  };

  const clearError = (field) => setErrors((e) => ({ ...e, [field]: '' }));

  const validate = () => {
    const next = {
      party: validateRequired(party, 'Party name'),
      amount: validateAmount(amount),
      date: validateRequired(date, 'Date'),
    };
    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const handleSave = () => {
    if (!validate()) return;
    if (onSave) onSave({ party, amount, mode, date, notes: notes.trim() });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Payment</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Party Name</Text>
          <View style={[styles.inputRow, errors.party ? styles.inputRowError : null]}>
            <TextInput
              style={styles.input}
              placeholder="Select or type party name"
              placeholderTextColor={COLORS.lightGray}
              value={party}
              onChangeText={(t) => { setParty(t); clearError('party'); }}
            />
          </View>
          {parties.length > 0 ? (
            <View style={styles.chipRow}>
              {parties.map((p) => (
                <TouchableOpacity key={p} style={styles.chip} onPress={() => { setParty(p); clearError('party'); }}>
                  <Text style={styles.chipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          {errors.party ? <Text style={styles.errorText}>{errors.party}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Amount (₹)</Text>
          <View style={[styles.inputRow, errors.amount ? styles.inputRowError : null]}>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={COLORS.lightGray}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(t) => { setAmount(t.replace(/[^0-9.]/g, '')); clearError('amount'); }}
            />
          </View>
          {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Payment Mode</Text>
          <View style={styles.modeGrid}>
            {PAYMENT_MODES.map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeChip, mode === m ? styles.modeChipSelected : null]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.modeChipText, mode === m ? styles.modeChipTextSelected : null]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, styles.labelSpacing]}>Payment Date</Text>
          <View style={[styles.inputRow, errors.date ? styles.inputRowError : null]}>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={COLORS.lightGray}
              value={date}
              onChangeText={(t) => { setDate(t); clearError('date'); }}
            />
          </View>
          {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Notes (optional)</Text>
          <View style={[styles.inputRow, styles.textArea]}>
            <TextInput
              style={[styles.input, styles.textAreaInput]}
              placeholder="Add a note"
              placeholderTextColor={COLORS.lightGray}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
            <Text style={styles.saveText}>Save Payment</Text>
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
  input: { flex: 1, fontSize: 15, color: COLORS.navy },
  textArea: { height: 90, alignItems: 'flex-start', paddingTop: 12 },
  textAreaInput: { height: '100%', textAlignVertical: 'top' },
  errorText: { fontSize: 12, color: COLORS.red, marginTop: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: { fontSize: 12, color: COLORS.navy },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  modeChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  modeChipSelected: { borderColor: COLORS.blue, backgroundColor: '#EEF2FF' },
  modeChipText: { fontSize: 13, color: COLORS.navy, fontWeight: '500' },
  modeChipTextSelected: { color: COLORS.blue, fontWeight: '700' },
  saveButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});