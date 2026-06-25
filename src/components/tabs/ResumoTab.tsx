import React from 'react';
import { Loader2, Dice5, Trophy } from 'lucide-react';
import { formatBRL } from '../../lib/format';
import { calcular, calcularFinanciamento, calcularCDB } from '../../engine/engine';

export default function ResumoTab({ 
  form, 
  setForm,
  resultados: propResultados,
  inputsFin,
  inputsCdb,
  loading = false,
  onSimulate
}: any) {
  // Se não houver simulação ainda, calculamos em tempo real com base no form
  const resultados = propResultados || calcular(form);

  const isSorteio = form.tipoLance === 'SORTEIO' || form.tipoLance === 'SEM LANCE';
  const modalidade = isSorteio ? 'SORTEIO' : 'LANCE';
  const valorImovelHoje = resultados.creditoDaCarta;

  // 1. --- CÁLCULOS DO FINANCIAMENTO ---
  // Base correta: creditoDaCarta (B37) = carta completa contemplada.
  const finResultados = calcularFinanciamento(valorImovelHoje, inputsFin);
  const {
    entrada: entradaFin,
    valorFinanciado,
    prazo: prazoFin,
    custoTotalFinanciamento,
    parcelaInicialFin,
    rendaAprovacaoFin,
    custoFinanceiroFin,
  } = finResultados;

  // 2. --- DADOS DO CONSÓRCIO ---
  const sumOquePaga = resultados.tabela
    .filter((row: any) => row.parcela >= resultados.parcelaEntrada && row.parcela <= form.prazoGrupo)
    .reduce((sum: number, row: any) => sum + row.oquePaga, 0);

  const descontoVencidas = form.abateOuRatea === "DESCONTAR"
    ? (resultados.parcelaEntrada - 1) * (resultados.tabela[resultados.parcelaContemplacao - 1]?.parcelaBaseFuro ?? 0)
    : 0;

  const custoTotalConsorcio = sumOquePaga + descontoVencidas + resultados.boletoLanceLivre;
  const creditoLiberadoConsorcio = resultados.creditoDaCarta;
  const prazoConsorcio = form.prazoGrupo;
  const parcelaInicialConsorcio = resultados.parcelaInicial;
  const rendaAprovacaoCons = resultados.parcelaPosContemplacao / 0.3;
  const entradaConsorcio = isSorteio ? 0 : resultados.creditoDaCarta * (inputsFin.percentualEntrada / 100);
  const totalParcelasConsorcio = custoTotalConsorcio;
  const custoFinanceiroConsorcio = custoTotalConsorcio - creditoLiberadoConsorcio;

  // 3. --- CÁLCULOS DO CDB ---
  const cdbResultados = calcularCDB(
    valorImovelHoje,
    resultados.parcelaInicial,
    custoTotalConsorcio,
    form.correcaoCredito,
    (inputsFin.percentualEntrada || 20) / 100,
    resultados.percentualLanceTotal,
    isSorteio,
    inputsCdb
  );

  const {
    tempoFormatado: tempoCdbFormatado,
    imovelCorrigido: imovelCorrigidoCdb,
    aporteInicial: aporteInicialCdb,
    totalAportado: totalAportadoCdb,
    irPago: irPagoCdb,
    aluguelAcumulado,
    custoTotalCdb,
  } = cdbResultados;

  const handleModalidadeChange = (opt: 'SORTEIO' | 'LANCE') => {
    if (opt === modalidade) return;
    const nextForm = { ...form };
    if (opt === 'SORTEIO') {
      nextForm.tipoLance = 'SORTEIO';
    } else {
      nextForm.tipoLance = 'LANCE LIVRE';
    }
    if (setForm) setForm(nextForm);
    if (onSimulate) onSimulate(nextForm);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Componentes auxiliares de renderização interna
  function SectionTitle({ title }: { title: string }) {
    return (
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 mt-4 first:mt-2">
        {title}
      </h4>
    );
  }

  function Row({ label, value = "", isUnavailable = false }: { label: string; value?: string; isUnavailable?: boolean }) {
    if (isUnavailable) {
      return (
        <div className="flex items-baseline justify-between gap-3 py-1.5">
          <span className="text-xs text-gray-400">{label}</span>
          <span className="text-sm font-semibold text-gray-400">—</span>
        </div>
      );
    }
    return (
      <div className="flex items-baseline justify-between gap-3 py-1.5">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-sm font-semibold text-gray-950">{value}</span>
      </div>
    );
  }

  function HighlightRow({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex items-baseline justify-between gap-3 py-1.5">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-sm font-bold text-primary">{value}</span>
      </div>
    );
  }

  function TotalHighlight({ value }: { value: string }) {
    return (
      <div className="mt-4 mb-4 rounded-xl bg-red-50/70 border border-red-100 px-4 py-3 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          TOTAL DESEMBOLSADO
        </span>
        <span className="text-base font-bold text-primary">
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Título da aba */}
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-950">
        Resumo Comparativo
      </h3>

      {/* Barra de Modalidade */}
      <section className="rounded-2xl border border-gray-200 bg-[#FCFDFD] px-5 py-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          MODALIDADE:
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleModalidadeChange('SORTEIO')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
              modalidade === 'SORTEIO'
                ? 'bg-primary text-white border border-primary cursor-default'
                : 'bg-gray-50 border border-gray-200 text-gray-400 hover:bg-gray-100'
            }`}
          >
            Sorteio
          </button>
          <button
            type="button"
            onClick={() => handleModalidadeChange('LANCE')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
              modalidade === 'LANCE'
                ? 'bg-primary text-white border border-primary cursor-default'
                : 'bg-gray-50 border border-gray-200 text-gray-400 hover:bg-gray-100'
            }`}
          >
            Lance
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 ml-2">
          {isSorteio ? <Dice5 className="h-4 w-4 text-gray-400" /> : <Trophy className="h-4 w-4 text-gray-400" />}
          <span>
            {isSorteio 
              ? 'Contemplação por sorteio (sem lance)' 
              : `Contemplação por lance (${form.tipoLance || 'Livre'})`
            }
          </span>
        </div>
      </section>

      {/* Grid de 3 colunas comparativas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Coluna 1: Financiamento */}
        <div className="rounded-xl border border-gray-200 bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-3.5 border-b border-gray-200 bg-primary/5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
              FINANCIAMENTO
            </h3>
          </div>
          <div className="px-6 py-5 flex-1 flex flex-col justify-between">
            <div className="space-y-1">
              <SectionTitle title="Perfil da Operação" />
              <Row label="Valor do imóvel hoje" value={formatBRL(valorImovelHoje)} />
              <Row label="Prazo" value={`${prazoFin} meses`} />
              <Row label="Parcela/Aporte mensal inicial" value={formatBRL(parcelaInicialFin)} />
              <Row label="Renda mínima necessária (30%)" value={formatBRL(rendaAprovacaoFin)} />

              <SectionTitle title="Desembolsos até ter o Imóvel" />
              <Row label="Entrada/Lance inicial" value={formatBRL(entradaFin)} />
              <Row label="Total parcelas/aportes" value={formatBRL(custoTotalFinanciamento)} />
              <Row label="Custo financeiro (juros, IR, taxas)" value={formatBRL(custoFinanceiroFin)} />
              <Row label="Aluguel pago no período" isUnavailable={true} />
            </div>

            <div>
              <TotalHighlight value={formatBRL(custoTotalFinanciamento)} />
              <SectionTitle title="Referência na data da compra" />
              <HighlightRow label="Imóvel na data da compra" value={formatBRL(valorImovelHoje)} />
            </div>
          </div>
        </div>

        {/* Coluna 2: Consórcio */}
        <div className="rounded-xl border border-gray-200 bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-3.5 border-b border-gray-200 bg-white">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
              CONSÓRCIO
            </h3>
          </div>
          <div className="px-6 py-5 flex-1 flex flex-col justify-between">
            <div className="space-y-1">
              <SectionTitle title="Perfil da Operação" />
              <Row label="Valor do imóvel hoje" value={formatBRL(creditoLiberadoConsorcio)} />
              <Row label="Prazo" value={`${prazoConsorcio} meses`} />
              <Row label="Parcela/Aporte mensal inicial" value={formatBRL(parcelaInicialConsorcio)} />
              <Row label="Renda mínima necessária (30%)" value={formatBRL(rendaAprovacaoCons)} />

              <SectionTitle title="Desembolsos até ter o Imóvel" />
              <Row label="Entrada/Lance inicial" value={formatBRL(entradaConsorcio)} />
              <Row label="Total parcelas/aportes" value={formatBRL(totalParcelasConsorcio)} />
              <Row label="Custo financeiro (juros, IR, taxas)" value={formatBRL(custoFinanceiroConsorcio)} />
              <Row label="Aluguel pago no período" isUnavailable={true} />
            </div>

            <div>
              <TotalHighlight value={formatBRL(custoTotalConsorcio)} />
              <SectionTitle title="Referência na data da compra" />
              <HighlightRow label="Imóvel na data da compra" value={formatBRL(valorImovelHoje)} />
            </div>
          </div>
        </div>

        {/* Coluna 3: CDB */}
        <div className="rounded-xl border border-gray-200 bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-3.5 border-b border-gray-200 bg-white">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
              CDB
            </h3>
          </div>
          <div className="px-6 py-5 flex-1 flex flex-col justify-between">
            <div className="space-y-1">
              <SectionTitle title="Perfil da Operação" />
              <Row label="Valor do imóvel hoje" value={formatBRL(valorImovelHoje)} />
              <Row label="Prazo" value={cdbResultados.mesAtingido > 0 ? `${cdbResultados.mesAtingido} meses` : tempoCdbFormatado} />
              <Row label="Parcela/Aporte mensal inicial" value={formatBRL(aporteInicialCdb)} />
              <Row label="Renda mínima necessária (30%)" isUnavailable={true} />

              <SectionTitle title="Desembolsos até ter o Imóvel" />
              <Row label="Entrada/Lance inicial" isUnavailable={true} />
              <Row label="Total parcelas/aportes" value={formatBRL(totalAportadoCdb)} />
              <Row label="Custo financeiro (juros, IR, taxas)" value={formatBRL(irPagoCdb)} />
              <Row label="Aluguel pago no período" value={formatBRL(aluguelAcumulado)} />
            </div>

            <div>
              <TotalHighlight value={formatBRL(custoTotalCdb)} />
              <SectionTitle title="Referência na data da compra" />
              <HighlightRow label="Imóvel na data da compra" value={formatBRL(imovelCorrigidoCdb)} />
            </div>
          </div>
        </div>

      </div>

      {/* Rodapé disclaimer */}
      <footer className="pt-6 border-t border-border flex flex-col items-center gap-3">
        <img src="/png-nova-preta.png" alt="Morais Capital" className="h-7 w-auto object-contain" />
        <p className="text-xs text-muted-foreground italic text-center max-w-2xl">
          Fin. e Consórcio: compra realizada hoje ao valor atual do imóvel. CDB: compra no futuro ao valor corrigido pela valorização configurada. Nenhuma opção é indicada como melhor.
        </p>
      </footer>

    </div>
  );
}