import {
  InputsConsorcio,
  LinhaTabela,
  ResultadosConsorcio,
  InputsFinanciamento,
  ResultadosFinanciamento,
  InputsCDB,
  ResultadosCDB,
  LinhaTabelaCDB,
} from "./types";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Correção anual do crédito aplicada em blocos de 12 meses (igual ao Excel) */
function creditoNoPeriodo(credito: number, correcao: number, parcela: number): number {
  return credito * Math.pow(1 + correcao, Math.floor((parcela - 1) / 12));
}

/** % seguro conforme tipo */
function percSeguro(tipoSeguro: InputsConsorcio["tipoSeguro"]): number {
  if (tipoSeguro === "IMÓVEL") return 0.00055;
  if (tipoSeguro === "VEÍCULO") return 0.00088;
  return 0;
}

// ─────────────────────────────────────────────────────────────
// PARÂMETROS DERIVADOS (replicam Parâmetros / Parâmetros2)
// ─────────────────────────────────────────────────────────────

interface ParamsDerivados {
  parcelaEntrada: number;        // B9  = prazoGrupo - parcelasRestantes + 1
  parcelaContemplacao: number;   // B13 = parcelaEntrada + parcelasPagasAtéContemplar - 1
  parcelasVencidas: number;      // A24 = max(parcelaEntrada - 1, 0)
  parcelasPagasPreContemplacao: number; // A25 = B13 - parcelaEntrada
  parcelaBase: number;           // A23 = (credito/prazoGrupo)*(1+taxaAdm+fundo)
  percentualLance: number;       // B16
  lanceTotal: number;            // A30
  lanceEmParcelas: number;       // A32
  prazoAposContemplacao: number; // A33 = prazoGrupo - parcelaContemplacao
  prazoMantido: number;          // A34
  prazoEfetivo: number;          // A45 = prazoAposContemplacao + (meia ? meias/2 : 0)
  creditoNaContemplacao: number; // B2*(1+corr)^INT((B13-1)/12)
  creditoDaCarta: number;        // B37
  boletoLanceLivre: number;      // B40 (se LANCE LIVRE)
  desembolso: number;            // B36
  parcelaPosContemplacao: number; // B38
  prazoRestante: number;         // B39
  segPercent: number;
}

