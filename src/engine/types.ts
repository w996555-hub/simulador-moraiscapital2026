// ─────────────────────────────────────────────────────────────
// TIPOS BASE
// ─────────────────────────────────────────────────────────────

export type TipoAbatimento = "RATEAR" | "DESCONTAR";
export type TipoParcela = "MEIA" | "INTEGRAL";
export type TipoLance = "SORTEIO" | "LANCE LIVRE" | "FIDELIDADE" | "SEM LANCE";
export type UsaEmbutido = "SIM" | "NÃO";
export type AbatimentoLance = "REDUZIR PARCELA" | "REDUZIR PRAZO";
export type VendeCarta = "SIM" | "NÃO";
export type TipoSeguro = "IMÓVEL" | "VEÍCULO" | "NENHUM";

// ─────────────────────────────────────────────────────────────
// INPUTS DO USUÁRIO (aba Simular)
// ─────────────────────────────────────────────────────────────

export interface InputsConsorcio {
  nomeCliente?: string;          // Nome do cliente
  
  // DADOS DO GRUPO
  credito: number;               // Valor do crédito (R$)
  taxaAdm: number;               // Taxa administrativa total (ex: 0.22)
  fundoReserva: number;          // Fundo de reserva (ex: 0.01)
  prazoGrupo: number;            // Prazo total do grupo em meses
  correcaoCredito: number;       // Correção anual do crédito (ex: 0.04)

  // ENTRADA NO GRUPO
  parcelasRestantes: number;     // Parcelas restantes quando entrou
  parcelasPagasAtéContemplar: number; // Qtd de meias parcelas pagas pré-contemplação
  meiaParcela: TipoParcela;      // MEIA ou INTEGRAL
  abateOuRatea: TipoAbatimento;  // RATEAR ou DESCONTAR vencidas

  // LANCE
  tipoLance: TipoLance;          // SORTEIO, LANCE LIVRE, FIDELIDADE, SEM LANCE
  valorLanceLivre: number;       // Valor em R$ do lance livre (0 se sorteio)
  usaEmbutido: UsaEmbutido;      // SIM = usa 30% embutido do crédito no lance
  abatimentoLance: AbatimentoLance; // REDUZIR PARCELA ou REDUZIR PRAZO

  // OUTROS
  tipoSeguro: TipoSeguro;        // IMÓVEL, VEÍCULO ou NENHUM
  vendeCarta: VendeCarta;        // SIM = vende a carta na contemplação
  percentualRecompra: number;    // % do crédito recebido na recompra (ex: 0.20)
  txInvestimentoComparativo: number; // Taxa mensal do investimento alternativo
  retornoAluguelMes: number;     // Rentabilidade do aluguel ao mês (ex: 0.005)
  correcaoImovelAno: number;     // Valorização anual do imóvel (ex: 0.06)
}

// ─────────────────────────────────────────────────────────────
// LINHA DA TABELA DE FLUXO MENSAL
// ─────────────────────────────────────────────────────────────

export interface LinhaTabela {
  parcela: number;               // Número da parcela
  creditoAtualizado: number;     // Crédito corrigido no mês (R$)
  parcelaCheiaCorrigida: number; // Parcela cheia corrigida (R$)
  oquePaga: number;              // O que paga nessa parcela (R$)
  fluxoCaixa: number;            // Fluxo de caixa líquido
  boletoLance: number;           // Boleto lance (só na parcela da contemplação)
  fluxoTotal: number;            // fluxoCaixa + boletoLance
  desembolsoAcumulado: number;   // Soma acumulada de saídas
  parcelaBaseFixa: number;       // Parcela base do período (col I)
  aluguelEstimado: number;       // Aluguel estimado pós-contemplação (col J)
  difAluguelParcela: number;     // Diferença aluguel - parcela (col K)
  parcelaBaseFuro: number;       // Parcela base "furo" (col L)
  seguroMensal: number;          // Valor do seguro no mês
  taxaAdmMensal: number;         // Taxa ADM no mês
  amortCorrecaoMensal: number;   // Amortização + correção (col O)
  auxilioVenda: number;          // Auxílio venda (col P)
  fluxoVenda: number;            // Fluxo total venda (col Q)
}

