import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Printer, Loader2, ArrowLeft, Check, AlertTriangle, 
  FileText, Calendar, User, Mail
} from 'lucide-react';
import { formatBRL, formatPercent } from '../lib/format';

interface PropostaDados {
  form: any;
  resultados: any;
  inputsFin: any;
  finResultados: any;
  inputsCdb: any;
  cdbResultados: any;
  assessor: {
    nome: string;
    email: string;
    foto_perfil: string;
  };
  lead: string;
  data: string;
}

export default function PropostaPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dadosProposta, setDadosProposta] = useState<PropostaDados | null>(null);

  useEffect(() => {
    const fetchProposta = async () => {
      if (!id) {
        setError("Identificador da proposta ausente.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`https://n8n.srv939429.hstgr.cloud/webhook/buscar-proposta?id=${id}`);
        
        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.dados) {
            const parsed = typeof resData.dados === 'string' 
              ? JSON.parse(resData.dados) 
              : resData.dados;
            setDadosProposta(parsed);
          } else {
            setError(resData.erro || "Proposta não encontrada no banco de dados.");
          }
        } else {
          setError("Erro ao buscar a proposta no servidor.");
        }
      } catch (err) {
        setError("Erro de rede ao carregar a proposta.");
      } finally {
        setLoading(false);
      }
    };

    fetchProposta();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D14] flex flex-col items-center justify-center text-slate-100 p-6">
        <Loader2 className="animate-spin text-[#D4AF37] h-12 w-12 mb-4" />
        <p className="font-display font-medium text-sm tracking-wider uppercase">Carregando Proposta Premium...</p>
      </div>
    );
  }

  if (error || !dadosProposta) {
    return (
      <div className="min-h-screen bg-[#090D14] flex flex-col items-center justify-center text-slate-100 p-6">
        <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-8 max-w-md text-center shadow-lg">
          <AlertTriangle className="text-red-500 h-16 w-16 mx-auto mb-4" />
          <h3 className="text-lg font-bold font-display text-red-400 mb-2">Erro ao Exibir Proposta</h3>
          <p className="text-sm text-slate-300 font-sans mb-6">{error || "Não foi possível carregar os dados desta proposta."}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-border hover:bg-slate-800 text-xs font-bold uppercase tracking-wider transition-all"
          >
            <ArrowLeft size={14} /> Voltar ao Início
          </a>
        </div>
      </div>
    );
  }

  const {
    form,
    resultados,
    inputsFin,
    finResultados,
    inputsCdb,
    cdbResultados,
    assessor,
    lead,
    data: dataProposta
  } = dadosProposta;

  const sumOquePaga = resultados?.tabela
    ?.filter((row: any) => row.parcela >= resultados.parcelaEntrada && row.parcela <= form.prazoGrupo)
    ?.reduce((sum: number, row: any) => sum + row.oquePaga, 0) || 0;

  const descontoVencidas = form?.abateOuRatea === "DESCONTAR"
    ? (resultados?.parcelaEntrada - 1) * (resultados?.tabela[resultados?.parcelaContemplacao - 1]?.parcelaBaseFuro ?? 0)
    : 0;

  const consorcioCustoTotal = sumOquePaga + descontoVencidas + (resultados?.boletoLanceLivre || 0);
  const financiamentoCustoTotal = finResultados?.custoTotalFinanciamento || 0;
  const economiaConsorcio = financiamentoCustoTotal - consorcioCustoTotal;

  const getInitials = (name: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#090D14] text-slate-200 font-sans flex flex-col relative antialiased selection:bg-[#E30613]/30 selection:text-white">
      <div className="no-print bg-[#0c121e]/85 backdrop-blur-md sticky top-0 z-50 border-b border-white/5 py-4 px-6 md:px-8 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <img src="/logo-white.png" alt="Morais Capital" className="h-6 w-auto" />
          <span className="hidden sm:inline text-white/40 text-xs border-l border-white/10 pl-2">PROPOSTA DE ALAVANCAGEM</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-full bg-[#E30613] hover:bg-[#E30613]/90 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md shadow-[#E30613]/10"
          >
            <Printer size={14} />
            <span>Salvar como PDF / Imprimir</span>
          </button>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 md:px-8 py-8 md:py-12 space-y-12">
        <section className="print-card bg-gradient-to-br from-[#0c1220] to-[#0f192b] border border-white/5 rounded-2xl p-6 md:p-8 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#E30613] via-[#D4AF37] to-[#E30613]" />
          
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="bg-[#E30613]/10 border border-[#E30613]/30 text-[#E30613] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Exclusivo
              </span>
              <span className="text-white/40 text-[11px] font-semibold flex items-center gap-1">
                <Calendar size={12} /> {dataProposta}
              </span>
            </div>
            
            <h1 className="text-2xl md:text-4xl font-extrabold font-display text-white tracking-tight leading-tight">
              Assessoria de Alavancagem Patrimonial
            </h1>
            <p className="text-[#D4AF37] font-semibold text-lg md:text-xl font-display">
              Proposta desenvolvida para: <span className="underline decoration-wavy decoration-[#E30613]/40 underline-offset-4 text-white font-bold">{lead}</span>
            </p>
          </div>

          <div className="print-card bg-slate-900/40 border border-white/5 rounded-xl p-4 flex items-center gap-4 shrink-0 w-full md:w-auto md:min-w-[280px]">
            {assessor.foto_perfil ? (
              <img 
                src={assessor.foto_perfil} 
                alt={assessor.nome} 
                className="w-12 h-12 rounded-full object-cover border border-[#D4AF37]/30 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#E30613]/10 border border-[#E30613]/25 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {getInitials(assessor.nome)}
              </div>
            )}
            <div>
              <p className="text-[10px] text-white/50 uppercase font-bold tracking-wider font-sans">Preparado por</p>
              <h4 className="text-sm font-bold text-white leading-normal flex items-center gap-1.5">
                <User size={13} className="text-[#D4AF37]" /> {assessor.nome}
              </h4>
              <p className="text-xs text-white/70 font-sans flex items-center gap-1.5 mt-0.5">
                <Mail size={12} className="text-white/40 shrink-0" /> {assessor.email}
              </p>
            </div>
          </div>
        </section>

        <section className="print-card bg-gradient-to-r from-[#E30613]/20 via-[#D4AF37]/10 to-[#E30613]/20 border border-[#E30613]/20 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-left space-y-1">
            <h3 className="text-lg font-bold font-display text-white">Vantagem Financeira Estruturada</h3>
            <p className="text-xs text-white/70 font-sans">Redução expressiva no custo total em comparação com o crédito bancário tradicional.</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-widest font-sans">Economia Gerada</p>
            <h2 className="text-2xl md:text-3xl font-black font-display text-white tracking-tight">
              {formatBRL(economiaConsorcio)}
            </h2>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <section className="print-card bg-gradient-to-br from-[#0c1220] to-[#0f192b] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 shadow-card">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-lg font-bold font-display text-white">Consórcio Morais Capital</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/30 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/50 uppercase font-bold font-sans">Crédito da Carta</span>
                <p className="text-base font-extrabold text-white font-display mt-1">{formatBRL(resultados?.creditoDaCarta)}</p>
              </div>
              <div className="bg-slate-900/30 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/50 uppercase font-bold font-sans">Prazo do Grupo</span>
                <p className="text-base font-extrabold text-white font-display mt-1">{form?.prazoGrupo} meses</p>
              </div>
              <div className="bg-slate-900/30 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/50 uppercase font-bold font-sans">Parcela Inicial</span>
                <p className="text-base font-extrabold text-white font-display mt-1">{formatBRL(resultados?.parcelaInicial)}</p>
              </div>
              <div className="bg-slate-900/30 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/50 uppercase font-bold font-sans">Tipo de Lance</span>
                <p className="text-base font-extrabold text-white font-display mt-1 capitalize">{form?.tipoLance?.toLowerCase()}</p>
              </div>
            </div>

            <div className="bg-[#E30613]/5 border border-[#E30613]/20 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Lance Livre Contemplado:</span>
                <span className="font-bold text-white">{formatBRL(resultados?.boletoLanceLivre)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Lance Embutido Utilizado:</span>
                <span className="font-bold text-white">{formatBRL(resultados?.lanceEmbutido)}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-white/5 pt-2">
                <span className="text-white/60 font-semibold">Custo Real Desembolsado:</span>
                <span className="font-bold text-emerald-400">{formatBRL(consorcioCustoTotal)}</span>
              </div>
            </div>
          </section>

          <section className="print-card bg-gradient-to-br from-[#0c1220] to-[#0f192b] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 shadow-card">
            <div className="flex items-center gap-2 pb-3 border-b border-white/5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <h3 className="text-lg font-bold font-display text-white">Financiamento Imobiliário</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/30 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/50 uppercase font-bold font-sans">Crédito Financiado</span>
                <p className="text-base font-extrabold text-white font-display mt-1">
                  {formatBRL(resultados?.creditoDaCarta - (resultados?.boletoLanceLivre || 0))}
                </p>
              </div>
              <div className="bg-slate-900/30 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/50 uppercase font-bold font-sans">Prazo do Contrato</span>
                <p className="text-base font-extrabold text-white font-display mt-1">{inputsFin?.prazoFin} meses</p>
              </div>
              <div className="bg-slate-900/30 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/50 uppercase font-bold font-sans">Taxa de Juros</span>
                <p className="text-base font-extrabold text-white font-display mt-1">{inputsFin?.taxaJuros}% a.a.</p>
              </div>
              <div className="bg-slate-900/30 p-4 rounded-xl border border-white/5">
                <span className="text-[10px] text-white/50 uppercase font-bold font-sans">Entrada Necessária</span>
                <p className="text-base font-extrabold text-white font-display mt-1">{inputsFin?.percentualEntrada}%</p>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-white/5 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Primeira Parcela (Estimada):</span>
                <span className="font-bold text-white">{formatBRL(finResultados?.primeiraParcela)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/60">Última Parcela (Estimada):</span>
                <span className="font-bold text-white">{formatBRL(finResultados?.ultimaParcela)}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-white/5 pt-2">
                <span className="text-white/60 font-semibold">Custo Final Projetado:</span>
                <span className="font-bold text-red-400">{formatBRL(financiamentoCustoTotal)}</span>
              </div>
            </div>
          </section>

        </div>

        <section className="print-card bg-gradient-to-br from-[#0c1220] to-[#0f192b] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 shadow-card">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
            <h3 className="text-lg font-bold font-display text-white">Rendimento & Custo de Oportunidade (CDB)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/30 p-4 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-white/50 uppercase font-bold font-sans block mb-1">Rendimento Simulado CDB</span>
              <p className="text-lg font-extrabold text-[#D4AF37] font-display">{inputsCdb?.rendimentoCdb}% do CDI</p>
            </div>
            <div className="bg-slate-900/30 p-4 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-white/50 uppercase font-bold font-sans block mb-1">Valorização Estimada do Imóvel</span>
              <p className="text-lg font-extrabold text-[#D4AF37] font-display">{inputsCdb?.valorizacaoImovel}% a.a.</p>
            </div>
            <div className="bg-slate-900/30 p-4 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-white/50 uppercase font-bold font-sans block mb-1">Saldo Final Projetado no CDB</span>
              <p className="text-lg font-extrabold text-[#D4AF37] font-display">{formatBRL(cdbResultados?.valorFinalReserva)}</p>
            </div>
          </div>

          <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-5 rounded-xl space-y-4">
            <p className="text-xs text-white/80 font-sans leading-relaxed">
              No cenário de alavancagem, o capital que seria utilizado como entrada ou amortização imediata do imóvel permanece rendendo liquidez no CDB, mitigando o desembolso e gerando um colchão de ativos líquidos que valoriza e protege seu patrimônio.
            </p>
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3 text-xs">
              <div>
                <span className="text-white/50">Custo Total da Aplicação:</span>
                <p className="font-bold text-white mt-0.5">{formatBRL(cdbResultados?.custoTotalAplicacao)}</p>
              </div>
              <div className="text-right">
                <span className="text-white/50">Retorno Patrimonial Acumulado:</span>
                <p className="font-bold text-[#D4AF37] mt-0.5">{formatBRL(cdbResultados?.valorTotalPatrimonial)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="print-card bg-gradient-to-br from-[#0c1220] to-[#0f192b] border border-white/5 rounded-2xl p-6 md:p-8 space-y-6 shadow-card">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5">
            <h3 className="text-lg font-bold font-display text-white">Resumo Geral Comparativo</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-white/60">
                  <th className="p-4 font-semibold">Parâmetro de Comparação</th>
                  <th className="p-4 font-semibold text-emerald-400 bg-emerald-500/5 text-center">Consórcio (Recomendado)</th>
                  <th className="p-4 font-semibold text-center">Financiamento</th>
                  <th className="p-4 font-semibold text-center">CDB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="p-4 font-medium text-white/80">Crédito / Carta</td>
                  <td className="p-4 text-center font-bold text-white bg-emerald-500/5">{formatBRL(resultados?.creditoDaCarta)}</td>
                  <td className="p-4 text-center text-white/70">{formatBRL(resultados?.creditoDaCarta - (resultados?.boletoLanceLivre || 0))}</td>
                  <td className="p-4 text-center text-white/70">{formatBRL(resultados?.creditoDaCarta)}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white/80">Prazo / Parcelas</td>
                  <td className="p-4 text-center font-bold text-white bg-emerald-500/5">{form?.prazoGrupo} meses</td>
                  <td className="p-4 text-center text-white/70">{inputsFin?.prazoFin} meses</td>
                  <td className="p-4 text-center text-white/70">{form?.prazoGrupo} meses</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-white/80">Aporte Inicial / Entrada</td>
                  <td className="p-4 text-center font-bold text-white bg-emerald-500/5">{formatBRL(resultados?.boletoLanceLivre)}</td>
                  <td className="p-4 text-center text-white/70">{formatBRL(finResultados?.valorEntrada)}</td>
                  <td className="p-4 text-center text-white/70">{formatBRL(resultados?.boletoLanceLivre)}</td>
                </tr>
                <tr className="bg-slate-900/20">
                  <td className="p-4 font-bold text-[#D4AF37]">CUSTO TOTAL DESEMBOLSADO</td>
                  <td className="p-4 text-center font-black text-emerald-400 bg-emerald-500/10 text-sm">{formatBRL(consorcioCustoTotal)}</td>
                  <td className="p-4 text-center font-bold text-red-400 text-sm">{formatBRL(financiamentoCustoTotal)}</td>
                  <td className="p-4 text-center font-bold text-slate-400 text-sm">—</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl flex items-start gap-3">
            <Check className="text-emerald-400 h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white">Análise de Eficiência</h4>
              <p className="text-xs text-white/70 font-sans mt-0.5 leading-relaxed">
                O **Consórcio** é a alternativa mais vantajosa para o planejamento de longo prazo, reduzindo o seu custo em **{formatPercent(economiaConsorcio / (financiamentoCustoTotal || 1))}** comparado ao financiamento imobiliário convencional, permitindo a retenção e acumulação saudável de ativos.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="print-card border-t border-white/5 py-8 px-6 text-center text-xs text-white/40 space-y-2 mt-auto">
        <p className="font-semibold text-white/60">Simulação de Alavancagem Patrimonial gerada por Morais Capital</p>
        <p className="font-mono text-[10px] text-white/30">Proposta ID: {id} • Geração em {dataProposta}</p>
        <p className="font-sans text-[10px] text-white/30 no-print">
          Este documento tem caráter exclusivamente ilustrativo e comparativo com base nos dados fornecidos e condições de mercado atuais.
        </p>
      </footer>

      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            color: black !important;
          }
          .text-white, h1, h2, h3, h4, p, span, td, th {
            color: black !important;
          }
          .text-muted-foreground, .text-white\\/40, .text-white\\/50, .text-white\\/60, .text-white\\/70 {
            color: #4a5568 !important;
          }
          .text-emerald-400 {
            color: #059669 !important;
          }
          .text-red-400 {
            color: #dc2626 !important;
          }
          .bg-emerald-500\\/5, .bg-emerald-500\\/10, .bg-[#E30613]\\/5, .bg-slate-900\\/30, .bg-slate-950\\/40, .bg-[#D4AF37]\\/5 {
            background: #f8fafc !important;
            border-color: #cbd5e1 !important;
          }
          table {
            border: 1px solid #cbd5e1 !important;
          }
          th, td {
            border-bottom: 1px solid #cbd5e1 !important;
            border-left: 1px solid #cbd5e1 !important;
          }
          tr {
            page-break-inside: avoid;
          }
          section {
            page-break-inside: avoid;
            margin-bottom: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}