function calcularParamsDerivados(
  inp: InputsConsorcio,
  tabela: LinhaTabela[]
): ParamsDerivados {
  const {
    credito, taxaAdm, fundoReserva, prazoGrupo, correcaoCredito,
    parcelasRestantes, parcelasPagasAtéContemplar, meiaParcela,
    abateOuRatea, tipoLance, valorLanceLivre, usaEmbutido,
    abatimentoLance, vendeCarta, percentualRecompra, tipoSeguro,
  } = inp;

  const segPercent = percSeguro(tipoSeguro);
  const parcelaEntrada = prazoGrupo - parcelasRestantes + 1;        // B9
  const parcelaContemplacao = parcelaEntrada + parcelasPagasAtéContemplar - 1; // B13
  const parcelasVencidas = Math.max(parcelaEntrada - 1, 0);          // A24
  const parcelasPagasPreContemplacao = parcelaContemplacao - parcelaEntrada; // A25
  const parcelaBase = (credito / prazoGrupo) * (1 + taxaAdm + fundoReserva); // A23

  const creditoNaContemplacao = creditoNoPeriodo(credito, correcaoCredito, parcelaContemplacao); // B67

  // B16 — % lance total
  let percentualLance = 0;
  if (tipoLance === "LANCE LIVRE") {
    const embutido = usaEmbutido === "SIM" ? creditoNaContemplacao * 0.3 : 0;
    percentualLance = (valorLanceLivre + embutido) / creditoNaContemplacao;
  } else if (tipoLance === "FIDELIDADE") {
    percentualLance = 0.3;
  }

  // A30 — lance em R$
  let lanceTotal = 0;
  if (tipoLance === "LANCE LIVRE") {
    if (usaEmbutido === "SIM") {
      lanceTotal = creditoNaContemplacao * 0.3 + creditoNaContemplacao * Math.max(percentualLance - 0.3, 0);
    } else {
      lanceTotal = creditoNaContemplacao * percentualLance;
    }
  } else if (tipoLance === "FIDELIDADE") {
    lanceTotal = creditoNaContemplacao * 0.3;
  }

  // A32 — lance em parcelas
  const parcelaFull = tabela.length > 0 && parcelaContemplacao <= tabela.length
    ? tabela[parcelaContemplacao - 1].parcelaCheiaCorrigida
    : 0;
  const lanceEmParcelas = lanceTotal === 0 ? 0 : Math.floor(lanceTotal / (parcelaFull || 1));

  const prazoAposContemplacao = prazoGrupo - parcelaContemplacao; // A33
  const prazoMantido = abatimentoLance === "REDUZIR PRAZO"
    ? Math.max(0, prazoAposContemplacao - lanceEmParcelas)
    : prazoAposContemplacao; // A34

  // A45 — prazo efetivo para cálculo do fator de parcela
  const prazoEfetivo = prazoAposContemplacao + (meiaParcela === "MEIA" ? (parcelaContemplacao - parcelaEntrada + 1) / 2 : 0);

  // Desconto DESCONTAR (A27)
  const parcelaFuroNaContemplacao = tabela.length > 0 && parcelaContemplacao <= tabela.length
    ? tabela[parcelaContemplacao - 1].parcelaBaseFuro
    : 0;
  const descontoVencidas = abateOuRatea === "DESCONTAR"
    ? (parcelaEntrada - 1) * parcelaFuroNaContemplacao
    : 0;

  // Saldo meias não pagas (A26) — SUMPRODUCT das parcelas de entrada até contemplação
  let saldoMeias = 0;
  for (let i = parcelaEntrada; i <= parcelaContemplacao && i <= tabela.length; i++) {
    const row = tabela[i - 1];
    saldoMeias += abateOuRatea === "DESCONTAR" ? row.parcelaBaseFuro * 0.5 : row.parcelaBaseFixa * 0.5;
  }
  for (let i = 1; i < parcelaEntrada && i <= tabela.length; i++) {
    const row = tabela[i - 1];
    saldoMeias += abateOuRatea === "DESCONTAR" ? row.parcelaBaseFuro * 0.5 : row.parcelaBaseFixa * 0.5;
  }

  // Fator multiplicador do crédito pós-lance
  let fatorCredito = 1;
  if (tipoLance === "FIDELIDADE") fatorCredito = 1 - percentualLance;
  else if (tipoLance === "LANCE LIVRE" && usaEmbutido === "SIM") fatorCredito = 0.7;

  // B37 — crédito da carta
  let creditoDaCarta: number;
  if (vendeCarta === "SIM") {
    creditoDaCarta = creditoNaContemplacao * fatorCredito * percentualRecompra;
  } else {
    creditoDaCarta = creditoNaContemplacao * fatorCredito - (abateOuRatea === "DESCONTAR" ? descontoVencidas : 0);
  }

  // B40 — boleto lance livre
  let boletoLanceLivre = 0;
  if (tipoLance === "LANCE LIVRE") {
    if (usaEmbutido === "SIM") {
      boletoLanceLivre = creditoNaContemplacao * Math.max(percentualLance - 0.3, 0);
    } else {
      boletoLanceLivre = creditoNaContemplacao * percentualLance;
    }
  }

  // B36 — desembolso das parcelas pagas (sem incluir boleto do lance livre)
  let desembolso = 0;
  for (let i = parcelaEntrada; i <= parcelaContemplacao && i <= tabela.length; i++) {
    desembolso += tabela[i - 1].oquePaga;
  }
  if (abateOuRatea === "DESCONTAR") desembolso += descontoVencidas;
  // Nota: boletoLanceLivre NÃO entra em B36 — é reportado separado em B40

  // B38 — parcela pós contemplação
  let parcelaPosContemplacao = 0;
  if (vendeCarta === "SIM") {
    parcelaPosContemplacao = creditoDaCarta - desembolso;
  } else if (parcelaContemplacao + 1 <= tabela.length) {
    parcelaPosContemplacao = tabela[parcelaContemplacao].oquePaga; // parcela contemplacao+1
  }

  // B39 — prazo restante
  const prazoRestante = abatimentoLance === "REDUZIR PRAZO" ? prazoMantido : prazoGrupo - parcelaContemplacao;

  return {
    parcelaEntrada,
    parcelaContemplacao,
    parcelasVencidas,
    parcelasPagasPreContemplacao,
    parcelaBase,
    percentualLance,
    lanceTotal,
    lanceEmParcelas,
    prazoAposContemplacao,
    prazoMantido,
    prazoEfetivo,
    creditoNaContemplacao,
    creditoDaCarta,
    boletoLanceLivre,
    desembolso,
    parcelaPosContemplacao,
    prazoRestante,
    segPercent,
  };
}

// ─────────────────────────────────────────────────────────────
// GERAÇÃO DA TABELA DE FLUXO MENSAL
// Replica as fórmulas de Tabela / Tabela2
// ─────────────────────────────────────────────────────────────