// ─────────────────────────────────────────────────────────────
// RESULTADOS CALCULADOS
// ─────────────────────────────────────────────────────────────

export interface ResultadosConsorcio {
  // Parâmetros derivados
  parcelaBase: number;
  parcelaEntrada: number;        // número da parcela de entrada
  parcelaContemplacao: number;   // número da parcela de contemplação
  parcelasVencidas: number;
  parcelasPagasPreContemplacao: number;
  saldoMeiasNaoPagas: number;
  valorAcumuladoInvestido: number;
  saldoDevedor: number;
  lanceEmReais: number;
  lanceEmParcelas: number;
  prazoAposContemplacao: number;
  prazoMantido: number;
  parcelaInicial: number;
  desembolso: number;
  creditoDaCarta: number;
  creditoNaContemplacao: number;
  parcelaPosContemplacao: number;
  prazoRestante: number;
  percentualLanceTotal: number;
  boletoLanceLivre: number;

  // Alavancagem Patrimonial
  aluguelEstimado: number;
  diferencaAPagar: number;

  // Alavancagem Financeira (venda da carta)
  lucroLiquidoVenda: number;
  retornoAoMes: number;
  retornoTotalPercent: number;

  // Alavancagem de Aplicação
  custoTotal: number;
  valorCorrigidoAplicacao: number;
  lucroLiquidoAplicacao: number;
  retornoAplicacaoPercent: number;

  // Tabela de fluxo
  tabela: LinhaTabela[];
}

// ─────────────────────────────────────────────────────────────
// FINANCIAMENTO
// ─────────────────────────────────────────────────────────────

export interface InputsFinanciamento {
  prazoFin: number;             // Prazo financiamento em meses (ex: 420)
  taxaJuros: number;            // Taxa de juros ao ano % (ex: 10.744)
  trMensal: number;             // Taxa referencial ao mês % (ex: 0.15)
  percentualEntrada: number;    // Entrada % (ex: 20)
  seguroMIP: number;            // Seguro MIP % saldo devedor (ex: 0.0116)
  seguroDFI: number;            // Seguro DFI % valor do imóvel (ex: 0.00827)
  taxaAdm: number;              // Taxa adm mensal R$ (ex: 25.00)
}

export interface ResultadosFinanciamento {
  valorImovel: number;
  entrada: number;
  valorFinanciado: number;
  prazo: number;
  amortizacaoMensal: number;
  taxaJurosMensal: number;
  jurosTotais: number;
  correcaoTRTotais: number;
  seguroMIPTotal: number;
  seguroDFITotal: number;
  taxaAdmTotal: number;
  custoTotalFinanciamento: number;
  parcelaInicialFin: number;
  rendaAprovacaoFin: number;
  custoFinanceiroFin: number;
  
  // PRICE extra columns matching Excel rows 95-97
  parcelaInicialPrice: number;
  totalPagoPrice: number;
}

// ─────────────────────────────────────────────────────────────
// CDB
// ─────────────────────────────────────────────────────────────

export interface InputsCDB {
  objetivo: "VALOR TOTAL" | "ENTRADA";
  corrigirParcela: "NÃO CORRIGIR" | "CORRIGIR";
  rendimentoCdb: number;        // % ao mês (ex: 1.0)
  valorizacaoImovel: number;    // % ao ano (ex: 6.0)
}

export interface LinhaTabelaCDB {
  mes: number;
  saldoBruto: number;
  totalAportado: number;
  lucroBruto: number;
  aliquotaIR: number;
  saldoLiquido: number;
  imovelCorrigido: number;
  atingiu: "SIM" | "NAO";
}

export interface ResultadosCDB {
  mesAtingido: number;
  tempoFormatado: string;
  imovelCorrigido: number;
  aporteInicial: number;
  totalAportado: number;
  rendimentoAcumulado: number;
  irPago: number;
  saldoLiquido: number;
  aluguelAcumulado: number;
  custoTotalCdb: number;
  economiaConsorcio: number;
  economiaPercent: number;
  tabela: LinhaTabelaCDB[];
}

export interface PropostaResumo {
  id: string;
  nome_cliente: string;
  credito_simulado: number;
  criado_em: string;
}

