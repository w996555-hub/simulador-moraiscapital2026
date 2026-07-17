import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertTriangle, ArrowLeft, Printer } from 'lucide-react';
import { formatBRL, formatPercent } from '../lib/format';
import { calcular, calcularFinanciamento } from '../engine/engine';

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
    phone?: string;
    whatsapp?: string;
  };
  lead: string;
  data: string;
  viewMode?: string;
}

export default function PropostaPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dadosProposta, setDadosProposta] = useState<PropostaDados | null>(null);

  // Selection states
  const [sels, setSels] = useState<Set<string>>(new Set(['fin']));
  const [finalidade, setFinalidade] = useState<'aluguel' | 'proprio'>('aluguel');
  const [showDoc, setShowDoc] = useState(false);

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

            // Pre-select sections based on viewMode if available
            const view = parsed.viewMode || '';
            const initialSels = new Set<string>();
            if (view.includes('fin') || view === '') initialSels.add('fin');
            if (view.includes('apl')) initialSels.add('apl');
            if (view.includes('pat')) initialSels.add('pat');
            setSels(initialSels);

            // Skip config screen if assessor is not logged in
            const isAssessor = !!sessionStorage.getItem('usuario');
            if (!isAssessor) {
              setShowDoc(true);
            }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex flex-col items-center justify-center text-[#111] p-6">
        <Loader2 className="animate-spin text-[#C41E1E] h-12 w-12 mb-4" />
        <p className="font-sans font-semibold text-sm tracking-wider uppercase text-[#666]">Carregando Proposta...</p>
      </div>
    );
  }

  if (error || !dadosProposta) {
    return (
      <div className="min-h-screen bg-[#f0f0f0] flex flex-col items-center justify-center text-[#111] p-6">
        <div className="bg-white border border-[#e0e0e0] rounded-2xl p-8 max-w-md text-center shadow-md">
          <AlertTriangle className="text-[#C41E1E] h-16 w-16 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#C41E1E] mb-2 font-sans">Erro ao Exibir Proposta</h3>
          <p className="text-sm text-[#666] font-sans mb-6">{error || "Não foi possível carregar os dados desta proposta."}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#ddd] hover:bg-slate-50 text-xs font-bold text-[#C41E1E] uppercase tracking-wider transition-all font-sans"
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

  // ── DYNAMIC ENGINE SCENARIO CALCULATIONS ───────────────────────────────────
  let resultadosSorteio = resultados;
  let finResultadosSorteio = finResultados;
  let resultadosFidelidade = resultados;
  let finResultadosFidelidade = finResultados;

  const isActiveSorteio = form.tipoLance === 'SORTEIO';
  const isActiveFidelidade = form.tipoLance === 'FIDELIDADE' || form.tipoLance === 'LANCE LIVRE';

  if (!isActiveSorteio) {
    try {
      resultadosSorteio = calcular({
        ...form,
        tipoLance: 'SORTEIO',
        valorLanceLivre: 0,
        percentualLanceTotal: 0,
        usaEmbutido: 'NÃO'
      });
      const creditoLiquidoSorteio = resultadosSorteio.creditoDaCarta - (resultadosSorteio.boletoLanceLivre || 0);
      finResultadosSorteio = calcularFinanciamento(creditoLiquidoSorteio, inputsFin);
    } catch (e) {
      console.error("Erro ao calcular cenário Sorteio:", e);
    }
  }

  if (!isActiveFidelidade) {
    try {
      resultadosFidelidade = calcular({
        ...form,
        tipoLance: 'FIDELIDADE',
        percentualLanceTotal: form.percentualLanceTotal || 0.3,
        usaEmbutido: form.usaEmbutido || 'SIM'
      });
      const creditoLiquidoFidelidade = resultadosFidelidade.creditoDaCarta - (resultadosFidelidade.boletoLanceLivre || 0);
      finResultadosFidelidade = calcularFinanciamento(creditoLiquidoFidelidade, inputsFin);
    } catch (e) {
      console.error("Erro ao calcular cenário Fidelidade:", e);
    }
  }

  const calcularCustoTotal = (res: any) => {
    const sumOquePaga = res.tabela
      ?.filter((row: any) => row.parcela >= res.parcelaEntrada && row.parcela <= form.prazoGrupo)
      ?.reduce((sum: number, row: any) => sum + row.oquePaga, 0) || 0;
    const descontoVencidas = form?.abateOuRatea === "DESCONTAR"
      ? (res.parcelaEntrada - 1) * (res?.tabela[res?.parcelaContemplacao - 1]?.parcelaBaseFuro ?? 0)
      : 0;
    return sumOquePaga + descontoVencidas + (res.boletoLanceLivre || 0);
  };

  const custoTotalSorteio = calcularCustoTotal(resultadosSorteio);
  const custoTotalFidelidade = calcularCustoTotal(resultadosFidelidade);

  // ── SELECTION LOGIC HANDLERS ────────────────────────────────────────────────
  const tog = (v: string) => {
    setSels(prev => {
      const next = new Set(prev);
      if (next.has(v)) {
        next.delete(v);
      } else {
        next.add(v);
      }
      return next;
    });
  };

  const setFinOption = (val: 'aluguel' | 'proprio') => {
    setFinalidade(val);
  };

  const handleGerar = () => {
    setShowDoc(true);
  };

  const handleVoltar = () => {
    setShowDoc(false);
  };

  // ── DATA PREPARATION & FORMULAS ─────────────────────────────────────────────
  const meiaParcelaSorteio = resultadosSorteio.tabela[0]?.oquePaga || 0;
  const prazoRestanteSorteio = form.prazoGrupo - form.parcelasPagasAtéContemplar;

  // Lance Description Text
  const getLanceDescription = () => {
    if (form.tipoLance === 'FIDELIDADE') {
      return "VIP's Fidelidade 30%";
    }
    return `Livre - ${formatBRL(resultados.boletoLanceLivre)} (Boleto)`;
  };

  // Efeito Bola de Neve: Sorteio
  const valorRevendaSorteio = resultadosSorteio.creditoDaCarta * (form.percentualRecompra || 0.2);
  const taxaInvest = (form.txInvestimentoComparativo || 0.0085) * 100;
  const retornoMensalSorteio = valorRevendaSorteio * (form.txInvestimentoComparativo || 0.0085);
  const parcelaMensalSorteio = resultadosSorteio.tabela[0]?.oquePaga || 0;
  const totalDisponivelSorteio = retornoMensalSorteio + parcelaMensalSorteio;
  const rawNovaCartaSorteio = (totalDisponivelSorteio * 2 * (form.prazoGrupo - form.parcelasPagasAtéContemplar)) / (1 + (form.taxaAdm || 0.22) + (form.fundoReserva || 0.01));
  const novaCartaSorteio = Math.round(rawNovaCartaSorteio / 1000) * 1000;
  const crescimentoSorteio = ((novaCartaSorteio / form.credito) - 1) * 100;

  // Efeito Bola de Neve: Fidelidade
  const valorRevendaFidelidade = resultadosFidelidade.creditoDaCarta * (form.percentualRecompra || 0.2);
  const retornoMensalFidelidade = valorRevendaFidelidade * (form.txInvestimentoComparativo || 0.0085);
  const parcelaMensalFidelidade = resultadosFidelidade.tabela[0]?.oquePaga || 0;
  const totalDisponivelFidelidade = retornoMensalFidelidade + parcelaMensalFidelidade;
  const rawNovaCartaFidelidade = (totalDisponivelFidelidade * 2 * (form.prazoGrupo - form.parcelasPagasAtéContemplar)) / (1 + (form.taxaAdm || 0.22) + (form.fundoReserva || 0.01));
  const novaCartaFidelidade = Math.round(rawNovaCartaFidelidade / 1000) * 1000;
  const crescimentoFidelidade = ((novaCartaFidelidade / form.credito) - 1) * 100;

  // Aluguel Split and patrimonio calculations
  const aluguelInicialSorteio = resultadosSorteio.creditoDaCarta * (form.retornoAluguelMes || 0.005);
  const totalAluguelSorteio = aluguelInicialSorteio * (form.prazoGrupo - form.parcelasPagasAtéContemplar);
  const pctInqSorteio = Math.min(Math.max(Math.round((totalAluguelSorteio / custoTotalSorteio) * 100), 1), 99);
  const pctCompSorteio = 100 - pctInqSorteio;
  const valorImovelFimSorteio = resultadosSorteio.creditoDaCarta * Math.pow(1 + (form.correcaoImovelAno || 0.06), (form.prazoGrupo - resultadosSorteio.parcelaContemplacao) / 12);
  const patrimonioLiquidoSorteio = valorImovelFimSorteio - custoTotalSorteio;

  const aluguelInicialFidelidade = resultadosFidelidade.creditoDaCarta * (form.retornoAluguelMes || 0.005);
  const totalAluguelFidelidade = aluguelInicialFidelidade * (form.prazoGrupo - form.parcelasPagasAtéContemplar);
  const pctInqFidelidade = Math.min(Math.max(Math.round((totalAluguelFidelidade / custoTotalFidelidade) * 100), 1), 99);
  const pctCompFidelidade = 100 - pctInqFidelidade;
  const valorImovelFimFidelidade = resultadosFidelidade.creditoDaCarta * Math.pow(1 + (form.correcaoImovelAno || 0.06), (form.prazoGrupo - resultadosFidelidade.parcelaContemplacao) / 12);
  const patrimonioLiquidoFidelidade = valorImovelFimFidelidade - custoTotalFidelidade;

  // CDB Time Accumulation
  const cdbValorAlvo = resultadosSorteio.creditoDaCarta;
  const cdbAportesMes = resultadosSorteio.tabela[0]?.oquePaga || 1397.73;
  const cdbTaxaMensal = (inputsCdb?.rendimentoCdb || 12) / 12 / 100;
  const cdbTotalMeses = Math.log(1 + (cdbValorAlvo * cdbTaxaMensal) / cdbAportesMes) / Math.log(1 + cdbTaxaMensal);
  const cdbAnos = Math.floor(cdbTotalMeses / 12);
  const cdbMeses = Math.round(cdbTotalMeses % 12);

  // Formatting contact info
  const phoneFormatted = assessor.whatsapp || assessor.phone || '';

  // Return display conditions (symmetrical rendering)
  const showRetornoAoMesFinanceira = (resultadosSorteio?.retornoAoMes || 0) >= 0.005 && (resultadosFidelidade?.retornoAoMes || 0) >= 0.005;
  const showRetornoAoMesAplicacao = (resultadosSorteio?.retornoAoMes || 0) >= 0.005 && (resultadosFidelidade?.retornoAoMes || 0) >= 0.005;

  return (
    <div className="font-sans text-[#111] antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        /* Layout Estático Fiel */
        #tela-sel {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          background: #f0f0f0;
        }
        .modal {
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e0e0e0;
          width: 500px;
          padding: 32px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .logo {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 24px;
        }
        .logo span {
          color: #C41E1E;
        }
        .modal h2 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 6px;
          color: #111;
        }
        .modal p {
          font-size: 13px;
          color: #666;
          margin-bottom: 22px;
        }
        .slabel {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .8px;
          color: #999;
          margin-bottom: 8px;
        }
        .opt {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 11px 14px;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 8px;
          user-select: none;
          background: #fff;
          transition: all 0.2s;
        }
        .opt:hover, .opt.sel {
          border-color: #C41E1E;
          background: #fdf5f5;
        }
        .opt input {
          width: 16px;
          height: 16px;
          accent-color: #C41E1E;
          cursor: pointer;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .opt-lbl {
          font-size: 14px;
          font-weight: 500;
          color: #111;
          text-align: left;
        }
        .opt.sel .opt-lbl {
          color: #C41E1E;
        }
        .opt-sub {
          font-size: 11px;
          color: #999;
          margin-top: 2px;
          text-align: left;
        }
        .sub-panel {
          background: #fafafa;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          padding: 14px 16px;
          margin-bottom: 8px;
        }
        .radio-row {
          display: flex;
          gap: 10px;
          margin-top: 8px;
        }
        .ropt {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          cursor: pointer;
          user-select: none;
          background: #fff;
          transition: all 0.2s;
        }
        .ropt:hover, .ropt.sel {
          border-color: #C41E1E;
          background: #fdf5f5;
        }
        .ropt input {
          accent-color: #C41E1E;
          width: 15px;
          height: 15px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .ropt span {
          font-size: 13px;
          font-weight: 500;
          color: #111;
        }
        .ropt.sel span {
          color: #C41E1E;
        }
        .mdiv {
          height: 1px;
          background: #f0f0f0;
          margin: 14px 0;
        }
        .btn-gerar {
          width: 100%;
          background: #C41E1E;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 13px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 18px;
          transition: background 0.2s;
        }
        .btn-gerar:hover {
          background: #a81818;
        }
        
        /* Proposta Document View */
        #tela-doc {
          background: #f0f0f0;
          min-height: 100vh;
          padding: 28px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          flex-direction: column;
        }
        .toolbar {
          width: 794px;
          margin: 0 auto 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .btn-print {
          background: #C41E1E;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 9px 20px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-print:hover {
          background: #a81818;
        }
        .btn-voltar {
          background: transparent;
          color: #666;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 9px 16px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-voltar:hover {
          background: #fff;
          color: #111;
        }
        .tinfo {
          font-size: 12px;
          color: #666;
        }
        .tinfo strong {
          color: #111;
        }
        .a4 {
          width: 794px;
          min-height: 1123px;
          background: #fff;
          margin: 0 auto;
          padding: 36px 44px 44px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          text-align: left;
        }
        .hdr {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #C41E1E;
          padding-bottom: 14px;
          margin-bottom: 18px;
        }
        .hdr-brand {
          font-size: 19px;
          font-weight: 700;
          letter-spacing: 1.5px;
        }
        .hdr-brand span {
          color: #C41E1E;
        }
        .hdr-sub {
          font-size: 10px;
          color: #999;
          margin-top: 3px;
        }
        .hdr-meta {
          text-align: right;
          font-size: 11px;
          color: #666;
          line-height: 1.7;
        }
        .pid {
          display: inline-block;
          background: #111;
          color: #fff;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 3px;
          letter-spacing: .5px;
          margin-bottom: 3px;
        }
        .doc-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 3px;
          color: #111;
        }
        .doc-sub {
          font-size: 10px;
          color: #999;
          margin-bottom: 16px;
        }
        .ig3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 7px;
          margin-bottom: 7px;
        }
        .ig2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px;
          margin-bottom: 7px;
        }
        .ic {
          background: #f8f8f8;
          border-radius: 5px;
          padding: 8px 11px;
        }
        .ic .l {
          font-size: 9px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: .6px;
          margin-bottom: 2px;
        }
        .ic .v {
          font-size: 12px;
          font-weight: 600;
          color: #111;
        }
        .ic .v.red {
          color: #C41E1E;
        }
        .sdiv {
          height: 1px;
          background: #ebebeb;
          margin: 16px 0;
        }
        .shead {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 10px;
        }
        .sdot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #C41E1E;
          flex-shrink: 0;
        }
        .stitle {
          font-size: 10px;
          font-weight: 700;
          color: #C41E1E;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .stag {
          display: inline-block;
          background: #f5f5f5;
          color: #666;
          font-size: 8px;
          font-weight: 600;
          border-radius: 3px;
          padding: 2px 7px;
          margin-bottom: 9px;
          text-transform: uppercase;
          letter-spacing: .4px;
        }
        .snote {
          font-size: 8.5px;
          color: #888;
          font-style: italic;
          margin-top: 9px;
          padding-top: 8px;
          border-top: 1px solid #f0f0f0;
          line-height: 1.5;
        }
        .col2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 6px;
        }
        .col-box {
          border-radius: 7px;
          overflow: hidden;
          border: 1px solid #e8e8e8;
        }
        .col-hdr {
          padding: 7px 12px;
        }
        .col-hdr.sorteio {
          background: #111;
        }
        .col-hdr.lance {
          background: #C41E1E;
        }
        .ch-label {
          font-size: 9px;
          font-weight: 700;
          color: #fff;
          text-transform: uppercase;
          letter-spacing: .8px;
        }
        .ch-sub {
          font-size: 8px;
          color: rgba(255,255,255,.6);
          margin-top: 1px;
        }
        .col-body {
          padding: 10px;
        }
        .ck {
          background: #f8f8f8;
          border-radius: 5px;
          padding: 8px 10px;
          margin-bottom: 6px;
        }
        .ck:last-child {
          margin-bottom: 0;
        }
        .ck .l {
          font-size: 8.5px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: .5px;
          margin-bottom: 2px;
        }
        .ck .v {
          font-size: 14px;
          font-weight: 700;
          color: #111;
        }
        .ck .v.red {
          color: #C41E1E;
        }
        .ck.dark {
          background: #111;
        }
        .ck.dark .l {
          color: #666;
        }
        .ck.dark .v {
          color: #fff;
        }
        
        /* Bola de Neve */
        .bdn {
          border: 2px solid #111;
          border-radius: 8px;
          padding: 14px 16px;
          margin-top: 10px;
        }
        .bdn-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .8px;
          color: #111;
          margin-bottom: 12px;
        }
        .bdn-badge {
          background: #111;
          color: #fff;
          font-size: 8px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 3px;
          letter-spacing: .4px;
          margin-left: 6px;
        }
        .bdn-col2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .bdn-col {
          background: #f8f8f8;
          border-radius: 6px;
          padding: 12px;
        }
        .bch {
          font-size: 8.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .5px;
          margin-bottom: 6px;
          padding-bottom: 6px;
          border-bottom: 1px solid #e8e8e8;
        }
        .bch.sor {
          color: #111;
        }
        .bch.lan {
          color: #C41E1E;
        }
        .bdn-hint {
          font-size: 8px;
          color: #aaa;
          margin-bottom: 8px;
          font-style: italic;
        }
        .eq-box {
          background: #fff;
          border: 1px solid #e8e8e8;
          border-radius: 5px;
          padding: 6px 9px;
          margin-bottom: 6px;
        }
        .eq-box .l {
          font-size: 7.5px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: .4px;
          margin-bottom: 1px;
        }
        .eq-box .v {
          font-size: 11px;
          font-weight: 600;
          color: #111;
        }
        .eq-result {
          background: #111;
          border-radius: 6px;
          padding: 10px 12px;
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .eq-result .l {
          font-size: 8px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: .5px;
          margin-bottom: 3px;
        }
        .eq-result .v {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
        }
        .eq-pct {
          text-align: right;
        }
        .eq-pct strong {
          color: #4ade80;
          display: block;
          font-size: 13px;
        }
        .eq-pct span {
          font-size: 9px;
          color: #aaa;
        }
        
        /* Patrimonial */
        .split-wrap {
          margin: 10px 0;
        }
        .split-labels {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        .split-labels span {
          font-size: 8.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .4px;
        }
        .split-labels .sl {
          color: #C41E1E;
        }
        .split-labels .sr {
          color: #111;
        }
        .split-bar {
          height: 20px;
          border-radius: 3px;
          overflow: hidden;
          display: flex;
        }
        .split-bar .comp {
          background: #C41E1E;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
        }
        .split-bar .inq {
          background: #111;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
        }
        .split-subs {
          display: flex;
          justify-content: space-between;
          margin-top: 4px;
        }
        .split-subs span {
          font-size: 8px;
          color: #888;
        }
        .imovel-box {
          background: #111;
          border-radius: 6px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 8px;
        }
        .imovel-box .l {
          font-size: 8px;
          color: #777;
          text-transform: uppercase;
          letter-spacing: .5px;
          margin-bottom: 3px;
        }
        .imovel-box .v {
          font-size: 16px;
          font-weight: 700;
          color: #fff;
        }
        .imovel-box .sub {
          font-size: 8px;
          color: #555;
          margin-top: 2px;
        }
        .imovel-box .gain .v {
          color: #4ade80;
        }
        .imovel-note {
          font-size: 8px;
          color: #888;
          font-style: italic;
          margin-top: 5px;
          line-height: 1.4;
        }
        
        /* Financiamento destaque */
        .fin-dest {
          border: 2px solid #C41E1E;
          border-radius: 7px;
          padding: 13px 15px;
          margin-top: 10px;
        }
        .fin-dest-title {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .8px;
          color: #C41E1E;
          margin-bottom: 10px;
        }
        .econ-box {
          background: #C41E1E;
          border-radius: 6px;
          padding: 11px 14px;
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .econ-box .l {
          font-size: 8px;
          color: rgba(255,255,255,.7);
          text-transform: uppercase;
          letter-spacing: .5px;
          margin-bottom: 3px;
        }
        .econ-box .v {
          font-size: 18px;
          font-weight: 700;
          color: #fff;
        }
        .econ-box .det {
          font-size: 9px;
          color: rgba(255,255,255,.8);
          text-align: right;
          line-height: 1.6;
        }
        
        /* CDB */
        .cdb-box {
          background: #EAF3DE;
          border: 1px solid #C0DD97;
          border-radius: 7px;
          padding: 12px 14px;
          margin-top: 8px;
        }
        .cdb-box .cdb-title {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .6px;
          color: #3B6D11;
          margin-bottom: 9px;
        }
        
        /* Disclaimer */
        .disc {
          background: #f8f8f8;
          border-radius: 5px;
          padding: 10px 12px;
          margin-top: 18px;
          border-left: 3px solid #C41E1E;
        }
        .disc p {
          font-size: 8.5px;
          color: #666;
          line-height: 1.6;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #ebebeb;
          padding-top: 10px;
          margin-top: 16px;
        }
        .footer .fb {
          font-size: 9px;
          color: #999;
        }
        .footer .fb strong {
          color: #C41E1E;
        }
        .footer .fc {
          font-size: 9px;
          color: #999;
          text-align: right;
        }
        
        /* Print Styles */
        @media print {
          html, body {
            background: #fff !important;
            color: #111 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #tela-sel {
            display: none !important;
          }
          #tela-doc {
            display: block !important;
            background: #fff !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          .toolbar {
            display: none !important;
          }
          .a4 {
            margin: 0 !important;
            width: 100% !important;
            box-shadow: none !important;
            padding: 36px 44px 44px !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>

      {/* TELA DE SELEÇÃO */}
      {!showDoc && (
        <div id="tela-sel">
          <div className="modal">
            <div className="logo font-sans">MORAIS <span>CAPITAL</span></div>
            <h2>Gerar proposta</h2>
            <p>Selecione as seções e configure antes de gerar o documento.</p>
            
            <div className="slabel font-sans">Seções de alavancagem</div>
            
            <div className={`opt ${sels.has('fin') ? 'sel' : ''}`} onClick={() => tog('fin')}>
              <input type="checkbox" checked={sels.has('fin')} readOnly />
              <div>
                <div className="opt-lbl font-sans">Alavancagem financeira</div>
                <div className="opt-sub font-sans">Revenda da carta — sorteio vs. VIP's Fidelidade</div>
              </div>
            </div>
            
            <div className={`opt ${sels.has('apl') ? 'sel' : ''}`} onClick={() => tog('apl')}>
              <input type="checkbox" checked={sels.has('apl')} readOnly />
              <div>
                <div className="opt-lbl font-sans">Alavancagem de aplicação</div>
                <div className="opt-sub font-sans">Crédito aplicado em fundo — sorteio vs. VIP's Fidelidade</div>
              </div>
            </div>
            
            <div className={`opt ${sels.has('pat') ? 'sel' : ''}`} onClick={() => tog('pat')}>
              <input type="checkbox" checked={sels.has('pat')} readOnly />
              <div>
                <div className="opt-lbl font-sans">Alavancagem patrimonial</div>
                <div className="opt-sub font-sans">Uso do imóvel — sorteio vs. VIP's Fidelidade</div>
              </div>
            </div>

            {sels.has('pat') && (
              <div id="pat-extra" className="animate-in fade-in duration-200">
                <div className="sub-panel">
                  <div className="slabel font-sans">Finalidade do imóvel</div>
                  <div className="radio-row">
                    <div className={`ropt ${finalidade === 'aluguel' ? 'sel' : ''}`} onClick={() => setFinOption('aluguel')}>
                      <input type="radio" checked={finalidade === 'aluguel'} readOnly />
                      <span className="font-sans">Aluguel</span>
                    </div>
                    <div className={`ropt ${finalidade === 'proprio' ? 'sel' : ''}`} onClick={() => setFinOption('proprio')}>
                      <input type="radio" checked={finalidade === 'proprio'} readOnly />
                      <span className="font-sans">Uso próprio</span>
                    </div>
                  </div>
                  
                  <div className="mdiv"></div>
                  
                  <div className="slabel font-sans">Comparativos adicionais</div>
                  <div className={`opt ${sels.has('fincmp') ? 'sel' : ''}`} onClick={() => tog('fincmp')} style={{ marginBottom: '7px' }}>
                    <input type="checkbox" checked={sels.has('fincmp')} readOnly />
                    <div><div className="opt-lbl font-sans">Comparativo com financiamento bancário</div></div>
                  </div>
                  <div className={`opt ${sels.has('cdbcmp') ? 'sel' : ''}`} onClick={() => tog('cdbcmp')}>
                    <input type="checkbox" checked={sels.has('cdbcmp')} readOnly />
                    <div><div className="opt-lbl font-sans">Comparativo com CDB</div></div>
                  </div>
                </div>
              </div>
            )}

            <button className="btn-gerar font-sans" onClick={handleGerar}>Gerar proposta →</button>
          </div>
        </div>
      )}

      {/* PROPOSTA PRONTA */}
      {showDoc && (
        <div id="tela-doc">
          <div className="toolbar no-print">
            <button className="btn-voltar font-sans" onClick={handleVoltar}>← Voltar</button>
            <span className="tinfo font-sans">Proposta Comercial · {dataProposta}</span>
            <button className="btn-print font-sans" onClick={(e) => { e.currentTarget.blur(); setTimeout(() => window.print(), 150); }}>Imprimir / PDF</button>
          </div>
          
          <div className="a4">
            <div className="hdr">
              <div>
                <div className="hdr-brand font-sans">MORAIS <span>CAPITAL</span></div>
                <div className="hdr-sub font-sans">Estratégia patrimonial com consórcio</div>
              </div>
              <div className="hdr-meta font-sans">
                <div>{dataProposta}</div>
                <div>Cliente: <strong style={{ color: '#111' }}>{lead}</strong></div>
                <div>Corretor: <strong style={{ color: '#111' }}>{assessor.nome}</strong></div>
                {phoneFormatted && <div>{phoneFormatted}</div>}
              </div>
            </div>

            <div className="doc-title font-sans">Proposta de alavancagem com simulação de contemplação</div>
            <div className="doc-sub font-sans">Valores estimados com base nos parâmetros informados. Sujeito às condições do grupo.</div>

            {/* Dados da simulação — sem duplicatas */}
            <div className="ig3">
              <div className="ic"><div className="l font-sans">Crédito contratado</div><div className="v red font-display">{formatBRL(form.credito)}</div></div>
              <div className="ic"><div className="l font-sans">Meia parcela</div><div className="v font-display">{formatBRL(meiaParcelaSorteio)} / mês</div></div>
              <div className="ic"><div className="l font-sans">Prazo do grupo</div><div className="v font-display">{form.prazoGrupo} meses</div></div>
              <div className="ic"><div className="l font-sans">Correção do crédito</div><div className="v font-display">{(form.correcaoCredito * 100).toFixed(1)}% a.a.</div></div>
              <div className="ic"><div className="l font-sans">Seguro</div><div className="v font-display">{form.tipoSeguro}</div></div>
              <div className="ic"><div className="l font-sans">Parcelas até contemplar</div><div className="v font-display">{form.parcelasPagasAtéContemplar}</div></div>
            </div>
            <div className="ig2" style={{ gridTemplateColumns: '2fr 1fr' }}>
              <div className="ic"><div className="l font-sans">Lance</div><div className="v font-display">{getLanceDescription()}</div></div>
              <div className="ic"><div className="l font-sans">Parcelas restantes após contemplação</div><div className="v font-display">{prazoRestanteSorteio}</div></div>
            </div>

            {/* FINANCEIRA */}
            {sels.has('fin') && (
              <div id="b-fin">
                <div className="sdiv"></div>
                <div className="shead">
                  <div className="sdot"></div>
                  <div className="stitle font-sans">Alavancagem financeira</div>
                </div>
                <div className="stag font-sans">Revenda da carta após contemplação</div>
                
                <div className="col2">
                  {/* Sorteio */}
                  <div className="col-box">
                    <div className="col-hdr sorteio">
                      <div className="ch-label font-sans">Contemplação por sorteio</div>
                      <div className="ch-sub font-sans">Sem lance</div>
                    </div>
                    <div className="col-body">
                      <div className="ck"><div className="l font-sans">Valor investido até a contemplação</div><div className="v font-display">{formatBRL(resultadosSorteio.desembolso + (resultadosSorteio.boletoLanceLivre || 0))}</div></div>
                      <div className="ck"><div className="l font-sans">Crédito da carta</div><div className="v font-display">{formatBRL(resultadosSorteio.creditoDaCarta)}</div></div>
                      <div className="ck"><div className="l font-sans">Valor de revenda estimado ({(form.percentualRecompra * 100).toFixed(0)}%)</div><div className="v red font-display">{formatBRL(valorRevendaSorteio)}</div></div>
                       {showRetornoAoMesFinanceira && (
                         <div className="ck"><div className="l font-sans">Retorno ao mês</div><div className="v red font-display">{(resultadosSorteio.retornoAoMes * 100).toFixed(2)}% a.m.</div></div>
                       )}
                      <div className="ck dark"><div className="l font-sans">Retorno total</div><div className="v font-display">{(resultadosSorteio.retornoTotalPercent * 100).toFixed(1)}%</div></div>
                    </div>
                  </div>
                  
                  {/* VIP's Fidelidade */}
                  <div className="col-box">
                    <div className="col-hdr lance">
                      <div className="ch-label font-sans">{form.tipoLance === 'LANCE LIVRE' ? 'Lance Livre' : "VIP's Fidelidade"}</div>
                      <div className="ch-sub font-sans">{form.tipoLance === 'LANCE LIVRE' ? 'Lance Ofertado' : 'Lance 30%'}</div>
                    </div>
                    <div className="col-body">
                      <div className="ck"><div className="l font-sans">Valor investido até a contemplação</div><div className="v font-display">{formatBRL(resultadosFidelidade.desembolso + (resultadosFidelidade.boletoLanceLivre || 0))}</div></div>
                      <div className="ck"><div className="l font-sans">Crédito da carta</div><div className="v font-display">{formatBRL(resultadosFidelidade.creditoDaCarta)}</div></div>
                      <div className="ck"><div className="l font-sans">Valor de revenda estimado ({(form.percentualRecompra * 100).toFixed(0)}%)</div><div className="v red font-display">{formatBRL(valorRevendaFidelidade)}</div></div>
                       {showRetornoAoMesFinanceira && (
                         <div className="ck"><div className="l font-sans">Retorno ao mês</div><div className="v red font-display">{(resultadosFidelidade.retornoAoMes * 100).toFixed(2)}% a.m.</div></div>
                       )}
                      <div className="ck dark"><div className="l font-sans">Retorno total</div><div className="v font-display">{(resultadosFidelidade.retornoTotalPercent * 100).toFixed(1)}%</div></div>
                    </div>
                  </div>
                </div>

                {/* Efeito Bola de Neve */}
                <div className="bdn">
                  <div className="bdn-title font-sans">Efeito <span className="bdn-badge">Bola de Neve</span></div>
                  <div className="bdn-col2">
                    <div className="bdn-col">
                      <div className="bch sor font-sans">Sorteio — próxima carta</div>
                      <div className="bdn-hint font-sans">Aplicando {formatBRL(valorRevendaSorteio)} (valor de revenda) a {taxaInvest.toFixed(2)}% a.m.</div>
                      <div className="eq-box"><div className="l font-sans">Retorno mensal da aplicação</div><div className="v font-display">+ {formatBRL(retornoMensalSorteio)} / mês</div></div>
                      <div className="eq-box"><div className="l font-sans">Parcela que já pagava</div><div className="v font-display">+ {formatBRL(parcelaMensalSorteio)} / mês</div></div>
                      <div className="eq-result">
                        <div><div className="l font-sans">Nova carta possível</div><div className="v font-display">{formatBRL(novaCartaSorteio)}</div></div>
                        <div className="eq-pct font-sans"><strong className="text-emerald-500">+{crescimentoSorteio.toFixed(0)}%</strong><span>vs. carta original</span></div>
                      </div>
                    </div>
                    
                    <div className="bdn-col">
                      <div className="bch lan font-sans">{form.tipoLance === 'LANCE LIVRE' ? 'Lance Livre' : "VIP's Fidelidade"} — próxima carta</div>
                      <div className="bdn-hint font-sans">Aplicando {formatBRL(valorRevendaFidelidade)} (valor de revenda) a {taxaInvest.toFixed(2)}% a.m.</div>
                      <div className="eq-box"><div className="l font-sans">Retorno mensal da aplicação</div><div className="v font-display">+ {formatBRL(retornoMensalFidelidade)} / mês</div></div>
                      <div className="eq-box"><div className="l font-sans">Parcela que já pagava</div><div className="v font-display">+ {formatBRL(parcelaMensalFidelidade)} / mês</div></div>
                      <div className="eq-result">
                        <div><div className="l font-sans">Nova carta possível</div><div className="v font-display">{formatBRL(novaCartaFidelidade)}</div></div>
                        <div className="eq-pct font-sans"><strong className="text-emerald-500">+{crescimentoFidelidade.toFixed(0)}%</strong><span>vs. carta original</span></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="snote font-sans">Projeção do efeito bola de neve: retorno mensal do valor de revenda aplicado à taxa comparativa somado à parcela atual, calculando o crédito de uma nova carta com os mesmos parâmetros do grupo.</div>
              </div>
            )}

            {/* APLICAÇÃO */}
            {sels.has('apl') && (
              <div id="b-apl">
                <div className="sdiv"></div>
                <div className="shead">
                  <div className="sdot"></div>
                  <div className="stitle font-sans">Alavancagem de aplicação</div>
                </div>
                <div className="stag font-sans">Crédito da carta aplicado em fundo de investimento</div>
                
                <div className="col2">
                  <div className="col-box">
                    <div className="col-hdr sorteio">
                      <div className="ch-label font-sans">Contemplação por sorteio</div>
                      <div className="ch-sub font-sans">Sem lance</div>
                    </div>
                    <div className="col-body">
                      <div className="ck"><div className="l font-sans">Valor investido até a contemplação</div><div className="v font-display">{formatBRL(resultadosSorteio.desembolso + (resultadosSorteio.boletoLanceLivre || 0))}</div></div>
                      <div className="ck"><div className="l font-sans">Crédito da carta (aplicado)</div><div className="v font-display">{formatBRL(resultadosSorteio.creditoDaCarta)}</div></div>
                      <div className="ck"><div className="l font-sans">Valor corrigido estimado</div><div className="v red font-display">{formatBRL(resultadosSorteio.valorCorrigidoAplicacao)}</div></div>
                      <div className="ck"><div className="l font-sans">Lucro líquido estimado</div><div className="v font-display">{formatBRL(resultadosSorteio.lucroLiquidoAplicacao)}</div></div>
                       {showRetornoAoMesAplicacao && (
                         <div className="ck"><div className="l font-sans">Retorno ao mês</div><div className="v font-display">{(resultadosSorteio.retornoAoMes * 100).toFixed(2)}% a.m.</div></div>
                       )}
                       <div className="ck dark"><div className="l font-sans">Retorno total</div><div className="v font-display">{(resultadosSorteio.retornoAplicacaoPercent * 100).toFixed(3).replace('.', ',')}%</div></div>
                    </div>
                  </div>
                  
                  <div className="col-box">
                    <div className="col-hdr lance">
                      <div className="ch-label font-sans">{form.tipoLance === 'LANCE LIVRE' ? 'Lance Livre' : "VIP's Fidelidade"}</div>
                      <div className="ch-sub font-sans">{form.tipoLance === 'LANCE LIVRE' ? 'Lance Ofertado' : 'Lance 30%'}</div>
                    </div>
                    <div className="col-body">
                      <div className="ck"><div className="l font-sans">Valor investido até a contemplação</div><div className="v font-display">{formatBRL(resultadosFidelidade.desembolso + (resultadosFidelidade.boletoLanceLivre || 0))}</div></div>
                      <div className="ck"><div className="l font-sans">Crédito da carta (aplicado)</div><div className="v font-display">{formatBRL(resultadosFidelidade.creditoDaCarta)}</div></div>
                      <div className="ck"><div className="l font-sans">Valor corrigido estimado</div><div className="v red font-display">{formatBRL(resultadosFidelidade.valorCorrigidoAplicacao)}</div></div>
                      <div className="ck"><div className="l font-sans">Lucro líquido estimado</div><div className="v font-display">{formatBRL(resultadosFidelidade.lucroLiquidoAplicacao)}</div></div>
                      {showRetornoAoMesAplicacao && (
                        <div className="ck"><div className="l font-sans">Retorno ao mês</div><div className="v font-display">{(resultadosFidelidade.retornoAoMes * 100).toFixed(2)}% a.m.</div></div>
                      )}
                      <div className="ck dark"><div className="l font-sans">Retorno total</div><div className="v font-display">{(resultadosFidelidade.retornoAplicacaoPercent * 100).toFixed(3).replace('.', ',')}%</div></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PATRIMONIAL */}
            {sels.has('pat') && (
              <div id="b-pat">
                <div className="sdiv"></div>
                <div className="shead">
                  <div className="sdot"></div>
                  <div className="stitle font-sans">Alavancagem patrimonial</div>
                </div>

                {/* ALUGUEL */}
                {finalidade === 'aluguel' && (
                  <div id="m-aluguel">
                    <div className="stag font-sans">Imóvel para renda — o inquilino divide o custo com você</div>
                    <div className="col2">
                      <div className="col-box">
                        <div className="col-hdr sorteio"><div className="ch-label font-sans">Contemplação por sorteio</div></div>
                        <div className="col-body">
                          <div className="ck"><div className="l font-sans">Crédito da carta</div><div className="v font-display">{formatBRL(resultadosSorteio.creditoDaCarta)}</div></div>
                          <div className="ck"><div className="l font-sans">Parcela pós contemplação</div><div className="v red font-display">{formatBRL(resultadosSorteio.parcelaPosContemplacao)} / mês</div></div>
                          <div className="ck"><div className="l font-sans">Aluguel inicial estimado</div><div className="v font-display" style={{ color: '#27500A' }}>{formatBRL(aluguelInicialSorteio)} / mês</div></div>
                          
                          <div className="split-wrap">
                            <div className="split-labels">
                              <span className="sl font-sans">Você — {pctCompSorteio}%</span>
                              <span className="sr font-sans">Inquilino — {pctInqSorteio}%</span>
                            </div>
                            <div className="split-bar">
                              <div className="comp font-sans" style={{ width: `${pctCompSorteio}%` }}>{pctCompSorteio}%</div>
                              <div className="inq font-sans" style={{ width: `${pctInqSorteio}%` }}>{pctInqSorteio}%</div>
                            </div>
                            <div className="split-subs font-sans"><span>do custo total</span><span>coberto pelo aluguel</span></div>
                          </div>
                          
                          <div className="imovel-box">
                            <div>
                              <div className="l font-sans">Imóvel ao fim do consórcio</div>
                              <div className="v font-display">{formatBRL(Math.round(valorImovelFimSorteio / 1000) * 1000)}</div>
                              <div className="sub font-sans">Valoriz. {(form.correcaoImovelAno * 100).toFixed(0)}% a.a. / {(form.prazoGrupo / 12).toFixed(0)} anos</div>
                            </div>
                            <div className="gain">
                              <div className="l font-sans">Patrimônio gerado</div>
                              <div className="v font-display" style={{ color: '#4ade80', fontSize: '13px' }}>{formatBRL(Math.round(patrimonioLiquidoSorteio / 1000) * 1000)}</div>
                            </div>
                          </div>
                          <div className="imovel-note font-sans">Patrimônio gerado = valor estimado do imóvel ao fim do consórcio menos o total desembolsado na operação.</div>
                        </div>
                      </div>

                      <div className="col-box">
                        <div className="col-hdr lance"><div className="ch-label font-sans">{form.tipoLance === 'LANCE LIVRE' ? 'Lance Livre' : "VIP's Fidelidade"}</div></div>
                        <div className="col-body">
                          <div className="ck"><div className="l font-sans">Crédito da carta</div><div className="v font-display">{formatBRL(resultadosFidelidade.creditoDaCarta)}</div></div>
                          <div className="ck"><div className="l font-sans">Parcela pós contemplação</div><div className="v red font-display">{formatBRL(resultadosFidelidade.parcelaPosContemplacao)} / mês</div></div>
                          <div className="ck"><div className="l font-sans">Aluguel inicial estimado</div><div className="v font-display" style={{ color: '#27500A' }}>{formatBRL(aluguelInicialFidelidade)} / mês</div></div>
                          
                          <div className="split-wrap">
                            <div className="split-labels">
                              <span className="sl font-sans">Você — {pctCompFidelidade}%</span>
                              <span className="sr font-sans">Inquilino — {pctInqFidelidade}%</span>
                            </div>
                            <div className="split-bar">
                              <div className="comp font-sans" style={{ width: `${pctCompFidelidade}%` }}>{pctCompFidelidade}%</div>
                              <div className="inq font-sans" style={{ width: `${pctInqFidelidade}%` }}>{pctInqFidelidade}%</div>
                            </div>
                            <div className="split-subs font-sans"><span>do custo total</span><span>coberto pelo aluguel</span></div>
                          </div>
                          
                          <div className="imovel-box">
                            <div>
                              <div className="l font-sans">Imóvel ao fim do consórcio</div>
                              <div className="v font-display">{formatBRL(Math.round(valorImovelFimFidelidade / 1000) * 1000)}</div>
                              <div className="sub font-sans">Valoriz. {(form.correcaoImovelAno * 100).toFixed(0)}% a.a. / {(form.prazoGrupo / 12).toFixed(0)} anos</div>
                            </div>
                            <div className="gain">
                              <div className="l font-sans">Patrimônio gerado</div>
                              <div className="v font-display" style={{ color: '#4ade80', fontSize: '13px' }}>{formatBRL(Math.round(patrimonioLiquidoFidelidade / 1000) * 1000)}</div>
                            </div>
                          </div>
                          <div className="imovel-note font-sans">Patrimônio gerado = valor estimado do imóvel ao fim do consórcio menos o total desembolsado na operação.</div>
                        </div>
                      </div>
                    </div>
                    <div className="snote font-sans">O aluguel cobre a maior parte do custo da operação. Enquanto o inquilino financia seu patrimônio, você acumula um ativo real com valorização consistente — sem comprometer sua renda do zero.</div>
                  </div>
                )}

                {/* USO PRÓPRIO */}
                {finalidade === 'proprio' && (
                  <div id="m-proprio">
                    <div className="stag font-sans">Imóvel para uso próprio</div>
                    <div className="col2">
                      <div className="col-box">
                        <div className="col-hdr sorteio"><div className="ch-label font-sans">Contemplação por sorteio</div></div>
                        <div className="col-body">
                          <div className="ck"><div className="l font-sans">Crédito da carta</div><div className="v font-display">{formatBRL(resultadosSorteio.creditoDaCarta)}</div></div>
                          <div className="ck"><div className="l font-sans">Parcela pós contemplação</div><div className="v red font-display">{formatBRL(resultadosSorteio.parcelaPosContemplacao)} / mês</div></div>
                        </div>
                      </div>
                      <div className="col-box">
                        <div className="col-hdr lance"><div className="ch-label font-sans">{form.tipoLance === 'LANCE LIVRE' ? 'Lance Livre' : "VIP's Fidelidade"}</div></div>
                        <div className="col-body">
                          <div className="ck"><div className="l font-sans">Crédito da carta</div><div className="v font-display">{formatBRL(resultadosFidelidade.creditoDaCarta)}</div></div>
                          <div className="ck"><div className="l font-sans">Parcela pós contemplação</div><div className="v red font-display">{formatBRL(resultadosFidelidade.parcelaPosContemplacao)} / mês</div></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* COMPARATIVO FINANCIAMENTO */}
                {sels.has('fincmp') && (
                  <div id="b-fincmp">
                    <div className="fin-dest" style={{ marginTop: '10px' }}>
                      <div className="fin-dest-title font-sans">Por que o consórcio supera o financiamento bancário?</div>
                      <div className="col2" style={{ marginBottom: '7px' }}>
                        <div className="ic">
                          <div className="l font-sans">Crédito considerado</div>
                          <div className="v font-display">{formatBRL(finResultadosSorteio.valorImovel)}</div>
                        </div>
                        <div className="ic">
                          <div className="l font-sans">Entrada no financiamento ({(inputsFin.percentualEntrada || 20)}%)</div>
                          <div className="v font-display">{formatBRL(finResultadosSorteio.entrada)}</div>
                        </div>
                      </div>
                      <div className="ig3">
                        <div className="ic">
                          <div className="l font-sans">Parcela inicial — financiamento SAC</div>
                          <div className="v red font-display">{formatBRL(finResultadosSorteio.parcelaInicialFin)} / mês</div>
                        </div>
                        <div className="ic">
                          <div className="l font-sans">Parcela inicial — consórcio (sorteio)</div>
                          <div className="v font-display" style={{ color: '#27500A' }}>{formatBRL(meiaParcelaSorteio)} / mês</div>
                        </div>
                        <div className="ic">
                          <div className="l font-sans">Diferença na parcela inicial</div>
                          <div className="v font-display">− {formatBRL(finResultadosSorteio.parcelaInicialFin - meiaParcelaSorteio)}</div>
                        </div>
                      </div>
                      <div className="econ-box">
                        <div>
                          <div className="l font-sans">Economia total com o consórcio</div>
                          <div className="v font-display">{formatBRL(finResultadosSorteio.custoTotalFinanciamento - custoTotalSorteio)}</div>
                        </div>
                        <div className="det font-sans">
                          Financiamento: {formatBRL(finResultadosSorteio.custoTotalFinanciamento)} total<br />
                          Consórcio: {formatBRL(custoTotalSorteio)} total
                        </div>
                      </div>
                      <div className="snote font-sans" style={{ marginTop: '8px' }}>Comparativo com SAC {(inputsFin.taxaJuros || 10.74).toFixed(2)}% a.a. + TR, prazo {(inputsFin.prazoFin / 12).toFixed(0)} anos, {(inputsFin.percentualEntrada || 20)}% de entrada. O consórcio não tem juros — o custo é a taxa administrativa.</div>
                    </div>
                  </div>
                )}

                {/* COMPARATIVO CDB */}
                {sels.has('cdbcmp') && (
                  <div id="b-cdbcmp">
                    <div className="cdb-box" style={{ marginTop: '8px' }}>
                      <div className="cdb-title font-sans">Comparativo — CDB {((inputsCdb.rendimentoCdb || 1) * 12).toFixed(0)}% a.a.</div>
                      <div className="ig2">
                        <div className="ic" style={{ background: '#fff' }}>
                          <div className="l font-sans">Tempo para juntar {formatBRL(resultadosSorteio.creditoDaCarta)} via CDB</div>
                          <div className="v font-display" style={{ color: '#3B6D11' }}>{cdbAnos} anos e {cdbMeses} meses</div>
                        </div>
                        <div className="ic" style={{ background: '#fff' }}>
                          <div className="l font-sans">Aporte mensal usado no cálculo</div>
                          <div className="v font-display">{formatBRL(meiaParcelaSorteio)} / mês (parcela inicial)</div>
                        </div>
                      </div>
                      <div className="snote font-sans" style={{ marginTop: '8px', borderTop: '1px solid #b8dcb8' }}>Cálculo: tempo necessário para acumular o valor total do imóvel ({formatBRL(resultadosSorteio.creditoDaCarta)}) aplicando a parcela inicial do consórcio ({formatBRL(meiaParcelaSorteio)}/mês) em CDB a {((inputsCdb.rendimentoCdb || 1) * 12).toFixed(0)}% a.a., com aportes mensais regulares.</div>
                    </div>
                  </div>
                )}

                <div className="snote font-sans">Com a valorização patrimonial média e a correção anual do crédito, o consórcio entrega resultado que nenhum financiamento bancário alcança — sem juros e sem entrada pesada.</div>
              </div>
            )}

            <div className="disc">
              <p className="font-sans">"As informações contidas neste documento não representam uma promessa de contemplação. Os valores são estimativas baseadas nos parâmetros informados e nas condições de mercado vigentes na data de geração. Rentabilidade passada não garante resultados futuros. Consulte o corretor responsável para mais detalhes."</p>
            </div>
            
            <div className="footer">
              <div className="fb font-sans"><strong>MORAIS CAPITAL</strong> · Proposta Comercial</div>
              <div className="fc font-sans">{assessor.nome} · {phoneFormatted} · {dataProposta}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
