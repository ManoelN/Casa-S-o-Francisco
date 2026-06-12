export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatDateBR = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

export const calcularDiasAtraso = (dataVencimento: string): number => {
  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  const diffTime = hoje.getTime() - vencimento.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export const adicionarMeses = (data: Date, meses: number): Date => {
  const novaData = new Date(data);
  novaData.setMonth(novaData.getMonth() + meses);
  return novaData;
};