export function gerarTabela(
  inp: InputsConsorcio,
  p: ReturnType<typeof calcularParamsDerivados>
): LinhaTabela[] {
  const {
    credito, taxaAdm, fundoReserva, prazoGrupo, correcaoCredito,
    meiaParcela, abateOuRatea, tipoLance, usaEmbutido,
    abatimentoLance, vendeCarta, percentualRecompra, retornoAluguelMes, correcaoImovelAno,
  } = inp;

  const {
    parcelaEntrada, parcelaContemplacao, lanceEmParcelas,
    prazoAposContemplacao, prazoMantido, prazoEfetivo,
    percentualLance, segPercent, creditoDaCarta, boletoLanceLivre,
  } = p;

  const tabela: LinhaTabela[] = [];
  let desembolsoAcumulado = 0;

  // Fator multiplicador do crédito após lance
  let fatorCredito = 1;
  if (tipoLance === "FIDELIDADE") fatorCredito = 1 - percentualLance;
  else if (tipoLance === "LANCE LIVRE" && usaEmbutido === "SIM") fatorCredito = 0.7;

  const MAX_PARCELAS = prazoGrupo + 1; // 281 linhas

  for (let n = 1; n <= MAX_PARCELAS; n++) {
    // B: Crédito atualizado
    const creditoAtualizado = creditoNoPeriodo(credito, correcaoCredito, n);

    // C: Parcela cheia corrigida
    // Denominador muda se n >= parcelaEntrada (prazoGrupo - parcelaEntrada + 1) ou antes (prazoGrupo - n + 1)
    let parcelaCheiaCorrigida = 0;
    if (n <= prazoGrupo) {
      const denom = n >= parcelaEntrada
        ? prazoGrupo - parcelaEntrada + 1
        : prazoGrupo - n + 1;
      parcelaCheiaCorrigida = (creditoAtualizado / denom) * (1 + taxaAdm + fundoReserva);
    }

    // I: Parcela base fixa (denominador = prazoGrupo - parcelaEntrada + 1)
    const parcelaBaseFixa = n <= prazoGrupo
      ? (creditoAtualizado / (prazoGrupo - parcelaEntrada + 1)) * (1 + taxaAdm + fundoReserva)
      : 0;

    // L: Parcela base furo (denominador = prazoGrupo)
    const parcelaBaseFuro = n <= prazoGrupo
      ? (creditoAtualizado / prazoGrupo) * (1 + taxaAdm + fundoReserva)
      : 0;

    // N: Taxa ADM mensal
    const taxaAdmMensal = parcelaCheiaCorrigida === 0 ? 0
      : parcelaCheiaCorrigida * (taxaAdm + fundoReserva) / (1 + taxaAdm + fundoReserva);

    // Escolha base para cálculo de parcela pós-contemplação
    const baseCalculo = abateOuRatea === "DESCONTAR" ? parcelaBaseFuro : parcelaCheiaCorrigida;
    const baseBaseFixa = abateOuRatea === "DESCONTAR" ? parcelaBaseFuro : parcelaBaseFixa;

    // D: O que paga nessa parcela
    let oquePaga = 0;
    if (n < parcelaEntrada) {
      oquePaga = 0;
    } else if (n <= parcelaContemplacao) {
      // Pré ou na contemplação: meia ou integral
      const base2 = abateOuRatea === "DESCONTAR" ? parcelaBaseFuro : parcelaBaseFixa;
      oquePaga = meiaParcela === "MEIA" ? base2 * 0.5 : base2;
    } else {
      // Pós contemplação
      if (abatimentoLance === "REDUZIR PRAZO") {
        if (n <= parcelaContemplacao + prazoMantido) {
          oquePaga = baseCalculo * (prazoEfetivo / prazoAposContemplacao)
            + segPercent * (prazoMantido - (n - parcelaContemplacao - 1)) * baseCalculo;
        } else {
          oquePaga = 0;
        }
      } else {
        // REDUZIR PARCELA
        if (n <= prazoGrupo) {
          oquePaga = baseCalculo * (prazoEfetivo - lanceEmParcelas) / prazoAposContemplacao
            + segPercent * (prazoEfetivo - lanceEmParcelas - (n - parcelaContemplacao - 1)) * baseCalculo;
        } else {
          oquePaga = 0;
        }
      }
    }

    // F: Boleto lance
    let boletoLance = 0;
    if (n === parcelaContemplacao && tipoLance === "LANCE LIVRE") {
      boletoLance = boletoLanceLivre;
    }

    // E: Fluxo de caixa
    let fluxoCaixa = 0;
    if (n < parcelaEntrada) {
      fluxoCaixa = 0;
    } else if (n < parcelaContemplacao) {
      fluxoCaixa = -oquePaga;
    } else if (n === parcelaContemplacao) {
      // Contemplação: recebe o crédito, paga a parcela
      if (vendeCarta === "SIM") {
        fluxoCaixa = -oquePaga + creditoNoPeriodo(credito, correcaoCredito, n) * fatorCredito * percentualRecompra;
      } else {
        fluxoCaixa = -oquePaga + creditoNoPeriodo(credito, correcaoCredito, n) * fatorCredito;
      }
    } else {
      fluxoCaixa = oquePaga !== 0 ? -oquePaga : 0;
    }

    // G: Fluxo total
    const fluxoTotal = (fluxoCaixa === 0 ? 0 : fluxoCaixa) + (boletoLance > 0 ? -boletoLance : 0);

    // H: Desembolso acumulado — acumula oquePaga + boletoLance (o que saiu do bolso),
    // independente do crédito recebido na contemplação (que é uma entrada, não saída).
    // BUG FIX: condição era "fluxoTotal < 0", excluindo o mês da contemplação (onde
    // fluxoTotal > 0 por causa do crédito recebido), resultando em H40 < B36.
    if (n >= parcelaEntrada && (oquePaga > 0 || boletoLance > 0)) {
      desembolsoAcumulado += oquePaga + boletoLance;
    }

    // J: Aluguel estimado pós contemplação
    let aluguelEstimado = 0;
    if (n > parcelaContemplacao && n <= prazoGrupo) {
      aluguelEstimado = creditoDaCarta * retornoAluguelMes
        * Math.pow(1 + correcaoImovelAno, Math.floor((n - parcelaContemplacao - 1) / 12));
    }

    // K: Diferença aluguel - parcela
    const difAluguelParcela = n > parcelaContemplacao && n <= prazoGrupo
      ? aluguelEstimado - oquePaga
      : 0;

    // M: Seguro mensal
    let seguroMensal = 0;
    if (n > parcelaContemplacao && n <= prazoGrupo) {
      if (abatimentoLance === "REDUZIR PRAZO") {
        if (n <= parcelaContemplacao + prazoMantido) {
          seguroMensal = segPercent * Math.max(0, prazoMantido - (n - parcelaContemplacao - 1)) * baseCalculo;
        }
      } else {
        if (n <= prazoGrupo) {
          seguroMensal = segPercent * Math.max(0, prazoEfetivo - lanceEmParcelas - (n - parcelaContemplacao - 1)) * baseCalculo;
        }
      }
    }

    // O: Amortização + Correção mensal
    const amortCorrecaoMensal = oquePaga === 0 ? 0 : oquePaga - seguroMensal - taxaAdmMensal;

    // P: Auxílio venda (para IRR da venda)
    let auxilioVenda = 0;
    if (n < parcelaEntrada) {
      auxilioVenda = 0;
    } else if (n < parcelaContemplacao) {
      auxilioVenda = -oquePaga;
    } else if (n === parcelaContemplacao) {
      auxilioVenda = -oquePaga
        + (creditoNoPeriodo(credito, correcaoCredito, n) * fatorCredito
          - (abateOuRatea === "DESCONTAR" ? (parcelaEntrada - 1) * parcelaBaseFuro : 0))
        * percentualRecompra;
    }

    // Q: Fluxo venda total
    const fluxoVenda = (auxilioVenda === 0 ? 0 : auxilioVenda) + (boletoLance > 0 ? -boletoLance : 0);

    tabela.push({
      parcela: n,
      creditoAtualizado,
      parcelaCheiaCorrigida,
      oquePaga,
      fluxoCaixa,
      boletoLance,
      fluxoTotal,
      desembolsoAcumulado,
      parcelaBaseFixa,
      aluguelEstimado,
      difAluguelParcela,
      parcelaBaseFuro,
      seguroMensal,
      taxaAdmMensal,
      amortCorrecaoMensal,
      auxilioVenda,
      fluxoVenda,
    });
  }

  return tabela;
}

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// FUNDO DE INVESTIMENTO — come-cotas semestral (15%)
// Replica o comportamento real de fundo de renda fixa longo prazo.
// IR de 15% sobre o rendimento acumulado a cada 6 meses (maio/novembro),
// deduzido do saldo (redução de cotas). Sem ajuste adicional no resgate
// pois alíquota final (>24 meses) = 15% = mesma do come-cotas.
// ─────────────────────────────────────────────────────────────

