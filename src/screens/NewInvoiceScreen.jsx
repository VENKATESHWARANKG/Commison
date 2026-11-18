import React, { useState, useMemo } from 'react';
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

export default function NewInvoiceScreen({ navigation = null, buyers = ['Ravi Traders', 'S.K. Enterprises'], onBack, onSave }) {
  const [buyer, setBuyer] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [rate, setRate] = useState('');
  const [date, setDate] = useState('');
  const [errors, setErrors] = useState({});

  const amount = useMemo(() => {
    const q = parseFloat(quantity);
    const r = parseFloat(rate);
    if (!q || !r) return '';
    return (q * r).toFixed(2);
  }, [quantity, rate]);

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
  };

  const clearError = (field) => setErrors((e) => ({ ...e, [field]: '' }));

  const validate = () => {
    const next = {
      buyer: validateRequired(buyer, 'Buyer'),
      itemDescription: validateRequired(itemDescription, 'Item description'),
      quantity: validateAmount(quantity),
      rate: validateAmount(rate),
      date: validateRequired(date, 'Date'),
    };
    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const handleSave = () => {
    if (!validate()) return;
    const invoice = { buyer, itemDescription, quantity, rate, amount, date };
    if (onSave) onSave(invoice);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Invoice</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Buyer</Text>
          <View style={[styles.inputRow, errors.buyer ? styles.inputRowError : null]}>
            <TextInput
              style={styles.input}
              placeholder="Select or type buyer name"
              placeholderTextColor={COLORS.lightGray}
              value={buyer}
              onChangeText={(t) => { setBuyer(t); clearError('buyer'); }}
            />
          </View>
          {buyers.length > 0 ? (
            <View style={styles.chipRow}>
              {buyers.map((b) => (
                <TouchableOpacity key={b} style={styles.chip} onPress={() => { setBuyer(b); clearError('buyer'); }}>
                  <Text style={styles.chipText}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          {errors.buyer ? <Text style={styles.errorText}>{errors.buyer}</Text> : null}

          <Text style={[styles.label, styles.labelSpacing]}>Item Description</Text>
          <View style={[styles.inputRow, errors.itemDescription ? styles.inputRowError : null]}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Basmati Rice 25kg bags"
              placeholderTextColor={COLORS.lightGray}
              value={itemDescription}
              onChangeText={(t) => { setItemDescription(t); clearError('itemDescription'); }}
            />
          </View>
          {errors.itemDescription ? <Text style={styles.errorText}>{errors.itemDescription}</Text> : null}

          <View style={styles.row2}>
            <View style={styles.col}>
              <Text style={[styles.label, styles.labelSpacing]}>Quantity</Text>
              <View style={[styles.inputRow, errors.quantity ? styles.inputRowError : null]}>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={COLORS.lightGray}
                  keyboardType="decimal-pad"
                  value={quantity}
                  onChangeText={(t) => { setQuantity(t.replace(/[^0-9.]/g, '')); clearError('quantity'); }}
                />
              </View>
              {errors.quantity ? <Text style={styles.errorText}>{errors.quantity}</Text> : null}
            </View>
            <View style={styles.colGap} />
            <View style={styles.col}>
              <Text style={[styles.label, styles.labelSpacing]}>Rate (₹)</Text>
              <View style={[styles.inputRow, errors.rate ? styles.inputRowError : null]}>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={COLORS.lightGray}
                  keyboardType="decimal-pad"
                  value={rate}
                  onChangeText={(t) => { setRate(t.replace(/[^0-9.]/g, '')); clearError('rate'); }}
                />
              </View>
              {errors.rate ? <Text style={styles.errorText}>{errors.rate}</Text> : null}
            </View>
          </View>

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>{amount ? `₹ ${amount}` : '₹ 0.00'}</Text>
          </View>

          <Text style={[styles.label, styles.labelSpacing]}>Invoice Date</Text>
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

          <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
            <Text style={styles.saveText}>Save Invoice</Text>
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
  row2: { flexDirection: 'row' },
  col: { flex: 1 },
  colGap: { width: 12 },
  amountBox: {
    backgroundColor: COLORS.greenBg,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  amountValue: { fontSize: 18, color: COLORS.green, fontWeight: '700' },
  saveButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});