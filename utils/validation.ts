export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateCrediario = (data: {
  nomeCliente: string;
  enderecoCliente?: string;
  valorTotal: string;
  jurosDiario: string;
  numeroParcelas: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};
  
  // Validar nome do cliente
  if (!data.nomeCliente.trim()) {
    errors.nomeCliente = 'Nome do cliente é obrigatório';
  } else if (data.nomeCliente.trim().length < 2) {
    errors.nomeCliente = 'Nome deve ter pelo menos 2 caracteres';
  } else if (data.nomeCliente.trim().length > 100) {
    errors.nomeCliente = 'Nome deve ter no máximo 100 caracteres';
  }
  
  // Validar endereço (opcional)
  if (data.enderecoCliente && data.enderecoCliente.trim().length > 200) {
    errors.enderecoCliente = 'Endereço deve ter no máximo 200 caracteres';
  }
  
  // Validar valor total
  const valorTotal = parseCurrencyInput(data.valorTotal);
  if (!data.valorTotal || isNaN(valorTotal) || valorTotal === 0) {
    errors.valorTotal = 'Valor total é obrigatório';
  } else if (valorTotal <= 0) {
    errors.valorTotal = 'Valor total deve ser maior que zero';
  } else if (valorTotal > 999999.99) {
    errors.valorTotal = 'Valor total muito alto';
  }
  
  // Validar juros diário
  const jurosDiario = parseCurrencyInput(data.jurosDiario);
  if (data.jurosDiario && isNaN(jurosDiario)) {
    errors.jurosDiario = 'Juros diário é obrigatório';
  } else if (jurosDiario < 0) {
    errors.jurosDiario = 'Juros diário não pode ser negativo';
  } else if (jurosDiario > 100) {
    errors.jurosDiario = 'Juros diário muito alto';
  }
  
  // Validar número de parcelas
  const numeroParcelas = parseInt(data.numeroParcelas);
  if (!data.numeroParcelas || isNaN(numeroParcelas)) {
    errors.numeroParcelas = 'Número de parcelas é obrigatório';
  } else if (numeroParcelas <= 0) {
    errors.numeroParcelas = 'Número de parcelas deve ser maior que zero';
  } else if (numeroParcelas > 60) {
    errors.numeroParcelas = 'Número máximo de parcelas é 60';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateCliente = (data: {
  nome: string;
  telefone?: string;
  endereco?: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};
  
  if (!data.nome.trim()) {
    errors.nome = 'Nome é obrigatório';
  } else if (data.nome.trim().length < 2) {
    errors.nome = 'Nome deve ter pelo menos 2 caracteres';
  }
  
  if (data.telefone && data.telefone.length > 0) {
    const telefoneNumeros = data.telefone.replace(/\D/g, '');
    if (telefoneNumeros.length < 10 || telefoneNumeros.length > 11) {
      errors.telefone = 'Telefone deve ter 10 ou 11 dígitos';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatCurrencyInput = (value: string): string => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');
  
  // Se vazio, retorna R$ 0,00
  if (!numbers) return 'R$ 0,00';
  
  // Converte para número (centavos)
  const amount = parseInt(numbers) / 100;
  
  // Formata como moeda brasileira
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const parseCurrencyInput = (value: string): number => {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');
  
  // Se vazio, retorna 0
  if (!numbers) return 0;
  
  // Converte para número (centavos para reais)
  return parseInt(numbers) / 100;
};

export const formatPhone = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (numbers.length === 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};