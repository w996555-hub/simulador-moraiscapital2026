import React, { useState } from 'react';
import { 
  TrendingDown, Percent, Calendar, DollarSign, Wallet, 
  ArrowRight, ShieldCheck, Landmark, CheckCircle, BarChart3, HelpCircle,
  Percent as PercentIcon, Clock, BadgeAlert, ArrowUpRight, Award,
  Home, Coins, ShieldAlert, Banknote, Sparkles, Settings
} from 'lucide-react';
import { formatBRL, formatPercent, formatInt } from '../../lib/format';
import { calcular, calcularFinanciamento } from '../../engine/engine';

export default function FinanciamentoTab({ 
  form, 
  resultados: propResultados,
  inputsFin,
  setInputsFin
}: any) {
  // Estado local para o dropdown de comparação
  const [compararContra, setCompararContra] = useState<'SORTEIO' | 'LANCE'>('SORTEIO');
  const [showConfig, setShowConfig] = useState(false);

  const {
    prazoFin,
    taxaJuros,
    trMensal,
    percentualEntrada,
    seguroMIP,
    seguroDFI,
    taxaAdm,
  } = inputsFin;

  const updateInput = (field: string, value: number) => {
    setInputsFin((prev: any) => ({ ...prev, [field]: value }));
  };

  // Calcular o Consórcio com base no estado "compararContra"
  // BUG FIX: quando compararContra=LANCE, usa o tipoLance do form sem alterar.
  // Antes forçava FIDELIDADE quando o form era SORTEIO, o que era incorreto.
  const consorcioResultados = calcular({
    ...form,
    tipoLance: compararContra === 'SORTEIO' ? 'SORTEIO' : form.tipoLance
  });

  // Determinar se o cenário selecionado é Sorteio
  const isSorteio = compararContra === 'SORTEIO';

  // Usar a engine centralizada para calcular o Financiamento
  // Base correta: creditoDaCarta (B37) = valor total da carta contemplada.
  // No lance com embutido, o cliente recebe a carta inteira — o lance embutido
  // é parte da própria carta usada como lance, não um desconto no imóvel.
  // A comparação deve ser: quanto custaria financiar o MESMO imóvel (B37)?
  const finResultados = calcularFinanciamento(consorcioResultados.creditoDaCarta, inputsFin);

  const {
    valorImovel,
    entrada: entradaFin,
    valorFinanciado,
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
  } = finResultados;

  // --- DADOS DO CONSÓRCIO ---
  // Sum of all paid installments over the entire duration of the group (Excel cell B58)
  const sumOquePaga = consorcioResultados.tabela
    .filter((row: any) => row.parcela >= consorcioResultados.parcelaEntrada && row.parcela <= form.prazoGrupo)
    .reduce((sum: number, row: any) => sum + row.oquePaga, 0);

  const descontoVencidas = form.abateOuRatea === "DESCONTAR"
    ? (consorcioResultados.parcelaEntrada - 1) * (consorcioResultados.tabela[consorcioResultados.parcelaContemplacao - 1]?.parcelaBaseFuro ?? 0)
    : 0;

  const custoTotalConsorcio = sumOquePaga + descontoVencidas + consorcioResultados.boletoLanceLivre;
  // creditoDaCarta (B37) = valor total da carta contemplada
  const creditoLiberadoConsorcio = consorcioResultados.creditoDaCarta;
  const prazoConsorcio = form.prazoGrupo;
  const parcelaInicialConsorcio = consorcioResultados.parcelaInicial;
  
  // Renda p/ Aprovação baseada na Parcela Pós-Contemplação (como no Excel)
  const rendaAprovacaoCons = consorcioResultados.parcelaPosContemplacao / 0.3;

  // Economia Gerada
  const economiaConsorcio = custoTotalFinanciamento - custoTotalConsorcio;

  const fmtMoney = (val: number) => formatBRL(val);
  const fmtPercent = (val: number) => formatPercent(val);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      
      {/* Container Principal do Comparativo */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="p-6 border-b border-border bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold tracking-tight font-display text-foreground uppercase">Comparativo: Financiamento vs Consórcio</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider font-display">Comparar Consórcio contra:</span>
              <select
                value={compararContra}
                onChange={(e) => setCompararContra(e.target.value as any)}
                className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-foreground"
              >
                <option value="SORTEIO">SORTEIO</option>
                <option value="LANCE">LANCE</option>
              </select>
            </div>

            {/* Badge dinâmico à direita */}
            <div className="bg-primary/5 text-primary text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-display border border-primary/10">
              <Sparkles size={14} className="stroke-[2.5]" />
              <span>
                {isSorteio ? "Contemplação por sorteio" : "Contemplação por lance"}
              </span>
            </div>

            {/* Botão Configurações Avançadas */}
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className={`h-9 w-9 border rounded-lg flex items-center justify-center transition-all ${showConfig ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-input text-muted-foreground hover:text-foreground'}`}
              title="Ajustar Taxas do Financiamento"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Menu Colapsável de Configurações Avançadas */}
        {showConfig && (
          <div className="p-6 border-b border-border bg-muted/20 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-5 gap-y-4 animate-in slide-in-from-top duration-300">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Prazo Financiamento</label>
              <div className="relative">
                <input
                  type="number"
                  value={prazoFin}
                  onChange={e => updateInput('prazoFin', Number(e.target.value))}
                  className="w-full h-9 pl-3 pr-12 rounded-lg border border-input bg-background text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">meses</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Entrada (%)</label>
              <div className="relative">
                <input
                  type="number"
                  value={percentualEntrada}
                  onChange={e => updateInput('percentualEntrada', Number(e.target.value))}
                  className="w-full h-9 pl-3 pr-8 rounded-lg border border-input bg-background text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">%</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Juros Fin. (% a.a.)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  value={taxaJuros}
                  onChange={e => updateInput('taxaJuros', Number(e.target.value))}
                  className="w-full h-9 pl-3 pr-14 rounded-lg border border-input bg-background text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">% a.a.</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Indexador TR (% a.m.)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={trMensal}
                  onChange={e => updateInput('trMensal', Number(e.target.value))}
                  className="w-full h-9 pl-3 pr-14 rounded-lg border border-input bg-background text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">% a.m.</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Seguro MIP (% a.m.)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.00001"
                  value={seguroMIP}
                  onChange={e => updateInput('seguroMIP', Number(e.target.value))}
                  className="w-full h-9 pl-3 pr-12 rounded-lg border border-input bg-background text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">%</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Seguro DFI (% a.m.)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.00001"
                  value={seguroDFI}
                  onChange={e => updateInput('seguroDFI', Number(e.target.value))}
                  className="w-full h-9 pl-3 pr-12 rounded-lg border border-input bg-background text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">%</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Taxa Adm. Banco</label>
              <div className="relative">
                <input
                  type="number"
                  value={taxaAdm}
                  onChange={e => updateInput('taxaAdm', Number(e.target.value))}
                  className="w-full h-9 pl-3 pr-8 rounded-lg border border-input bg-background text-xs font-semibold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">R$</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabela de Comparação */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-primary text-white">
                <th className="p-4 text-xs font-bold uppercase tracking-wider font-display w-[40%]">Modalidade</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider font-display text-right w-[30%]">Financiamento SAC</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider font-display text-right w-[30%] bg-primary">CONSÓRCIO ({compararContra})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              
              {/* Linha 1: Valor do Imóvel */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                    <Home size={16} />
                  </div>
                  <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Valor do Imóvel</span>
                </td>
                <td className="p-4 text-sm font-bold text-primary text-right font-display">{fmtMoney(valorImovel)}</td>
                <td className="p-4 text-sm font-bold text-primary text-right font-display bg-primary/5">{fmtMoney(creditoLiberadoConsorcio)}</td>
              </tr>

              {/* Linha 2: Entrada */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                    <Coins size={16} />
                  </div>
                  <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Entrada</span>
                </td>
                <td className="p-4 text-sm font-extrabold text-foreground text-right font-display">{fmtMoney(entradaFin)}</td>
                <td className="p-4 text-sm font-bold text-muted-foreground text-right font-display bg-primary/5">
                  {!isSorteio && consorcioResultados.boletoLanceLivre > 0 ? fmtMoney(consorcioResultados.boletoLanceLivre) : '—'}
                </td>
              </tr>

              {/* Linha 3: Prazo */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                    <Calendar size={16} />
                  </div>
                  <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Prazo</span>
                </td>
                <td className="p-4 text-sm font-extrabold text-foreground text-right font-display">{Math.floor(prazoFin / 12)} anos</td>
                <td className="p-4 text-sm font-extrabold text-foreground text-right font-display bg-primary/5">
                  {Math.floor(prazoConsorcio / 12)} anos
                </td>
              </tr>

              {/* Linha 4: Parcela */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                    <DollarSign size={16} />
                  </div>
                  <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Parcela</span>
                </td>
                <td className="p-4 text-sm font-extrabold text-foreground text-right font-display">{fmtMoney(parcelaInicialFin)}</td>
                <td className="p-4 text-sm font-extrabold text-foreground text-right font-display bg-primary/5">{fmtMoney(parcelaInicialConsorcio)}</td>
              </tr>


              {/* Linha 6: Indexador */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                    <TrendingDown size={16} />
                  </div>
                  <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Indexador (TR)</span>
                </td>
                <td className="p-4 text-sm font-extrabold text-foreground text-right font-display">{trMensal.toFixed(3).replace('.', ',')}% mês</td>
                <td className="p-4 text-sm font-extrabold text-foreground text-right font-display bg-primary/5">
                  {fmtPercent(form.correcaoCredito)} ano
                </td>
              </tr>

              {/* Linha 7: Taxa de Juros */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                    <PercentIcon size={16} />
                  </div>
                  <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Taxa de Juros % ao ano</span>
                </td>
                <td className="p-4 text-sm font-extrabold text-foreground text-right font-display">{taxaJuros.toFixed(3).replace('.', ',')}%</td>
                <td className="p-4 text-sm font-bold text-muted-foreground text-right font-display bg-primary/5">—</td>
              </tr>

              {/* Linha 8: Crédito Liberado */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle size={16} />
                  </div>
                  <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Crédito Liberado</span>
                </td>
                <td className="p-4 text-sm font-extrabold text-foreground text-right font-display">{fmtMoney(valorImovel)}</td>
                <td className="p-4 text-sm font-extrabold text-foreground text-right font-display bg-primary/5">{fmtMoney(creditoLiberadoConsorcio)}</td>
              </tr>

              {/* Linha 9: Valor Financiado */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                    <Landmark size={16} />
                  </div>
                  <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Valor Financiado</span>
                </td>
                <td className="p-4 text-sm font-extrabold text-foreground text-right font-display">{fmtMoney(valorFinanciado)}</td>
                <td className="p-4 text-sm font-bold text-muted-foreground text-right font-display bg-primary/5">—</td>
              </tr>

              {/* Linha 10: Custo Total Pago (Destaque Vermelho/Negrito) */}
              <tr className="hover:bg-muted/10 transition-colors">
                <td className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                    <Banknote size={16} />
                  </div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">Custo Total Pago</span>
                </td>
                <td className="p-4 text-base font-bold text-primary text-right font-display">{fmtMoney(custoTotalFinanciamento)}</td>
                <td className="p-4 text-base font-bold text-primary text-right bg-primary/5 font-display">{fmtMoney(custoTotalConsorcio)}</td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* Barra Verde de Economia com o Consórcio */}
      <div className="rounded-2xl border border-success/30 bg-success/5 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-success/15 text-success rounded-full flex items-center justify-center shrink-0">
            <TrendingDown size={20} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-success font-display">Economia com o Consórcio</span>
        </div>
        <span className="font-display text-2xl font-extrabold text-success">
          {fmtMoney(economiaConsorcio)}
        </span>
      </div>

      {/* Nota Discreta de Rodapé */}
      <div className="text-[10px] text-muted-foreground/80 flex items-center gap-1.5 pl-2">
        <BadgeAlert size={12} className="text-muted-foreground/60 shrink-0" />
        <span>Cálculos estimados da planilha, seguem como compra realizada na aba Simular. Os valores exibidos aqui são do último cálculo informado.</span>
      </div>

    </div>
  );
}