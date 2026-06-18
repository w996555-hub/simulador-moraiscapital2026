import React, { useState, useEffect } from 'react';
import { 
  Shuffle, Flag, Lock, BarChart2, Pencil, Info, ChevronDown, 
  Wallet, Calendar, TrendingUp, Home, PiggyBank, Landmark, Handshake 
} from 'lucide-react';
import { formatBRL, formatPercent } from '../../lib/format';
import { calcular, calcularCDB } from '../../engine/engine';

export default function CdbTab({ 
  form, 
  setForm,
  resultados: propResultados,
  inputsCdb,
  setInputsCdb,
  inputsFin,
  loading = false,
  onSimulate
}: any) {
  // Se não houver simulação ainda, calculamos em tempo real com base no form
  const resultados = propResultados || calcular(form);

  const {
    objetivo,
    corrigirParcela,
    rendimentoCdb,
    valorizacaoImovel,
  } = inputsCdb;

  const updateInput = (field: string, value: any) => {
    setInputsCdb((prev: any) => ({ ...prev, [field]: value }));
  };

  const isSorteio = form.tipoLance === 'SORTEIO' || form.tipoLance === 'SEM LANCE';
  const valorImovelHoje = resultados.creditoDaCarta;
  const aporteInicial = resultados.parcelaInicial; 

  // Custo Consórcio
  const sumOquePaga = resultados.tabela
    .filter((row: any) => row.parcela >= resultados.parcelaEntrada && row.parcela <= form.prazoGrupo)
    .reduce((sum: number, row: any) => sum + row.oquePaga, 0);

  const descontoVencidas = form.abateOuRatea === "DESCONTAR"
    ? (resultados.parcelaEntrada - 1) * (resultados.tabela[resultados.parcelaContemplacao - 1]?.parcelaBaseFuro ?? 0)
    : 0;

  const custoTotalConsorcio = sumOquePaga + descontoVencidas + resultados.boletoLanceLivre;

  // Usar a engine centralizada para calcular o CDB
  const cdbResultados = calcularCDB(
    valorImovelHoje,
    aporteInicial,
    custoTotalConsorcio,
    form.correcaoCredito,
    (inputsFin?.percentualEntrada || 20) / 100,
    resultados.percentualLanceTotal,
    isSorteio,
    inputsCdb
  );

  const {
    tempoFormatado,
    mesAtingido,
    imovelCorrigido,
    totalAportado,
    aluguelAcumulado,
    custoTotalCdb,
  } = cdbResultados;

  // Estados locais para edição inline
  const [isEditingRendimento, setIsEditingRendimento] = useState(false);
  const [tempRendimento, setTempRendimento] = useState(rendimentoCdb.toString());

  // Sincronizar estados locais se as props mudarem
  useEffect(() => {
    setTempRendimento(rendimentoCdb.toString());
  }, [rendimentoCdb]);

  const safeOnSimulate = (nextForm?: any) => {
    if (onSimulate) {
      onSimulate(nextForm);
    }
  };

  // Handlers para o select COMPRAR COM
  const handleCompararContraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const nextForm = { ...form };
    if (val === 'SORTEIO') {
      nextForm.tipoLance = 'SORTEIO';
    } else {
      nextForm.tipoLance = 'LANCE LIVRE';
    }
    if (setForm) setForm(nextForm);
    safeOnSimulate(nextForm);
  };

  // Handlers para os inputs locais
  const handleSelectChange = (field: string, val: string) => {
    updateInput(field, val);
    setTimeout(() => {
      safeOnSimulate();
    }, 0);
  };

  // Handlers para Rendimento (inline)
  const commitRendimento = () => {
    const val = parseFloat(tempRendimento);
    if (!isNaN(val)) {
      updateInput('rendimentoCdb', val);
      setTimeout(() => {
        safeOnSimulate();
      }, 0);
    }
    setIsEditingRendimento(false);
  };

  const handleRendimentoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitRendimento();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setTempRendimento(rendimentoCdb.toString());
      setIsEditingRendimento(false);
    }
  };

  // Cálculo de valores derivados para exibição no card esquerdo
  const pctEntrada = isSorteio ? 0.20 : (resultados.percentualLanceTotal || 0.30);
  const valorAJuntarHoje = objetivo === 'ENTRADA' ? valorImovelHoje * pctEntrada : valorImovelHoje;

  const parcelaFinal = corrigirParcela === 'CORRIGIR'
    ? aporteInicial * Math.pow(1 + form.correcaoCredito, (mesAtingido - 1) / 12)
    : aporteInicial;

  return (
    <div className="relative space-y-6 animate-in fade-in duration-500">
      
      {/* Barra de carregamento indeterminada vermelha */}
      {loading && (
        <div className="absolute -top-2 left-0 right-0 h-1 bg-red-100 rounded-full overflow-hidden z-30">
          <div 
            className="h-full bg-[#CC0000] w-1/3 rounded-full" 
            style={{
              animation: 'progress 1.2s infinite linear'
            }} 
          />
        </div>
      )}

      {/* Estilo local para animação do loader */}
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>

      {/* Título com barra lateral vermelha */}
      <div className="border-l-4 pl-3" style={{ borderColor: '#CC0000' }}>
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
          SIMULAÇÃO: POUPAR NO CDB VS COMPRAR NO CONSÓRCIO
        </h2>
      </div>

      {/* SEÇÃO 1 — Barra de controles (4 colunas) */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-1 divide-y divide-gray-200 lg:grid-cols-4 lg:divide-x lg:divide-y-0 lg:divide-gray-200">
          
          {/* Controle 1: Comprar com */}
          <div className="flex items-center gap-3 px-5 py-1">
            <div className="h-9 w-9 flex items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: 'rgba(204, 0, 0, 0.1)' }}>
              <Shuffle size={18} style={{ color: '#CC0000' }} />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: '#CC0000' }}>
                COMPRAR COM
              </span>
              <div className="relative flex items-center justify-between w-full">
                <select
                  value={isSorteio ? 'SORTEIO' : 'LANCE'}
                  onChange={handleCompararContraChange}
                  disabled={loading}
                  className="mt-0.5 w-full bg-transparent text-sm font-bold text-gray-900 outline-none disabled:cursor-wait disabled:opacity-70 border-none p-0 appearance-none pr-6 cursor-pointer"
                >
                  <option value="SORTEIO">SORTEIO</option>
                  <option value="LANCE">LANCE</option>
                </select>
                <ChevronDown size={14} className="text-gray-500 absolute right-0 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Controle 2: Objetivo */}
          <div className="flex items-center gap-3 px-5 py-1">
            <div className="h-9 w-9 flex items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: 'rgba(204, 0, 0, 0.1)' }}>
              <Flag size={18} style={{ color: '#CC0000' }} />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: '#CC0000' }}>
                OBJETIVO
              </span>
              <div className="relative flex items-center justify-between w-full">
                <select
                  value={objetivo}
                  onChange={(e) => handleSelectChange('objetivo', e.target.value)}
                  disabled={loading}
                  className="mt-0.5 w-full bg-transparent text-sm font-bold text-gray-900 outline-none disabled:cursor-wait disabled:opacity-70 border-none p-0 appearance-none pr-6 cursor-pointer"
                >
                  <option value="VALOR TOTAL">VALOR TOTAL</option>
                  <option value="ENTRADA">ENTRADA</option>
                </select>
                <ChevronDown size={14} className="text-gray-500 absolute right-0 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Controle 3: Parcela mensal */}
          <div className="flex items-center gap-3 px-5 py-1">
            <div className="h-9 w-9 flex items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: 'rgba(204, 0, 0, 0.1)' }}>
              <Lock size={18} style={{ color: '#CC0000' }} />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: '#CC0000' }}>
                PARCELA MENSAL
              </span>
              <div className="relative flex items-center justify-between w-full">
                <select
                  value={corrigirParcela}
                  onChange={(e) => handleSelectChange('corrigirParcela', e.target.value)}
                  disabled={loading}
                  className="mt-0.5 w-full bg-transparent text-sm font-bold text-gray-900 outline-none disabled:cursor-wait disabled:opacity-70 border-none p-0 appearance-none pr-6 cursor-pointer"
                >
                  <option value="NÃO CORRIGIR">NÃO CORRIGIR</option>
                  <option value="CORRIGIR">CORRIGIR INCC</option>
                </select>
                <ChevronDown size={14} className="text-gray-500 absolute right-0 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Controle 4: Rendimento */}
          <div className="flex items-center gap-3 px-5 py-1">
            <div className="h-9 w-9 flex items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: 'rgba(204, 0, 0, 0.1)' }}>
              <BarChart2 size={18} style={{ color: '#CC0000' }} />
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: '#CC0000' }}>
                RENDIMENTO
              </span>
              {isEditingRendimento ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={tempRendimento}
                    onChange={(e) => setTempRendimento(e.target.value)}
                    onKeyDown={handleRendimentoKeyDown}
                    onBlur={commitRendimento}
                    autoFocus
                    disabled={loading}
                    className="w-20 border-b border-red-400 bg-transparent text-lg font-extrabold text-[#CC0000] outline-none disabled:cursor-wait"
                  />
                  <span className="text-xs text-gray-500 font-semibold">% ao mês</span>
                </div>
              ) : (
                <div 
                  onClick={() => !loading && setIsEditingRendimento(true)}
                  className={`flex items-center group ${loading ? 'cursor-wait' : 'cursor-pointer hover:opacity-80'}`}
                >
                  <span className="text-lg font-extrabold text-[#CC0000] leading-none">
                    {formatPercent(rendimentoCdb / 100)}
                  </span>
                  <span className="text-[11px] text-gray-500 font-semibold ml-1 self-end mb-0.5">
                    ao mês
                  </span>
                  <Pencil size={11} className="text-gray-400 ml-1.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* SEÇÃO 2 — Grid 2 colunas: inputs editáveis / tempo de compra */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        
        {/* Card de inputs à esquerda */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col justify-center">
          <div className="divide-y divide-gray-100">
            
            {/* Linha 1: Valor a juntar hoje */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <div className="h-9 w-9 flex items-center justify-center rounded-lg mr-3 shrink-0" style={{ backgroundColor: 'rgba(204, 0, 0, 0.1)' }}>
                  <Wallet size={18} style={{ color: '#CC0000' }} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  VALOR A JUNTAR (HOJE)
                </span>
              </div>
              <span className="text-sm font-extrabold text-gray-900 font-display">
                {formatBRL(valorAJuntarHoje)}
              </span>
            </div>

            {/* Linha 2: Parcela inicial */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <div className="h-9 w-9 flex items-center justify-center rounded-lg mr-3 shrink-0" style={{ backgroundColor: 'rgba(204, 0, 0, 0.1)' }}>
                  <Calendar size={18} style={{ color: '#CC0000' }} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  PARCELA INICIAL
                </span>
              </div>
              <span className="text-sm font-extrabold text-gray-900 font-display">
                {formatBRL(aporteInicial)}
              </span>
            </div>

            {/* Linha 3: Parcela final */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <div className="h-9 w-9 flex items-center justify-center rounded-lg mr-3 shrink-0" style={{ backgroundColor: 'rgba(204, 0, 0, 0.1)' }}>
                  <Calendar size={18} style={{ color: '#CC0000' }} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  PARCELA FINAL
                </span>
              </div>
              <span className="text-sm font-extrabold text-gray-900 font-display">
                {formatBRL(parcelaFinal)}
              </span>
            </div>

            {/* Linha 4: Valor corrigido */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <div className="h-9 w-9 flex items-center justify-center rounded-lg mr-3 shrink-0" style={{ backgroundColor: 'rgba(204, 0, 0, 0.1)' }}>
                  <TrendingUp size={18} style={{ color: '#CC0000' }} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  VALOR CORRIGIDO (DATA DA COMPRA)
                </span>
              </div>
              <span className="text-sm font-black font-display" style={{ color: '#CC0000' }}>
                {formatBRL(imovelCorrigido)}
              </span>
            </div>

          </div>
        </div>

        {/* Card Tempo para Compra à direita */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col items-center justify-center text-center h-full min-h-[220px]">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4 font-display">
            TEMPO PARA COMPRA
          </span>
          <span className="text-[38px] font-black font-display leading-none block" style={{ color: '#CC0000' }}>
            {tempoFormatado}
          </span>
        </div>

      </section>

      {/* SEÇÃO 3 — Quatro SummaryCard em grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Valor Gasto de Aluguel */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col">
          <div className="h-9 w-9 flex items-center justify-center rounded-lg shrink-0 mb-3" style={{ backgroundColor: 'rgba(204, 0, 0, 0.1)' }}>
            <Home size={18} style={{ color: '#CC0000' }} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 font-display">
            VALOR GASTO DE ALUGUEL
          </span>
          <span className="text-lg font-black font-display" style={{ color: '#CC0000' }}>
            {formatBRL(aluguelAcumulado)}
          </span>
        </div>

        {/* Card 2: Valor Investido CDB */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col">
          <div className="h-9 w-9 flex items-center justify-center rounded-lg shrink-0 mb-3" style={{ backgroundColor: 'rgba(204, 0, 0, 0.1)' }}>
            <PiggyBank size={18} style={{ color: '#CC0000' }} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 font-display">
            VALOR INVESTIDO CDB
          </span>
          <span className="text-lg font-black font-display" style={{ color: '#CC0000' }}>
            {formatBRL(totalAportado)}
          </span>
        </div>

        {/* Card 3: Investimento Total */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col">
          <div className="h-9 w-9 flex items-center justify-center rounded-lg shrink-0 mb-3" style={{ backgroundColor: 'rgba(204, 0, 0, 0.1)' }}>
            <Landmark size={18} style={{ color: '#CC0000' }} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 font-display">
            INVESTIMENTO TOTAL
          </span>
          <span className="text-lg font-black font-display" style={{ color: '#CC0000' }}>
            {formatBRL(custoTotalCdb)}
          </span>
        </div>

        {/* Card 4: Custo Total Consórcio */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 flex flex-col" style={{ borderColor: 'rgba(204, 0, 0, 0.2)' }}>
          <div className="h-9 w-9 flex items-center justify-center rounded-lg shrink-0 mb-3" style={{ backgroundColor: 'rgba(204, 0, 0, 0.1)' }}>
            <Handshake size={18} style={{ color: '#CC0000' }} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 font-display">
            CUSTO TOTAL CONSÓRCIO
          </span>
          <span className="text-lg font-black font-display" style={{ color: '#CC0000' }}>
            {objetivo === 'ENTRADA' ? '-----' : formatBRL(custoTotalConsorcio)}
          </span>
        </div>

      </section>

      {/* Rodapé disclaimer */}
      <footer className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 leading-relaxed">
          Esta simulação é uma estimativa e não garante rentabilidade futura. Os valores podem variar conforme condições de mercado. Impostos e taxas aplicáveis foram calculados com base nas regras vigentes.
        </p>
      </footer>

    </div>
  );
}