function calcularFundoComeCotasSemestral(
  principal: number,
  taxaMensal: number,
  prazoMeses: number,
  aliquotaComeCotas = 0.15
): number {
  let saldo = principal;
  let basePeriodo = principal; // saldo após o último come-cotas

  for (let mes = 1; mes <= prazoMeses; mes++) {
    saldo = saldo * (1 + taxaMensal);

    if (mes % 6 === 0) {
      const rendimento = saldo - basePeriodo;
      if (rendimento > 0) {
        saldo -= rendimento * aliquotaComeCotas;
        basePeriodo = saldo;
      }
    }
  }

  return saldo;
}

// MOTOR PRINCIPAL — calcular() é o entry point
// ─────────────────────────────────────────────────────────────

export function calcular(inp: InputsConsorcio): ResultadosConsorcio {
  // Primeira passagem: gerar tabela "bootstrap" para calcular saldos
  // (Parâmetros dependem da Tabela que depende dos Parâmetros — igual ao Excel)
  // Resolvemos com dois passes: primeiro com parâmetros estimados, depois refinamos.

  const paramsBootstrap = calcularParamsBootstrap(inp);
  const tabelaBootstrap = gerarTabela(inp, paramsBootstrap);

  // Segunda passagem com parâmetros derivados da tabela real
  const params = calcularParamsDerivados(inp, tabelaBootstrap);
  const tabela = gerarTabela(inp, params);

  // Terceira passagem para garantir convergência
  const paramsFinal = calcularParamsDerivados(inp, tabela);
  const tabelaFinal = gerarTabela(inp, paramsFinal);

  // Saldo meias não pagas (A26)
  // BUG FIX: Excel retorna 0 para INTEGRAL (IF(B12="MEIA", soma, 0)).
  // Engine anterior acumulava base completa mesmo para INTEGRAL.
  let saldoMeias = 0;
  if (inp.meiaParcela === "MEIA") {
    for (let i = paramsFinal.parcelaEntrada; i <= paramsFinal.parcelaContemplacao && i <= tabelaFinal.length; i++) {
      const row = tabelaFinal[i - 1];
      const base = inp.abateOuRatea === "DESCONTAR" ? row.parcelaBaseFuro : row.parcelaBaseFixa;
      saldoMeias += base * 0.5;
    }
    for (let i = 1; i < paramsFinal.parcelaEntrada && i <= tabelaFinal.length; i++) {
      const row = tabelaFinal[i - 1];
      const base = inp.abateOuRatea === "DESCONTAR" ? row.parcelaBaseFuro : row.parcelaBaseFixa;
      saldoMeias += base * 0.5;
    }
  }

  // Alavancagem Patrimonial
  const aluguelEstimado = paramsFinal.creditoDaCarta * inp.retornoAluguelMes;
  const parcelaPos = paramsFinal.parcelaPosContemplacao;
  const diferencaAPagar = Math.abs(aluguelEstimado - parcelaPos);

  // Alavancagem Financeira
  const desembolsoVenda = paramsFinal.desembolso;
  const valorVenda = paramsFinal.creditoDaCarta * inp.percentualRecompra;
  const lucroLiquidoVenda = valorVenda - desembolsoVenda;
  // Retorno ao mês via IRR simplificado (fluxo col Q)
  const retornoAoMes = irrSimples(tabelaFinal.map(r => r.fluxoVenda));
  const retornoTotalPercent = desembolsoVenda > 0 ? lucroLiquidoVenda / desembolsoVenda : 0;

  // Alavancagem de Aplicação
  let custoTotalAplicacao = 0;
  for (let i = paramsFinal.parcelaEntrada; i <= inp.prazoGrupo && i <= tabelaFinal.length; i++) {
    custoTotalAplicacao += tabelaFinal[i - 1].oquePaga;
  }
  if (inp.abateOuRatea === "DESCONTAR") {
    const parcelaFuroNaContemplacao = tabelaFinal[paramsFinal.parcelaContemplacao - 1]?.parcelaBaseFuro ?? 0;
    const descontoVencidas = (paramsFinal.parcelaEntrada - 1) * parcelaFuroNaContemplacao;
    custoTotalAplicacao += descontoVencidas;
  }
  custoTotalAplicacao += paramsFinal.boletoLanceLivre;

  const custoTotal = custoTotalAplicacao;

  // Alavancagem de Aplicação — Fundo de Investimento com come-cotas semestral
  // Come-cotas: IR de 15% sobre o rendimento acumulado a cada 6 meses (maio/novembro),
  // deduzido diretamente do saldo (redução de cotas). Fundo de longo prazo.
  const valorCorrigidoAplicacao = calcularFundoComeCotasSemestral(
    paramsFinal.creditoDaCarta,
    inp.txInvestimentoComparativo,
    paramsFinal.prazoAposContemplacao
  );
  const lucroLiquidoAplicacao = valorCorrigidoAplicacao - custoTotal;
  const retornoAplicacaoPercent = custoTotal > 0 ? valorCorrigidoAplicacao / custoTotal : 0;


  // Parâmetros para relatório
  const parcelaInicial = inp.meiaParcela === "MEIA"
    ? (tabelaFinal[paramsFinal.parcelaEntrada - 1]?.parcelaBaseFixa ?? 0) * 0.5
    : (tabelaFinal[paramsFinal.parcelaEntrada - 1]?.parcelaBaseFixa ?? 0);

  return {
    parcelaBase: paramsFinal.parcelaBase,
    parcelaEntrada: paramsFinal.parcelaEntrada,
    parcelaContemplacao: paramsFinal.parcelaContemplacao,
    parcelasVencidas: paramsFinal.parcelasVencidas,
    parcelasPagasPreContemplacao: paramsFinal.parcelasPagasPreContemplacao,
    saldoMeiasNaoPagas: saldoMeias,
    valorAcumuladoInvestido: paramsFinal.desembolso,  // BUG FIX: era tabelaFinal[...].desembolsoAcumulado (H40 sem D40)
    saldoDevedor: 0,
    lanceEmReais: paramsFinal.lanceTotal,
    lanceEmParcelas: paramsFinal.lanceEmParcelas,
    prazoAposContemplacao: paramsFinal.prazoAposContemplacao,
    prazoMantido: paramsFinal.prazoMantido,
    parcelaInicial,
    desembolso: paramsFinal.desembolso,
    creditoDaCarta: paramsFinal.creditoDaCarta,
    creditoNaContemplacao: paramsFinal.creditoNaContemplacao,
    parcelaPosContemplacao: parcelaPos,
    prazoRestante: paramsFinal.prazoRestante,
    percentualLanceTotal: paramsFinal.percentualLance,
    boletoLanceLivre: paramsFinal.boletoLanceLivre,
    aluguelEstimado,
    diferencaAPagar,
    lucroLiquidoVenda,
    retornoAoMes,
    retornoTotalPercent,
    custoTotal,
    valorCorrigidoAplicacao,
    lucroLiquidoAplicacao,
    retornoAplicacaoPercent,
    tabela: tabelaFinal,
  };
}

