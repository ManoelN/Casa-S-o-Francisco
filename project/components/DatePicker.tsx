import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Platform, Alert } from 'react-native';
import { Calendar } from 'lucide-react-native';

interface DatePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  required?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({ 
  label, 
  value, 
  onChange, 
  required = false 
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [dateString, setDateString] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Format date to dd/mm/yyyy
  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Parse dd/mm/yyyy to Date
  const parseDateString = (str: string): Date | null => {
    // Remove qualquer caractere que não seja número
    const cleaned = str.replace(/\D/g, '');
    
    // Se não tiver 8 dígitos (ddmmyyyy), retorna null
    if (cleaned.length !== 8) return null;
    
    // Extrai dia, mês e ano
    const day = parseInt(cleaned.slice(0, 2), 10);
    const month = parseInt(cleaned.slice(2, 4), 10) - 1; // Mês é base 0 no JavaScript
    const year = parseInt(cleaned.slice(4, 8), 10);
    
    // Validações básicas
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31) return null;
    if (month < 0 || month > 11) return null;
    if (year < 1900 || year > 2100) return null;
    
    // Cria a data
    const date = new Date(year, month, day);
    
    // Verifica se a data é válida e se os valores correspondem
    if (
      isNaN(date.getTime()) ||
      date.getDate() !== day ||
      date.getMonth() !== month ||
      date.getFullYear() !== year
    ) {
      return null;
    }
    
    return date;
  };

  // Initialize date string
  useEffect(() => {
    setDateString(formatDate(value));
  }, [value]);

  const handleDateChange = (increment: number) => {
    const newDate = new Date(value);
    newDate.setDate(newDate.getDate() + increment);
    onChange(newDate);
  };

  const handleTextChange = (text: string) => {
    // Remove todos os caracteres não numéricos
    const cleaned = text.replace(/\D/g, '');
    
    // Limita o tamanho máximo para 8 dígitos (ddmmyyyy)
    const limited = cleaned.slice(0, 8);
    
    // Aplica a formatação
    let formatted = '';
    
    // Se tiver pelo menos 1 dígito, adiciona o dia
    if (limited.length > 0) {
      let day = limited.slice(0, 2);
      // Se o dia for maior que 31, limita para 31
      if (parseInt(day, 10) > 31) {
        day = '31';
      }
      formatted = day;
      
      // Se tiver mais de 2 dígitos, adiciona a barra e o mês
      if (limited.length > 2) {
        formatted += '/';
        let month = limited.slice(2, 4);
        // Se o mês for maior que 12, limita para 12
        if (parseInt(month, 10) > 12) {
          month = '12';
        }
        formatted += month;
        
        // Se tiver mais de 4 dígitos, adiciona a barra e o ano
        if (limited.length > 4) {
          formatted += '/';
          // Limita o ano a 4 dígitos
          const year = limited.slice(4, 8);
          formatted += year;
        }
      }
    }
    
    setDateString(formatted);
    
    // Se tivermos uma data completa (dd/mm/yyyy), tenta validar
    if (formatted.length === 10) {
      const parsedDate = parseDateString(formatted.replace(/\D/g, ''));
      if (parsedDate) {
        onChange(parsedDate);
      }
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    
    // Se a data estiver vazia, usa a data atual
    if (!dateString) {
      const today = new Date();
      setDateString(formatDate(today));
      onChange(today);
      return;
    }
    
    // Se a data estiver incompleta, completa com zeros
    const parts = dateString.split('/');
    if (parts.length < 3) {
      const today = new Date();
      const day = parts[0] || today.getDate().toString().padStart(2, '0');
      const month = parts[1] || (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear().toString();
      const formattedDate = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      
      const parsedDate = parseDateString(formattedDate.replace(/\D/g, ''));
      if (parsedDate) {
        setDateString(formatDate(parsedDate));
        onChange(parsedDate);
      } else {
        setDateString(formatDate(value));
      }
      return;
    }
    
    // Se a data estiver completa, valida
    const parsedDate = parseDateString(dateString.replace(/\D/g, ''));
    if (parsedDate) {
      setDateString(formatDate(parsedDate));
      onChange(parsedDate);
    } else {
      // Se a data for inválida, volta para o valor anterior
      setDateString(formatDate(value));
      Alert.alert('Data inválida', 'Por favor, insira uma data válida no formato dd/mm/aaaa');
    }
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={styles.inputContainer}>
        {isEditing ? (
          <TextInput
            style={[styles.dateInput, styles.dateText]}
            value={dateString}
            onChangeText={handleTextChange}
            onBlur={handleBlur}
            keyboardType="number-pad"
            placeholder="dd/mm/aaaa"
            maxLength={10}
            autoFocus
          />
        ) : (
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.dateText}>{formatDate(value)}</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          onPress={() => setShowPicker(!showPicker)}
          style={styles.calendarButton}
        >
          <Calendar size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
      
      {showPicker && (
        <View style={styles.dateControls}>
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => handleDateChange(-1)}
          >
            <Text style={styles.controlText}>-1 dia</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => handleDateChange(1)}
          >
            <Text style={styles.controlText}>+1 dia</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => handleDateChange(7)}
          >
            <Text style={styles.controlText}>+7 dias</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton} 
            onPress={() => handleDateChange(30)}
          >
            <Text style={styles.controlText}>+30 dias</Text>
          </TouchableOpacity>
        </View>
      )}
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  dateButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dateInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    height: '100%',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
  },
  calendarButton: {
    padding: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#d1d5db',
  },
  dateControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  controlButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  controlText: {
    fontSize: 14,
    color: '#374151',
  },
});