import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../app/utils/theme';

// options: ['Credit', 'Cash'] or [{ value, label }]. Values can be strings or booleans.
const normalize = (o) => (typeof o === 'string' ? { value: o, label: o } : o);

export default function RadioGroup({ value, options = [], onChange, vertical = false }) {
  return (
    <View style={[styles.group, vertical ? styles.groupVertical : null]}>
      {options.map(normalize).map((o) => {
        const on = o.value === value;
        return (
          <TouchableOpacity
            key={String(o.value)}
            style={[styles.item, vertical ? styles.itemVertical : null]}
            onPress={() => onChange && onChange(o.value)}
            activeOpacity={0.7}
          >
            <View style={[styles.outer, on ? styles.outerOn : null]}>{on ? <View style={styles.inner} /> : null}</View>
            <Text style={[styles.label, on ? styles.labelOn : null]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', flexWrap: 'wrap' },
  groupVertical: { flexDirection: 'column' },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, marginRight: 22 },
  itemVertical: { marginRight: 0 },
  outer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  outerOn: { borderColor: COLORS.blue },
  inner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.blue },
  label: { fontSize: 14, color: COLORS.navy },
  labelOn: { fontWeight: '700' },
});