// ─────────────────────────────────────────────────────────────
// BOOTSTRAP: params sem depender de tabela (estimativa inicial)
// ─────────────────────────────────────────────────────────────

function calcularParamsBootstrap(inp: InputsConsorcio): ReturnType<typeof calcularParamsDerivados> {
  const {
    credito, taxaAdm, fundoReserva, prazoGrupo, correcaoCredito,
    parcelasRestantes, parcelasPagasAtéContemplar, meiaParcela,
    abateOuRatea, tipoLance, valorLanceLivre, usaEmbutido,
    abatimentoLance, vendeCarta, percentualRecompra, tipoSeguro,
  } = inp;

  const segPercent = percSeguro(tipoSeguro);
  const parcelaEntrada = prazoGrupo - parcelasRestantes + 1;
  const parcelaContemplacao = parcelaEntrada + parcelasPagasAtéContemplar - 1;
  const parcelasVencidas = Math.max(parcelaEntrada - 1, 0);
  const parcelasPagasPreContemplacao = parcelaContemplacao - parcelaEntrada;
  const parcelaBase = (credito / prazoGrupo) * (1 + taxaAdm + fundoReserva);
  const creditoNaContemplacao = creditoNoPeriodo(credito, correcaoCredito, parcelaContemplacao);

  let percentualLance = 0;
  if (tipoLance === "LANCE LIVRE") {
    const embutido = usaEmbutido === "SIM" ? creditoNaContemplacao * 0.3 : 0;
    percentualLance = (valorLanceLivre + embutido) / creditoNaContemplacao;
  } else if (tipoLance === "FIDELIDADE") {
    percentualLance = 0.3;
  }

  let lanceTotal = 0;
  if (tipoLance === "LANCE LIVRE") {
    lanceTotal = usaEmbutido === "SIM"
      ? creditoNaContemplacao * 0.3 + creditoNaContemplacao * Math.max(percentualLance - 0.3, 0)
      : creditoNaContemplacao * percentualLance;
  } else if (tipoLance === "FIDELIDADE") {
    lanceTotal = creditoNaContemplacao * 0.3;
  }

  // Parcela cheia estimada na contemplação
  const denomEstimado = prazoGrupo - parcelaEntrada + 1;
  const parcelaFullEstimada = (creditoNaContemplacao / denomEstimado) * (1 + taxaAdm + fundoReserva);
  const lanceEmParcelas = lanceTotal === 0 ? 0 : Math.floor(lanceTotal / parcelaFullEstimada);
  const prazoAposContemplacao = prazoGrupo - parcelaContemplacao;
  const prazoMantido = abatimentoLance === "REDUZIR PRAZO"
    ? Math.max(0, prazoAposContemplacao - lanceEmParcelas)
    : prazoAposContemplacao;
  const prazoEfetivo = prazoAposContemplacao + (meiaParcela === "MEIA" ? (parcelaContemplacao - parcelaEntrada + 1) / 2 : 0);

  let fatorCredito = 1;
  if (tipoLance === "FIDELIDADE") fatorCredito = 1 - percentualLance;
  else if (tipoLance === "LANCE LIVRE" && usaEmbutido === "SIM") fatorCredito = 0.7;

  let boletoLanceLivre = 0;
  if (tipoLance === "LANCE LIVRE") {
    boletoLanceLivre = usaEmbutido === "SIM"
      ? creditoNaContemplacao * Math.max(percentualLance - 0.3, 0)
      : creditoNaContemplacao * percentualLance;
  }

  const creditoDaCarta = vendeCarta === "SIM"
    ? creditoNaContemplacao * fatorCredito * percentualRecompra
    : creditoNaContemplacao * fatorCredito;

  // Desembolso estimado: parcelaInicial * parcelasPagasAtéContemplar + meia na contemplação
  const parcelaInicialEstimada = (creditoNoPeriodo(credito, correcaoCredito, parcelaEntrada) / denomEstimado)
    * (1 + taxaAdm + fundoReserva) * (meiaParcela === "MEIA" ? 0.5 : 1);
  const desembolso = parcelaInicialEstimada * (parcelasPagasAtéContemplar + 1) + boletoLanceLivre;

  // Parcela pós estimada
  const parcelaPosEstimada = (creditoNaContemplacao / prazoAposContemplacao) * (1 + taxaAdm + fundoReserva)
    * (prazoEfetivo - lanceEmParcelas) / prazoAposContemplacao;

  return {
    parcelaEntrada,
    parcelaContemplacao,
    parcelasVencidas,
    parcelasPagasPreContemplacao,
    parcelaBase,
    percentualLance,
    lanceTotal,
    lanceEmParcelas,
    prazoAposContemplacao,
    prazoMantido,
    prazoEfetivo,
    creditoNaContemplacao,
    creditoDaCarta,
    boletoLanceLivre,
    desembolso,
    parcelaPosContemplacao: parcelaPosEstimada,
    prazoRestante: abatimentoLance === "REDUZIR PRAZO" ? prazoMantido : prazoAposContemplacao,
    segPercent,
  } as any;
}

