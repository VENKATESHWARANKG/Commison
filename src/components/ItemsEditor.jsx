import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../app/utils/theme';
import { validateRequired } from '../app/utils/validators';
import RadioGroup from './RadioGroup';

let keyCounter = 0;

const GST_RATES = ['0', '5', '12', '18', '28'];

export function createEmptyItem() {
  keyCounter += 1;
  return { key: `item-${Date.now()}-${keyCounter}`, description: '', quantity: '', rate: '', taxRate: '18' };
}

export function lineAmount(item) {
  const q = parseFloat(item.quantity);
  const r = parseFloat(item.rate);
  return q && r ? q * r : 0;
}

export function itemsTotal(items) {
  return items.reduce((sum, item) => sum + lineAmount(item), 0);
}

// GST on one line (rate is a percentage, applied on top of the line amount)
export function lineTax(item) {
  return (lineAmount(item) * (Number(item.taxRate) || 0)) / 100;
}

export function itemsTax(items) {
  return items.reduce((sum, item) => sum + lineTax(item), 0);
}

function validatePositive(value) {
  if (!value) return 'Required';
  if (!/^\d+(\.\d+)?$/.test(value) || Number(value) <= 0) return 'Invalid';
  return '';
}

// Returns { errors: [{description, quantity, rate}, ...], valid: boolean } — one entry per item.
export function validateItems(items) {
  const errors = items.map((item) => ({
    description: validateRequired(item.description, 'Description'),
    quantity: validatePositive(item.quantity),
    rate: validatePositive(item.rate),
  }));
  const valid = errors.every((e) => !e.description && !e.quantity && !e.rate);
  return { errors, valid };
}

// Clean version to save: numbers instead of strings, plus the computed line amount.
export function serializeItems(items, taxable = false) {
  return items.map((item) => {
    const base = {
      description: item.description.trim(),
      quantity: Number(item.quantity),
      rate: Number(item.rate),
      amount: Number(lineAmount(item).toFixed(2)),
    };
    if (!taxable) return base;
    return {
      ...base,
      taxRate: Number(item.taxRate) || 0,
      taxAmount: Number(lineTax(item).toFixed(2)),
    };
  });
}

export default function ItemsEditor({ items, onChange, errors = [], onErrorsChange, taxable = false }) {
  const updateItem = (index, field, value) => {
    const cleaned = field === 'description' ? value : value.replace(/[^0-9.]/g, '');
    onChange(items.map((it, i) => (i === index ? { ...it, [field]: cleaned } : it)));
    if (onErrorsChange && errors[index] && errors[index][field]) {
      onErrorsChange(errors.map((e, i) => (i === index ? { ...e, [field]: '' } : e)));
    }
  };

  const addItem = () => onChange([...items, createEmptyItem()]);

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
    if (onErrorsChange) onErrorsChange(errors.filter((_, i) => i !== index));
  };

  return (
    <View>
      {items.map((item, index) => {
        const err = errors[index] || {};
        const amount = lineAmount(item);
        return (
          <View key={item.key} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Item {index + 1}</Text>
              {items.length > 1 ? (
                <TouchableOpacity onPress={() => removeItem(index)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={[styles.inputRow, err.description ? styles.inputRowError : null]}>
              <TextInput
                style={styles.input}
                placeholder="Item description"
                placeholderTextColor={COLORS.lightGray}
                value={item.description}
                onChangeText={(t) => updateItem(index, 'description', t)}
              />
            </View>
            {err.description ? <Text style={styles.errorText}>{err.description}</Text> : null}

            <View style={styles.row3}>
              <View style={styles.col}>
                <Text style={styles.smallLabel}>Qty</Text>
                <View style={[styles.inputRow, err.quantity ? styles.inputRowError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={COLORS.lightGray}
                    keyboardType="decimal-pad"
                    value={item.quantity}
                    onChangeText={(t) => updateItem(index, 'quantity', t)}
                  />
                </View>
                {err.quantity ? <Text style={styles.errorText}>{err.quantity}</Text> : null}
              </View>
              <View style={styles.colGap} />
              <View style={styles.col}>
                <Text style={styles.smallLabel}>Rate (₹)</Text>
                <View style={[styles.inputRow, err.rate ? styles.inputRowError : null]}>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={COLORS.lightGray}
                    keyboardType="decimal-pad"
                    value={item.rate}
                    onChangeText={(t) => updateItem(index, 'rate', t)}
                  />
                </View>
                {err.rate ? <Text style={styles.errorText}>{err.rate}</Text> : null}
              </View>
              <View style={styles.colGap} />
              <View style={styles.col}>
                <Text style={styles.smallLabel}>Amount</Text>
                <View style={[styles.inputRow, styles.amountRow]}>
                  <Text style={styles.amountText}>₹ {amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
                </View>
              </View>
            </View>
            {taxable ? (
              <View style={styles.taxRow}>
                <Text style={styles.smallLabel}>GST Rate</Text>
                <RadioGroup
                  value={String(item.taxRate)}
                  options={GST_RATES.map((rate) => ({ value: rate, label: `${rate}%` }))}
                  onChange={(rate) => updateItem(index, 'taxRate', rate)}
                />
                <Text style={styles.taxAmountText}>GST ₹ {lineTax(item).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
              </View>
            ) : null}
          </View>
        );
      })}

      <TouchableOpacity style={styles.addButton} onPress={addItem} activeOpacity={0.7}>
        <Text style={styles.addButtonText}>＋ Add Another Item</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    backgroundColor: COLORS.white,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.navy },
  removeText: { fontSize: 12, fontWeight: '600', color: COLORS.red },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  inputRowError: { borderColor: COLORS.red },
  input: { flex: 1, fontSize: 14, color: COLORS.navy, padding: 0 },
  errorText: { fontSize: 11, color: COLORS.red, marginTop: 4 },
  row3: { flexDirection: 'row', marginTop: 10 },
  col: { flex: 1 },
  colGap: { width: 8 },
  smallLabel: { fontSize: 11, fontWeight: '600', color: COLORS.gray, marginBottom: 6 },
  amountRow: { backgroundColor: COLORS.bg, borderColor: COLORS.bg },
  amountText: { fontSize: 13, fontWeight: '700', color: COLORS.navy },
  taxRow: { marginTop: 12 },
  rateChips: { flexDirection: 'row', flexWrap: 'wrap' },
  rateChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 6,
  },
  rateChipActive: { borderColor: COLORS.blue, backgroundColor: '#EEF2FF' },
  rateChipText: { fontSize: 12, color: COLORS.navy, fontWeight: '500' },
  rateChipTextActive: { color: COLORS.blue, fontWeight: '700' },
  taxAmountText: { fontSize: 12, color: COLORS.gray, marginTop: 2, textAlign: 'right' },
  addButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.blue,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: { fontSize: 13, fontWeight: '700', color: COLORS.blue },
});