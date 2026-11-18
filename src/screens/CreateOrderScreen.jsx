import { useEffect, useMemo, useState } from 'react';
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
import { dataStore } from '../app/utils/dataStore';
import { COLORS } from '../app/utils/theme';
import { validateRequired } from '../app/utils/validators';
import DateField, { formatDate } from '../components/DateField';
import DropdownField from '../components/DropdownField';
import ItemsEditor, {
  createEmptyItem,
  itemsTotal,
  serializeItems,
  validateItems,
} from '../components/ItemsEditor';
import RadioGroup from '../components/RadioGroup';

const ORDER_TYPES = ['Sales Order', 'Purchase Order'];

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export default function CreateOrderScreen({ navigation = null, onBack, onSave }) {
  const [orderType, setOrderType] = useState('Sales Order');
  const [party, setParty] = useState('');
  const [orderDate, setOrderDate] = useState(new Date());
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [items, setItems] = useState(() => [createEmptyItem()]);
  const [itemErrors, setItemErrors] = useState([]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});

  const [buyerNames, setBuyerNames] = useState([]);
  const [sellerNames, setSellerNames] = useState([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [buyers, sellers] = await Promise.all([dataStore.buyers.getAll(), dataStore.sellers.getAll()]);
      if (isMounted) {
        setBuyerNames(buyers.map((b) => b.name));
        setSellerNames(sellers.map((s) => s.name));
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const isSales = orderType === 'Sales Order';
  const partyLabel = isSales ? 'Buyer' : 'Seller';
  const partyOptions = isSales ? buyerNames : sellerNames;
  const total = useMemo(() => itemsTotal(items), [items]);

  const handleBack = () => {
    if (onBack) return onBack();
    if (navigation) navigation.goBack();
  };

  const clearError = (field) => setErrors((e) => ({ ...e, [field]: '' }));

  const validate = () => {
    const next = {
      party: validateRequired(party, partyLabel),
      orderDate: orderDate ? '' : 'Order date is required',
      deliveryDate: deliveryDate ? '' : 'Delivery date is required',
    };
    if (orderDate && deliveryDate && startOfDay(deliveryDate) < startOfDay(orderDate)) {
      next.deliveryDate = 'Delivery date cannot be before the order date';
    }
    const { errors: itemErrs, valid: itemsValid } = validateItems(items);
    setItemErrors(itemErrs);
    setErrors(next);
    return itemsValid && Object.values(next).every((v) => !v);
  };

  const handleSave = () => {
    if (!validate()) return;
    if (onSave) {
      onSave({
        orderType,
        side: isSales ? 'sales' : 'purchase',
        party: party.trim(),
        orderDate: formatDate(orderDate),
        deliveryDate: formatDate(deliveryDate),
        items: serializeItems(items),
        amount: Number(total.toFixed(2)),
        notes: notes.trim(),
        status: 'Pending',
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Form</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Order Type</Text>
          <RadioGroup
            value={orderType}
            options={ORDER_TYPES}
            onChange={(v) => { setOrderType(v); setParty(''); clearError('party'); }}
          />

          <Text style={[styles.label, styles.labelSpacing]}>{partyLabel}</Text>
          <DropdownField
            value={party}
            options={partyOptions}
            allowCustom
            title={`Select ${partyLabel}`}
            placeholder={`Select or search a ${partyLabel.toLowerCase()}`}
            error={errors.party}
            onSelect={(v) => { setParty(v); clearError('party'); }}
          />
          {errors.party ? <Text style={styles.errorText}>{errors.party}</Text> : null}

          <View style={styles.row2}>
            <View style={styles.col}>
              <Text style={[styles.label, styles.labelSpacing]}>Order Date</Text>
              <DateField
                value={orderDate}
                onChange={(d) => { setOrderDate(d); clearError('orderDate'); }}
                placeholder="Order date"
                error={errors.orderDate}
              />
              {errors.orderDate ? <Text style={styles.errorText}>{errors.orderDate}</Text> : null}
            </View>
            <View style={styles.colGap} />
            <View style={styles.col}>
              <Text style={[styles.label, styles.labelSpacing]}>Delivery Date</Text>
              <DateField
                value={deliveryDate}
                onChange={(d) => { setDeliveryDate(d); clearError('deliveryDate'); }}
                placeholder="Expected delivery"
                error={errors.deliveryDate}
                minimumDate={orderDate || undefined}
              />
              {errors.deliveryDate ? <Text style={styles.errorText}>{errors.deliveryDate}</Text> : null}
            </View>
          </View>

          <Text style={[styles.label, styles.labelSpacing]}>Items</Text>
          <ItemsEditor
            items={items}
            onChange={setItems}
            errors={itemErrors}
            onErrorsChange={setItemErrors}
          />

          <View style={styles.totalBox}>
            <View>
              <Text style={styles.totalLabel}>Order Total</Text>
              <Text style={styles.totalSub}>{items.length} item{items.length === 1 ? '' : 's'}</Text>
            </View>
            <Text style={styles.totalValue}>₹ {total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Text>
          </View>

          <Text style={[styles.label, styles.labelSpacing]}>Notes (optional)</Text>
          <View style={[styles.inputRow, styles.textArea]}>
            <TextInput
              style={[styles.input, styles.textAreaInput]}
              placeholder="Delivery instructions, terms, etc."
              placeholderTextColor={COLORS.lightGray}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave}>
            <Text style={styles.saveText}>Save {orderType}</Text>
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
  labelSpacing: { marginTop: 18 },
  segmentRow: { flexDirection: 'row' },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 10,
    borderRadius: 10,
  },
  segmentActive: { backgroundColor: COLORS.navy, borderColor: COLORS.navy },
  segmentText: { fontSize: 13, color: COLORS.navy, fontWeight: '600' },
  segmentTextActive: { color: COLORS.white },
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
  row2: { flexDirection: 'row' },
  col: { flex: 1 },
  colGap: { width: 12 },
  totalBox: {
    backgroundColor: COLORS.greenBg,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  totalSub: { fontSize: 11, color: COLORS.lightGray, marginTop: 2 },
  totalValue: { fontSize: 18, color: COLORS.green, fontWeight: '700' },
  saveButton: {
    backgroundColor: COLORS.navy,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});