// ─────────────────────────────────────────────────────────────
// IRR simplificado (Newton-Raphson) — replica função IRR do Excel
// ─────────────────────────────────────────────────────────────

export function irrSimples(fluxos: number[], guess = 0.01, maxIter = 1000, tol = 1e-7): number {
  // BUG FIX: Remove zeros do início antes de rodar Newton-Raphson.
  // Sem isso, 't' cresce até 280 com fluxos[t]=0, fazendo Math.pow(1+rate, t) explodir
  // e a taxa divergir para valores absurdos (ex: 174 quatrilhões %).
  let inicio = 0;
  while (inicio < fluxos.length && fluxos[inicio] === 0) inicio++;
  const f = fluxos.slice(inicio);
  if (f.length === 0) return 0;

  let rate = guess;
  for (let iter = 0; iter < maxIter; iter++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < f.length; t++) {
      if (f[t] === 0) continue;
      const disc = Math.pow(1 + rate, t);
      npv += f[t] / disc;
      dnpv -= (t * f[t]) / (disc * (1 + rate));
    }
    if (Math.abs(dnpv) < 1e-12) break;
    const newRate = rate - npv / dnpv;
    // Trava: se divergir, retorna NaN em vez de número absurdo
    if (!isFinite(newRate) || Math.abs(newRate) > 100) return NaN;
    if (Math.abs(newRate - rate) < tol) return newRate;
    rate = newRate;
  }
  return rate;
}

