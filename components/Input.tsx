import React from 'react';
import { TextInput, Text, View, StyleSheet, TextInputProps } from 'react-native';
import { formatCurrencyInput, parseCurrencyInput } from '@/utils/validation';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  currency?: boolean;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  required = false,
  currency = false,
  style,
  onChangeText,
  value,
  ...props 
}) => {
  const handleCurrencyChange = (text: string) => {
    if (currency && onChangeText) {
      const formatted = formatCurrencyInput(text);
      // Para campos de moeda, mantemos o valor formatado internamente
      // mas enviamos o valor numérico para o estado
      const numericValue = parseCurrencyInput(text);
      onChangeText(formatted);
    } else if (onChangeText) {
      onChangeText(text);
    }
  };

  // Para campos de moeda, o valor já vem formatado
  const displayValue = currency ? (value || 'R$ 0,00') : value;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style
        ]}
        value={displayValue}
        onChangeText={handleCurrencyChange}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  required: {
    color: '#dc2626',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#ffffff',
    minHeight: 44,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
});