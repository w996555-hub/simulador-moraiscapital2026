export const formatBRL = (value: number | undefined | null) => {
  if (value === undefined || value === null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatPercent = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '0,00%';
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatInt = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '0';
  return new Intl.NumberFormat('pt-BR').format(value);
};