// ─────────────────────────────────────────────────────────────
// FINANCIAMENTO
// ─────────────────────────────────────────────────────────────

export function calcularFinanciamento(
  valorImovel: number,
  inputs: InputsFinanciamento
): ResultadosFinanciamento {
  const {
    prazoFin,
    taxaJuros,
    trMensal,
    percentualEntrada,
    seguroMIP,
    seguroDFI,
    taxaAdm,
  } = inputs;

  const entrada = valorImovel * (percentualEntrada / 100);
  const valorFinanciado = valorImovel - entrada;
  const amortizacaoMensal = valorFinanciado / prazoFin;

  const taxaJurosMensal = (taxaJuros / 100) / 12;
  const taxaTRMensal = trMensal / 100;

  // BUG FIX: Primeira parcela SAC usa juros NOMINAL (taxaJuros/12 + TR) — igual ao Excel B92
  const parcelaInicialFin =
    amortizacaoMensal +
    valorFinanciado * taxaJurosMensal +
    valorFinanciado * taxaTRMensal +
    valorFinanciado * (seguroMIP / 100) +
    valorFinanciado * (seguroDFI / 100) +
    taxaAdm;

  // Última parcela SAC (saldo = 1 amortização)
  const taxaEfetivaMensal = Math.pow(1 + taxaJuros / 100, 1 / 12) - 1 + taxaTRMensal;
  const ultimaParcelaSAC =
    amortizacaoMensal +
    amortizacaoMensal * taxaEfetivaMensal +
    amortizacaoMensal * ((seguroMIP + seguroDFI) / 100) +
    taxaAdm;

  // BUG FIX: Total SAC via iteração parcela-a-parcela (replica array formula B94 do Excel)
  // A fórmula simplificada anterior usava taxa nominal e produzia valores incorretos.
  let custoTotalFinanciamento = 0;
  for (let k = 1; k <= prazoFin; k++) {
    const saldoRestante = valorFinanciado - (k - 1) * amortizacaoMensal;
    const parcela =
      amortizacaoMensal +
      saldoRestante * taxaEfetivaMensal +
      saldoRestante * ((seguroMIP + seguroDFI) / 100) +
      taxaAdm;
    custoTotalFinanciamento += parcela;
  }

  // Para cálculo do custo financeiro (juros + TR + seguros), mantemos a referência
  const jurosTotais = (taxaJurosMensal * valorFinanciado * (prazoFin + 1)) / 2;
  const correcaoTRTotais = (taxaTRMensal * valorFinanciado * (prazoFin + 1)) / 2;
  const seguroMIPTotal = ((seguroMIP / 100) * valorFinanciado * (prazoFin + 1)) / 2;
  const seguroDFITotal = ((seguroDFI / 100) * valorFinanciado * prazoFin);
  const taxaAdmTotal = taxaAdm * prazoFin;

  const rendaAprovacaoFin = parcelaInicialFin / 0.3;
  const custoFinanceiroFin = custoTotalFinanciamento - valorImovel;

  // PRICE
  const ratePrice = taxaEfetivaMensal;
  let parcelaInicialPrice = 0;
  let totalPagoPrice = 0;
  if (ratePrice > 0) {
    const factorPrice =
      (Math.pow(1 + ratePrice, prazoFin) * ratePrice) /
      (Math.pow(1 + ratePrice, prazoFin) - 1);
    const pmPrice = valorFinanciado * factorPrice;
    parcelaInicialPrice = pmPrice + valorFinanciado * ((seguroMIP + seguroDFI) / 100) + taxaAdm;
    totalPagoPrice = parcelaInicialPrice * prazoFin;
  }

  return {
    valorImovel,
    entrada,
    valorFinanciado,
    prazo: prazoFin,
    amortizacaoMensal,
    taxaJurosMensal,
    jurosTotais,
    correcaoTRTotais,
    seguroMIPTotal,
    seguroDFITotal,
    taxaAdmTotal,
    custoTotalFinanciamento,
    parcelaInicialFin,
    rendaAprovacaoFin,
    custoFinanceiroFin,
    parcelaInicialPrice,
    totalPagoPrice,
  };
}

// ─────────────────────────────────────────────────────────────
// CDB
// ─────────────────────────────────────────────────────────────

export function calcularCDB(
  valorImovelHoje: number,
  aporteInicial: number,
  totalConsorcioCusto: number,
  consorcioCorrecaoCredito: number,
  percentualEntradaFin: number,
  percentualLanceTotal: number,
  isSorteio: boolean,
  inputs: InputsCDB
): ResultadosCDB {
  const { objetivo, corrigirParcela, rendimentoCdb, valorizacaoImovel } = inputs;

  let valorAlvoInicial = valorImovelHoje;
  if (objetivo === "ENTRADA") {
    valorAlvoInicial = valorImovelHoje * percentualEntradaFin;
  }

  const taxaCdbMensal = rendimentoCdb / 100;
  const valorizacaoImovelAnual = valorizacaoImovel / 100;
  const taxaMensalImovel = Math.pow(1 + valorizacaoImovelAnual, 1 / 12) - 1;

  let mesAtingido = 0;
  let saldoBrutoAnterior = 0;
  let totalAportado = 0;
  let aluguelAcumulado = 0;
  let imovelCorrigido = valorAlvoInicial;

  const tabela: LinhaTabelaCDB[] = [];
  const maxMeses = 720;

  for (let n = 1; n <= maxMeses; n++) {
    // Aporte corrigido
    const aporteMes = corrigirParcela === "CORRIGIR"
      ? aporteInicial * Math.pow(1 + consorcioCorrecaoCredito, (n - 1) / 12)
      : aporteInicial;

    // Saldo Bruto (timing do Excel)
    let saldoBruto;
    if (n === 1) {
      saldoBruto = aporteMes * (1 + taxaCdbMensal);
    } else {
      saldoBruto = saldoBrutoAnterior * (1 + taxaCdbMensal) + aporteMes;
    }

    totalAportado += aporteMes;
    const lucroBruto = saldoBruto - totalAportado;

    // Alíquota IR regressiva
    let aliquotaIR = 0.15;
    if (n <= 6) aliquotaIR = 0.225;
    else if (n <= 12) aliquotaIR = 0.20;
    else if (n <= 24) aliquotaIR = 0.175;

    const irPagoMes = lucroBruto * aliquotaIR;
    const saldoLiquido = totalAportado + lucroBruto * (1 - aliquotaIR);

    // Imóvel corrigido
    const imovelCorrigidoMes = valorAlvoInicial * Math.pow(1 + taxaMensalImovel, n);

    // Aluguel pago (com base no valor alvo inicial corrigido)
    const valorImovelCorrigidoPeriodo = valorAlvoInicial * Math.pow(1 + taxaMensalImovel, n);
    aluguelAcumulado += valorImovelCorrigidoPeriodo * 0.005;

    const atingiu = saldoLiquido >= imovelCorrigidoMes;

    tabela.push({
      mes: n,
      saldoBruto,
      totalAportado,
      lucroBruto,
      aliquotaIR,
      saldoLiquido,
      imovelCorrigido: imovelCorrigidoMes,
      atingiu: atingiu ? "SIM" : "NAO",
    });

    saldoBrutoAnterior = saldoBruto;

    if (atingiu && mesAtingido === 0) {
      mesAtingido = n;
      imovelCorrigido = imovelCorrigidoMes;
      break;
    }
  }

  let tempoFormatado = "Não atingido em 60 anos";
  if (mesAtingido > 0) {
    const anos = Math.floor(mesAtingido / 12);
    const meses = mesAtingido % 12;
    tempoFormatado = `${anos} anos${meses > 0 ? ` e ${meses} meses` : ""}`;
  }

  // Obter valores finais correspondentes ao mês em que atingiu (ou a última linha simulada)
  const ultimaLinha = tabela[tabela.length - 1];
  const totalAportadoFinal = ultimaLinha.totalAportado;
  const lucroBrutoFinal = ultimaLinha.lucroBruto;
  const aliquotaIRFinal = ultimaLinha.aliquotaIR;
  const irPagoFinal = lucroBrutoFinal * aliquotaIRFinal;
  const rendimentoLiquidoAposIR = lucroBrutoFinal - irPagoFinal;
  const saldoLiquidoFinal = totalAportadoFinal + rendimentoLiquidoAposIR;

  const custoTotalCdb = totalAportadoFinal + aluguelAcumulado;
  const economiaConsorcio = custoTotalCdb - totalConsorcioCusto;
  const economiaPercent = custoTotalCdb > 0 ? (economiaConsorcio / custoTotalCdb) * 100 : 0;

  return {
    mesAtingido,
    tempoFormatado,
    imovelCorrigido,
    aporteInicial,
    totalAportado: totalAportadoFinal,
    rendimentoAcumulado: lucroBrutoFinal,
    irPago: irPagoFinal,
    saldoLiquido: saldoLiquidoFinal,
    aluguelAcumulado,
    custoTotalCdb,
    economiaConsorcio,
    economiaPercent,
    tabela,
  };
}

