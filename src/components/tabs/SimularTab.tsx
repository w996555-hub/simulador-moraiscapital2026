import React, { useState, useEffect, useRef } from 'react';
import { 
  Loader2, RotateCcw, CheckCircle2, ChevronDown, 
  Wallet, Receipt, Calendar, Clock, PiggyBank, 
  TrendingUp, Banknote, Download, ArrowLeft, Check, 
  DollarSign, Percent, BarChart3, User, UserCheck, Target,
  FileText
} from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { formatBRL, formatPercent, formatInt } from '../../lib/format';
import { exportElementToPdf } from '../../lib/pdf';
import { calcular, calcularFinanciamento, calcularCDB } from '../../engine/engine';

// Componente compartilhado: CurrencyInput
interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
}

function CurrencyInput({ label, value, onChange, disabled }: CurrencyInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-[12px] font-semibold text-muted-foreground/90 block">{label}</label>
      <div className="relative">
        <NumericFormat
          value={value === 0 ? '' : value}
          onValueChange={(values) => {
            onChange(values.floatValue || 0);
          }}
          thousandSeparator="."
          decimalSeparator=","
          prefix="R$ "
          decimalScale={2}
          fixedDecimalScale
          disabled={disabled}
          className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-primary/10 focus:border-primary/50 disabled:opacity-50 disabled:bg-muted disabled:cursor-not-allowed text-foreground"
        />
      </div>
    </div>
  );
}

// Componente compartilhado: NumInput
interface NumInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  suffix?: string;
  isDecimal?: boolean;
}

function NumInput({ label, value, onChange, disabled, suffix, isDecimal }: NumInputProps) {
  const displayValue = isDecimal ? Number((value * 100).toFixed(4)) : value;
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = Number(e.target.value);
    if (isDecimal) val = val / 100;
    onChange(val);
  };
  
  return (
    <div className="space-y-1 relative">
      <label className="text-[12px] font-semibold text-muted-foreground/90 block">{label}</label>
      <div className="relative">
        <input
          type="number"
          step={isDecimal ? "0.01" : "1"}
          value={displayValue || ''}
          onChange={handleInputChange}
          disabled={disabled}
          className="w-full h-11 pl-3 pr-16 rounded-xl border border-input bg-background text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all disabled:opacity-50 disabled:bg-muted disabled:cursor-not-allowed text-foreground"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

// Componente compartilhado: SelectInput
interface SelectInputProps {
  label: string;
  value: string;
  onChange: (val: any) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

function SelectInput({ label, value, onChange, options, disabled }: SelectInputProps) {
  return (
    <div className="space-y-1 relative">
      <label className="text-[12px] font-semibold text-muted-foreground/90 block">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-full h-11 pl-3 pr-10 rounded-xl border border-input bg-background text-sm font-semibold appearance-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all disabled:opacity-50 disabled:bg-muted disabled:cursor-not-allowed text-foreground"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

// Componente compartilhado: FinanceCard
interface FinanceCardProps {
  label: string;
  value: string;
  Icon: any;
  isResult?: boolean;
}

function FinanceCard({ label, value, Icon, isResult = true }: FinanceCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center rounded-full shrink-0">
        <Icon size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground/80">{label}</span>
          <div className="h-[2px] w-3 bg-primary mt-0.5 mb-1.5" />
        </div>
        <div className={`font-display text-2xl font-extrabold leading-tight truncate ${isResult ? 'text-primary' : 'text-foreground'}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

// Componente compartilhado: MiniCard
interface MiniCardProps {
  label: string;
  value: string;
  Icon: any;
  isResult?: boolean;
}

function MiniCard({ label, value, Icon, isResult = true }: MiniCardProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-wider text-foreground/80">{label}</span>
          <div className="h-[2px] w-3 bg-primary mt-0.5 mb-1" />
        </div>
        <div className={`font-display text-2xl font-extrabold truncate ${isResult ? 'text-primary' : 'text-foreground'}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

// Componente: OptionButton
interface OptionButtonProps {
  label: string;
  onClick: () => void;
}

function OptionButton({ label, onClick }: OptionButtonProps) {
  return (
    <button 
      onClick={onClick} 
      className="h-11 rounded-xl border border-border bg-card flex items-center justify-center relative w-full px-4 text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_8px_20px_-10px_rgba(180,20,30,0.35)] group"
    >
      <CheckCircle2 size={16} className="absolute left-3 text-primary" />
      <span>{label}</span>
    </button>
  );
}

const renderSvgChart = (results: any, f: any, w = 800, h = 400, isScreen = false) => {
  if (!results) return null;
  const M = results.parcelaContemplacao;
  const credit = results.creditoDaCarta;
  
  // Calcular Y max e steps
  const rawStep = credit / 6;
  const niceSteps = [10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000, 2000000, 2500000, 5000000, 10000000];
  let step = niceSteps.find(s => s >= rawStep);
  if (!step) {
    const order = Math.pow(10, Math.floor(Math.log10(rawStep)));
    step = Math.ceil(rawStep / order) * order;
  }
  const maxY = step * 6;
  
  const yLabels = [];
  for (let i = 6; i >= 0; i--) {
    const val = i * step;
    if (val === 0) {
      yLabels.push("R$ 0");
    } else if (val >= 1000000) {
      yLabels.push(`R$ ${(val / 1000000).toFixed(1).replace('.', ',')} mi`);
    } else {
      yLabels.push(`R$ ${val / 1000} mil`);
    }
  }
  
  const xLabels = [
    0,
    Math.round(M * 0.25),
    Math.round(M * 0.5),
    Math.round(M * 0.75),
    M
  ];
  
  const startX = 100;
  const endX = 720;
  const startY = 40;
  const endY = 355;
  const plotWidth = endX - startX;
  const plotHeight = endY - startY;
  
  const getCoords = (mVal: number, cVal: number) => {
    const x = startX + (mVal / M) * plotWidth;
    const y = endY - (cVal / maxY) * plotHeight;
    return { x, y };
  };
  
  const points = [];
  const stepsCount = 20;
  for (let i = 0; i <= stepsCount; i++) {
    const mVal = (i / stepsCount) * M;
    const cVal = Math.pow(i / stepsCount, 1.15) * credit;
    points.push(getCoords(mVal, cVal));
  }
  
  const strokePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const filledPath = `${strokePath} L ${points[points.length - 1].x.toFixed(1)} ${endY} L ${startX} ${endY} Z`;
  const lastPt = points[points.length - 1];
  const gradId = isScreen ? "curveGradientScreen" : "curveGradientPdf";

  // Callout balloon dimensions (in SVG coords)
  const balloonW = 210;
  const balloonH = 62;
  const tailH = 14;
  const balloonX = Math.min(lastPt.x - balloonW - 4, endX - balloonW - 4);
  const balloonY = lastPt.y + tailH + 2;
  // Tail tip is at lastPt, pointing from bottom of balloon
  const tailTipX = lastPt.x;
  const tailTipY = lastPt.y + 2;
  const tailLeft = lastPt.x - 9;
  const tailRight = lastPt.x - 0;
  const tailBaseY = balloonY;

  // Format credit value for SVG text
  const creditFormatted = formatBRL(credit);

  return (
    <div className="relative w-full h-full overflow-visible">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E30613" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#E30613" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Grid Lines (Horizontal) */}
        {Array.from({ length: 7 }).map((_, idx) => {
          const y = startY + (idx / 6) * plotHeight;
          return (
            <line 
              key={idx}
              x1={startX}
              y1={y}
              x2={endX}
              y2={y}
              stroke="#f1f5f9"
              strokeWidth="1.5"
              strokeDasharray={idx === 6 ? "none" : "4 4"}
            />
          );
        })}
        
        {/* Y-Axis Labels */}
        {yLabels.map((lbl, idx) => {
          const y = startY + (idx / 6) * plotHeight;
          return (
            <text 
              key={idx}
              x={startX - 15}
              y={y + 4}
              textAnchor="end"
              fill="#94a3b8"
              fontSize="11"
              fontWeight="700"
              fontFamily="Inter, sans-serif"
            >
              {lbl}
            </text>
          );
        })}
        
        {/* X-Axis Labels */}
        {xLabels.map((lbl, idx) => {
          const x = startX + (idx / 4) * plotWidth;
          return (
            <text 
              key={idx}
              x={x}
              y={endY + 24}
              textAnchor="middle"
              fill="#64748b"
              fontSize="12"
              fontWeight="700"
              fontFamily="Inter, sans-serif"
            >
              {lbl}
            </text>
          );
        })}
        
        {/* X-Axis Label "Meses" */}
        <text 
          x={startX + plotWidth / 2}
          y={endY + 42}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
          fontWeight="800"
          fontFamily="Inter, sans-serif"
        >
          Meses
        </text>
        
        {/* Gradient Fill under curve */}
        <path d={filledPath} fill={`url(#${gradId})`} />
        
        {/* Curve stroke */}
        <path d={strokePath} fill="none" stroke="#E30613" strokeWidth="3.5" strokeLinecap="round" />
        
        {/* Markers (Circles along the line) */}
        {points.slice(0, -1).map((pt, idx) => (
          <circle 
            key={idx}
            cx={pt.x}
            cy={pt.y}
            r="3.5"
            fill="#E30613"
          />
        ))}

        {/* ── Callout Balloon (all SVG, renders in PDF) ─────────────────── */}
        {/* Tail triangle pointing up to final point */}
        <polygon
          points={`${tailTipX},${tailTipY} ${tailLeft},${tailBaseY} ${tailRight + 9},${tailBaseY}`}
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* Balloon background rect */}
        <rect
          x={balloonX}
          y={balloonY}
          width={balloonW}
          height={balloonH}
          rx="12"
          ry="12"
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth="1.5"
        />
        {/* Cover the tail connection seam */}
        <rect
          x={Math.min(tailLeft, tailRight) - 1}
          y={balloonY}
          width={Math.abs(tailRight - tailLeft) + 10 + 2}
          height={4}
          fill="#ffffff"
        />
        {/* Label text */}
        <text
          x={balloonX + 14}
          y={balloonY + 20}
          fill="#64748b"
          fontSize="9"
          fontWeight="700"
          fontFamily="Inter, sans-serif"
          letterSpacing="0.08em"
        >
          CRÉDITO NA CONTEMPLAÇÃO
        </text>
        {/* Value text */}
        <text
          x={balloonX + 14}
          y={balloonY + 47}
          fill="#111111"
          fontSize="20"
          fontWeight="800"
          fontFamily="Inter, sans-serif"
        >
          {creditFormatted}
        </text>
        {/* ── End Callout Balloon ────────────────────────────────────────── */}

        {/* Final Marker (Larger circle with white center, on top) */}
        <circle 
          cx={lastPt.x}
          cy={lastPt.y}
          r="5.5"
          fill="#ffffff"
          stroke="#E30613"
          strokeWidth="3.5"
        />
      </svg>
    </div>
  );
};

export default function SimularTab({ form, setForm, resultados, setResultados, loading, onSimulate, visibilidadeCampos = {}, inputsFin, inputsCdb }: any) {
  const [view, setView] = useState<string>('form');
  const [showResults, setShowResults] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSavingProposta, setIsSavingProposta] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [clienteNameInput, setClienteNameInput] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Perfil do assessor (carregado do localStorage)
  const [assessorProfile, setAssessorProfile] = React.useState<{
    photoUrl: string; phone: string; whatsapp: string; emailContato: string;
  }>({ photoUrl: '', phone: '', whatsapp: '', emailContato: '' });

  // Parâmetros de fallback para Financiamento e CDB
  const activeInputsFin = inputsFin || {
    prazoFin: 420,
    taxaJuros: 10.744,
    trMensal: 0.150,
    percentualEntrada: 20,
    seguroMIP: 0.0116,
    seguroDFI: 0.00827,
    taxaAdm: 25.00,
  };

  const activeInputsCdb = inputsCdb || {
    objetivo: 'VALOR TOTAL',
    corrigirParcela: 'NÃO CORRIGIR',
    rendimentoCdb: 1.0,
    valorizacaoImovel: 6.0,
  };

  const pdfResults = resultados;
  const cdbIsSorteio = form.tipoLance === 'SORTEIO' || form.tipoLance === 'SEM LANCE';
  const cdbValorImovelHoje = pdfResults ? pdfResults.creditoDaCarta : 0;
  const cdbAporteInicial = pdfResults ? pdfResults.parcelaInicial : 0;

  let pdfCustoTotalConsorcio = 0;
  let pdfCustoTotalFinanciamento = 0;
  let pdfEconomiaConsorcio = 0;
  let finResultados: any = {};
  let cdbResultados: any = {};

  if (pdfResults) {
    const sumOquePaga = pdfResults.tabela
      .filter((row: any) => row.parcela >= pdfResults.parcelaEntrada && row.parcela <= form.prazoGrupo)
      .reduce((sum: number, row: any) => sum + row.oquePaga, 0);

    const descontoVencidas = form.abateOuRatea === "DESCONTAR"
      ? (pdfResults.parcelaEntrada - 1) * (pdfResults.tabela[pdfResults.parcelaContemplacao - 1]?.parcelaBaseFuro ?? 0)
      : 0;

    pdfCustoTotalConsorcio = sumOquePaga + descontoVencidas + pdfResults.boletoLanceLivre;

    const creditoLiquidoRecebido = pdfResults.creditoDaCarta - pdfResults.boletoLanceLivre;
    finResultados = calcularFinanciamento(creditoLiquidoRecebido, activeInputsFin);
    pdfCustoTotalFinanciamento = finResultados.custoTotalFinanciamento || 0;
    pdfEconomiaConsorcio = pdfCustoTotalFinanciamento - pdfCustoTotalConsorcio;

    cdbResultados = calcularCDB(
      cdbValorImovelHoje,
      cdbAporteInicial,
      pdfCustoTotalConsorcio,
      form.correcaoCredito,
      (activeInputsFin.percentualEntrada || 20) / 100,
      pdfResults.percentualLanceTotal,
      cdbIsSorteio,
      activeInputsCdb
    );
  }

  React.useEffect(() => {
    const loadProfile = () => {
      try {
        const raw = localStorage.getItem('simulador_assessor_profile');
        if (raw) setAssessorProfile(JSON.parse(raw));
      } catch {}
    };
    loadProfile();
    // Reload whenever the tab becomes active
    window.addEventListener('focus', loadProfile);
    return () => window.removeEventListener('focus', loadProfile);
  }, []);

  const lock = !!resultados;
  const handleChange = (field: string, value: any) => setForm({ ...form, [field]: value });

  const isFieldVisible = (fieldId: string) => {
    return visibilidadeCampos[fieldId] !== false;
  };

  // Scroll suave após simulação
  useEffect(() => {
    if (resultados) {
      setShowResults(true);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [resultados]);

  const handleSimulateClick = () => {
    onSimulate();
  };

  const handleClearClick = () => {
    setShowResults(false);
    setResultados(null);
    setView('form');
  };

  const fmtMoney = (val: number) => formatBRL(val);
  const fmtPercent = (val: number) => formatPercent(val);
  const fmtPercent3 = (val: number) => new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(val);
  const fmtInt = (val: number) => formatInt(val);

  const getResultsForView = (currentView: string) => {
    if (!resultados) return null;
    const isSorteio = currentView.endsWith('-sorteio');
    return calcular({
      ...form,
      tipoLance: isSorteio ? 'SORTEIO' : (form.tipoLance === 'SORTEIO' ? 'FIDELIDADE' : form.tipoLance)
    });
  };

  const currentResults = getResultsForView(view);

  // Load custom template from localStorage if exists
  const [customTemplate, setCustomTemplate] = useState<any>(null);

  useEffect(() => {
    if (view && view !== 'form') {
      const key = `simulador_template_${view}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setCustomTemplate(JSON.parse(saved));
        } catch (e) {
          console.error("Erro ao carregar modelo customizado:", e);
          setCustomTemplate(null);
        }
      } else {
        setCustomTemplate(null);
      }
    }
  }, [view, isExporting]);

  const getCustomTemplatePages = () => {
    if (!customTemplate) return null;
    if (customTemplate.pages) return customTemplate.pages;
    if (customTemplate.image) {
      return [{
        id: 'legacy-page',
        image: customTemplate.image,
        aspectRatio: customTemplate.aspectRatio || 0.707,
        fields: customTemplate.fields || []
      }];
    }
    return null;
  };

  const resolveTemplateText = (text: string) => {
    if (!text) return '';
    return text.replace(/\{\{([^}]+)\}\}/g, (match, fieldId) => {
      const trimmed = fieldId.trim();
      return getFieldValue(trimmed) || match;
    });
  };

  const parseRichText = (text: string) => {
    if (!text) return '';
    const regex = /(\*\*[\s\S]*?\*\*|<b>[\s\S]*?<\/b>)/g;
    const parts = text.split(regex);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('<b>') && part.endsWith('</b>')) {
        return <strong key={index} className="font-bold">{part.slice(3, -4)}</strong>;
      }
      return part;
    });
  };

  const getFieldValue = (fieldId: string) => {
    if (!currentResults) return '';
    const group = view.split('-')[0];
    switch (fieldId) {
      case 'credito': return fmtMoney(form.credito);
      case 'valorInvestidoAteContemplacao': return fmtMoney(currentResults.desembolso);
      case 'mesContemplacao': return `${fmtInt(currentResults.parcelaContemplacao)}º mês`;
      case 'creditoProjetado': return fmtMoney(currentResults.creditoDaCarta);
      case 'prazo': return `${form.prazoGrupo} meses`;
      case 'parcelaInicial': return fmtMoney(currentResults.parcelaInicial);
      case 'parcelaPosContemplacao': return fmtMoney(currentResults.parcelaPosContemplacao);
      case 'correcaoCredito': return fmtPercent(form.correcaoCredito);
      case 'tipoSeguro': return form.tipoSeguro;
      case 'valorRevenda': return fmtMoney(currentResults.creditoDaCarta * (form.percentualRecompra || 0.20));
      case 'lucroLiquido': 
        return group === 'fin' 
          ? fmtMoney(currentResults.lucroLiquidoVenda) 
          : fmtMoney(currentResults.lucroLiquidoAplicacao);
      case 'retornoMes': return fmtPercent(currentResults.retornoAoMes);
      case 'retornoTotal': 
        return group === 'fin'
          ? fmtPercent(currentResults.retornoTotalPercent)
          : fmtPercent3(currentResults.retornoAplicacaoPercent);
      case 'valorCorrigido': return fmtMoney(currentResults.valorCorrigidoAplicacao);
      case 'custoTotal': return fmtMoney(currentResults.custoTotal);
      case 'nomeCliente': return form.nomeCliente || '';
      case 'dataSimulacao': return new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
      case 'nomeAssessor':
        const userStr = sessionStorage.getItem('usuario');
        const u = userStr ? JSON.parse(userStr) : null;
        return u?.nome || 'Assessor Morais';
      default: return '';
    }
  };

  const handleDownloadPdf = () => {
    setClienteNameInput(form.nomeCliente || '');
    setModalError(null);
    setShowNameModal(true);
  };

  const getActiveSimulationData = (currentView: string) => {
    const activeResults = getResultsForView(currentView);
    if (!activeResults) return null;

    const isSorteio = currentView.endsWith('-sorteio');
    const activeForm = {
      ...form,
      tipoLance: isSorteio ? 'SORTEIO' : (form.tipoLance === 'SORTEIO' ? 'FIDELIDADE' : form.tipoLance)
    };

    // Calculate Consórcio costs for this active view
    const sumOquePaga = activeResults.tabela
      ?.filter((row: any) => row.parcela >= activeResults.parcelaEntrada && row.parcela <= activeForm.prazoGrupo)
      ?.reduce((sum: number, row: any) => sum + row.oquePaga, 0) || 0;

    const descontoVencidas = activeForm.abateOuRatea === "DESCONTAR"
      ? (activeResults.parcelaEntrada - 1) * (activeResults.tabela[activeResults.parcelaContemplacao - 1]?.parcelaBaseFuro ?? 0)
      : 0;

    const activeCustoTotalConsorcio = sumOquePaga + descontoVencidas + (activeResults.boletoLanceLivre || 0);

    // Calculate Financiamento costs for this active view
    const creditoLiquidoRecebido = activeResults.creditoDaCarta - (activeResults.boletoLanceLivre || 0);
    const activeFinResultados = calcularFinanciamento(creditoLiquidoRecebido, activeInputsFin);

    // Calculate CDB costs for this active view
    const cdbIsSorteio = activeForm.tipoLance === 'SORTEIO' || activeForm.tipoLance === 'SEM LANCE';
    const activeCdbResultados = calcularCDB(
      activeResults.creditoDaCarta,
      activeResults.parcelaInicial,
      activeCustoTotalConsorcio,
      activeForm.correcaoCredito,
      (activeInputsFin.percentualEntrada || 20) / 100,
      activeResults.percentualLanceTotal,
      cdbIsSorteio,
      activeInputsCdb
    );

    return {
      form: activeForm,
      resultados: activeResults,
      inputsFin: activeInputsFin,
      finResultados: activeFinResultados,
      inputsCdb: activeInputsCdb,
      cdbResultados: activeCdbResultados,
      viewMode: currentView
    };
  };

  const handleConfirmPdf = async () => {
    if (!clienteNameInput.trim()) {
      setModalError("O nome do lead é obrigatório.");
      return;
    }
    setModalError(null);
    setIsSavingProposta(true);

    const activeData = getActiveSimulationData(view);
    if (!activeData) {
      setModalError("Nenhuma simulação ativa encontrada.");
      setIsSavingProposta(false);
      return;
    }

    try {
      const userStr = sessionStorage.getItem('usuario');
      const u = userStr ? JSON.parse(userStr) : null;

      const response = await fetch('https://n8n.srv939429.hstgr.cloud/webhook/salvar-proposta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dados: {
            ...activeData,
            assessor: {
              nome: u?.nome || 'Assessor Morais',
              email: u?.email || '',
              foto_perfil: u?.foto_base64 || u?.foto_url || ''
            },
            lead: clienteNameInput,
            data: new Date().toLocaleDateString('pt-BR')
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.id) {
          window.open(`https://simulacao.moraiscapital.com.br/proposta/${data.id}`, '_blank');
          setShowNameModal(false);
        } else {
          setModalError(data.erro || "Falha ao salvar proposta no servidor.");
        }
      } else {
        const data = await response.json().catch(() => ({}));
        setModalError(data.erro || "Erro de rede ao salvar proposta.");
      }
    } catch (err) {
      setModalError("Erro de rede ao salvar a proposta.");
    } finally {
      setIsSavingProposta(false);
    }
  };

  // ── ESTADO 1: FORMULÁRIO ───────────────────────────────────
  if (view === 'form') {
    return (
      <div className="space-y-8">
        
        {/* Card Único "Dados de Entrada" */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-card transition-all">
          <div className="mb-6">
            <h3 className="text-base font-semibold tracking-tight font-display text-foreground">Dados de Entrada</h3>
            <p className="text-muted-foreground text-[12px]">
              {!resultados 
                ? "Preencha os parâmetros e simule o cenário" 
                : "Simulação realizada — clique em Nova Simulação para editar"}
            </p>
          </div>

          {/* Grid de Inputs (6 colunas em xl, 4 em lg, 3 em md, 2 em mobile) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-5 gap-y-4">
            
            {isFieldVisible('credito') && (
              <CurrencyInput 
                label="Crédito" 
                value={form.credito} 
                onChange={val => handleChange('credito', val)} 
                disabled={lock} 
              />
            )}

            {isFieldVisible('taxaAdm') && (
              <NumInput 
                label="Taxa Adm" 
                value={form.taxaAdm} 
                onChange={val => handleChange('taxaAdm', val)} 
                isDecimal={true} 
                suffix="%" 
                disabled={lock} 
              />
            )}

            {isFieldVisible('fundoReserva') && (
              <NumInput 
                label="Fundo de Reserva" 
                value={form.fundoReserva} 
                onChange={val => handleChange('fundoReserva', val)} 
                isDecimal={true} 
                suffix="%" 
                disabled={lock} 
              />
            )}

            {isFieldVisible('prazoGrupo') && (
              <NumInput 
                label="Prazo do Grupo" 
                value={form.prazoGrupo} 
                onChange={val => handleChange('prazoGrupo', val)} 
                suffix="meses" 
                disabled={lock} 
              />
            )}

            {isFieldVisible('correcaoCredito') && (
              <NumInput 
                label="Correção do Crédito" 
                value={form.correcaoCredito} 
                onChange={val => handleChange('correcaoCredito', val)} 
                isDecimal={true} 
                suffix="%" 
                disabled={lock} 
              />
            )}

            {isFieldVisible('parcelasPagasAtéContemplar') && (
              <NumInput 
                label="Pagas até Contemplar" 
                value={form.parcelasPagasAtéContemplar} 
                onChange={val => handleChange('parcelasPagasAtéContemplar', val)} 
                disabled={lock} 
              />
            )}

            {isFieldVisible('meiaParcela') && (
              <SelectInput 
                label="Meia ou Integral" 
                value={form.meiaParcela} 
                onChange={val => handleChange('meiaParcela', val)} 
                options={[
                  { value: 'MEIA', label: 'Meia' },
                  { value: 'INTEGRAL', label: 'Integral' }
                ]} 
                disabled={lock} 
              />
            )}

            {isFieldVisible('tipoSeguro') && (
              <SelectInput 
                label="Seguro" 
                value={form.tipoSeguro} 
                onChange={val => handleChange('tipoSeguro', val)} 
                options={[
                  { value: 'IMÓVEL', label: 'Imóvel' },
                  { value: 'VEÍCULO', label: 'Veículo' },
                  { value: 'NENHUM', label: 'Nenhum' }
                ]} 
                disabled={lock} 
              />
            )}

            {isFieldVisible('tipoLance') && (
              <SelectInput 
                label="Tipo de Lance" 
                value={form.tipoLance} 
                onChange={val => handleChange('tipoLance', val)} 
                options={[
                  { value: 'FIDELIDADE', label: 'Fidelidade' },
                  { value: 'LANCE LIVRE', label: 'Lance Livre' },
                  { value: 'SORTEIO', label: 'Sorteio' }
                ]} 
                disabled={lock} 
              />
            )}

            {isFieldVisible('valorLanceLivre') && form.tipoLance === 'LANCE LIVRE' && (
              <CurrencyInput 
                label="Valor Lance Livre" 
                value={form.valorLanceLivre} 
                onChange={val => handleChange('valorLanceLivre', val)} 
                disabled={lock} 
              />
            )}

            {isFieldVisible('usaEmbutido') && (
              <SelectInput 
                label="Usa Embutido?" 
                value={form.usaEmbutido} 
                onChange={val => handleChange('usaEmbutido', val)} 
                options={[
                  { value: 'SIM', label: 'Sim' },
                  { value: 'NÃO', label: 'Não' }
                ]} 
                disabled={lock} 
              />
            )}

            {isFieldVisible('abatimentoLance') && (
              <SelectInput 
                label="Reduz Prazo ou Parcela?" 
                value={form.abatimentoLance} 
                onChange={val => handleChange('abatimentoLance', val)} 
                options={[
                  { value: 'REDUZIR PARCELA', label: 'Reduzir Parcela' },
                  { value: 'REDUZIR PRAZO', label: 'Reduzir Prazo' }
                ]} 
                disabled={lock} 
              />
            )}

            {isFieldVisible('parcelasRestantes') && (
              <NumInput 
                label="Parcelas Restantes" 
                value={form.parcelasRestantes} 
                onChange={val => handleChange('parcelasRestantes', val)} 
                suffix="meses" 
                disabled={lock} 
              />
            )}

            {isFieldVisible('vendeCarta') && (
              <SelectInput 
                label="Vende a Carta?" 
                value={form.vendeCarta} 
                onChange={val => handleChange('vendeCarta', val)} 
                options={[
                  { value: 'NÃO', label: 'Não' },
                  { value: 'SIM', label: 'Sim' }
                ]} 
                disabled={lock} 
              />
            )}

            {isFieldVisible('percentualRecompra') && form.vendeCarta === 'SIM' && (
              <NumInput 
                label="Recompra da Carta" 
                value={form.percentualRecompra} 
                onChange={val => handleChange('percentualRecompra', val)} 
                isDecimal={true}
                suffix="%" 
                disabled={lock} 
              />
            )}

            {isFieldVisible('txInvestimentoComparativo') && (
              <NumInput 
                label="Tx. Invest. Comparativo" 
                value={form.txInvestimentoComparativo} 
                onChange={val => handleChange('txInvestimentoComparativo', val)} 
                isDecimal={true}
                suffix="% a.m." 
                disabled={lock} 
              />
            )}

            {isFieldVisible('retornoAluguelMes') && (
              <NumInput 
                label="Retorno Aluguel" 
                value={form.retornoAluguelMes} 
                onChange={val => handleChange('retornoAluguelMes', val)} 
                isDecimal={true}
                suffix="% a.m." 
                disabled={lock} 
              />
            )}

            {isFieldVisible('correcaoImovelAno') && (
              <NumInput 
                label="Corr. Anual Imóvel" 
                value={form.correcaoImovelAno} 
                onChange={val => handleChange('correcaoImovelAno', val)} 
                isDecimal={true}
                suffix="% a.a." 
                disabled={lock} 
              />
            )}

          </div>

          {/* Botão de Ação */}
          <div className="mt-8 flex justify-center">
            {!lock ? (
              <button 
                onClick={handleSimulateClick} 
                disabled={loading} 
                className="btn-premium min-w-[220px] rounded-2xl py-3.5 text-[13px] font-semibold flex items-center justify-center relative overflow-hidden disabled:opacity-85"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-white" /> Calculando...
                  </span>
                ) : "Simular"}
                {loading && <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full animate-loading-bar" />}
              </button>
            ) : (
              <button 
                onClick={handleClearClick} 
                className="bg-card border border-border hover:border-primary/40 font-semibold px-8 py-3.5 rounded-2xl text-[13px] transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-sm text-foreground"
              >
                <RotateCcw size={16} />
                <span>Nova Simulação</span>
              </button>
            )}
          </div>
        </section>

        {/* Painel de Resultados */}
        {showResults && resultados && (
          <div ref={resultsRef} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Faixa de Lance Livre */}
            {form.tipoLance === 'LANCE LIVRE' && (
              <div className="rounded-xl bg-muted/30 px-5 py-3 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-muted-foreground font-display uppercase tracking-wider">
                <span>Lance Livre: <span className="text-foreground font-extrabold">{fmtPercent(resultados.boletoLanceLivre / (resultados.creditoDaCarta || 1))}</span></span>
                <span className="text-border">|</span>
                <span>Lance Total (R$): <span className="text-foreground font-extrabold">{fmtMoney(resultados.lanceEmReais)}</span></span>
                <span className="text-border">|</span>
                <span>Lance Total: <span className="text-foreground font-extrabold">{fmtPercent(resultados.percentualLanceTotal)}</span></span>
              </div>
            )}

            {/* Três Cards de Seleção */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Card 1: Alavancagem Patrimonial */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card card-hover flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black uppercase text-foreground mb-1 tracking-wide font-display">Alavancagem Patrimonial</h4>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6 font-display">Uso Próprio ou Locação</p>
                </div>
                <div className="space-y-2">
                  <OptionButton label="Sorteio" onClick={() => setView('pat-sorteio')} />
                  <OptionButton label="Fixo" onClick={() => setView('pat-lance')} />
                </div>
              </div>

              {/* Card 2: Alavancagem Financeira */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card card-hover flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black uppercase text-foreground mb-1 tracking-wide font-display">Alavancagem Financeira</h4>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6 font-display">Venda da Carta Contemplada</p>
                </div>
                <div className="space-y-2">
                  <OptionButton label="Sorteio" onClick={() => setView('fin-sorteio')} />
                  <OptionButton label="Fixo" onClick={() => setView('fin-lance')} />
                </div>
              </div>

              {/* Card 3: Alavancagem de Aplicação */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card card-hover flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black uppercase text-foreground mb-1 tracking-wide font-display">Alavancagem de Aplicação</h4>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6 font-display">Comparativo CDB vs Consórcio</p>
                </div>
                <div className="space-y-2">
                  <OptionButton label="Sorteio" onClick={() => setView('apl-sorteio')} />
                  <OptionButton label="Fixo" onClick={() => setView('apl-lance')} />
                </div>
              </div>

            </div>

          </div>
        )}
      </div>
    );
  }

  // ── ESTADO 2: DETALHES (REPORT VIEW) ───────────────────────
  const isSorteio = view.endsWith('-sorteio');
  const variant = isSorteio ? 'sorteio' : 'lance';
  const group = view.split('-')[0]; // 'pat', 'fin', 'apl'

  return (
    <div className="space-y-6">
      
      {/* 2.1 DetailNav (Barra branca do topo) */}
      <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 md:divide-x md:divide-border text-center md:text-left gap-4 md:gap-0">
          
          {/* Grupo Patrimonial */}
          <div className="px-4 space-y-2">
            <div className="font-display text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Alavancagem Patrimonial</div>
            <div className="flex gap-2 justify-center md:justify-start">
              <button 
                onClick={() => setView('pat-sorteio')} 
                className={`rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition-all ${view === 'pat-sorteio' ? 'bg-primary text-white shadow-[0_4px_12px_rgba(204,0,0,0.25)]' : 'bg-secondary text-foreground hover:bg-accent'}`}
              >
                Sorteio
              </button>
              <button 
                onClick={() => setView('pat-lance')} 
                className={`rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition-all ${view === 'pat-lance' ? 'bg-primary text-white shadow-[0_4px_12px_rgba(204,0,0,0.25)]' : 'bg-secondary text-foreground hover:bg-accent'}`}
              >
                Lance
              </button>
            </div>
          </div>

          {/* Grupo Financeira */}
          <div className="px-4 space-y-2">
            <div className="font-display text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Alavancagem Financeira</div>
            <div className="flex gap-2 justify-center md:justify-start">
              <button 
                onClick={() => setView('fin-sorteio')} 
                className={`rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition-all ${view === 'fin-sorteio' ? 'bg-primary text-white shadow-[0_4px_12px_rgba(204,0,0,0.25)]' : 'bg-secondary text-foreground hover:bg-accent'}`}
              >
                Sorteio
              </button>
              <button 
                onClick={() => setView('fin-lance')} 
                className={`rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition-all ${view === 'fin-lance' ? 'bg-primary text-white shadow-[0_4px_12px_rgba(204,0,0,0.25)]' : 'bg-secondary text-foreground hover:bg-accent'}`}
              >
                Lance
              </button>
            </div>
          </div>

          {/* Grupo Aplicação */}
          <div className="px-4 space-y-2">
            <div className="font-display text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Alavancagem de Aplicação</div>
            <div className="flex gap-2 justify-center md:justify-start">
              <button 
                onClick={() => setView('apl-sorteio')} 
                className={`rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition-all ${view === 'apl-sorteio' ? 'bg-primary text-white shadow-[0_4px_12px_rgba(204,0,0,0.25)]' : 'bg-secondary text-foreground hover:bg-accent'}`}
              >
                Sorteio
              </button>
              <button 
                onClick={() => setView('apl-lance')} 
                className={`rounded-lg px-3.5 py-1.5 text-[12px] font-semibold transition-all ${view === 'apl-lance' ? 'bg-primary text-white shadow-[0_4px_12px_rgba(204,0,0,0.25)]' : 'bg-secondary text-foreground hover:bg-accent'}`}
              >
                Lance
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 2.2 HeaderBar */}
      <div className="flex justify-between items-center bg-card border border-border p-4 rounded-2xl shadow-sm">
        <button 
          onClick={() => setView('form')} 
          className="flex items-center gap-2 font-medium text-muted-foreground hover:text-primary transition-colors text-sm"
        >
          <ArrowLeft size={18} /> Voltar
        </button>
        <button 
          onClick={handleDownloadPdf}
          disabled={isSavingProposta}
          className="bg-primary hover:bg-primary/95 text-white text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-full flex items-center gap-2 transition-all shadow-sm disabled:opacity-75"
        >
          {isSavingProposta ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />} 
          <span>{isSavingProposta ? "Gerando..." : "GERAR PROPOSTA"}</span>
        </button>
      </div>

      {/* Relatórios */}
      {currentResults && (
        <div 
          ref={pdfRef} 
          className={`bg-transparent space-y-3 ${isExporting ? 'pdf-export-mode' : ''}`}
        >
          
          					{/* CAPA DO PDF PADRÃO */}
          <div className={`pdf-page w-full bg-white relative overflow-hidden rounded-xl mb-12 select-none ${showPdfPreview ? 'border-2 border-dashed border-red-500/20' : 'pdf-only'}`} style={{ height: '1448px' }}>
            <div className="w-[50%] flex flex-col justify-between p-16 h-full z-10 text-left bg-transparent max-w-[45%]">
              <div>
                <img src="/png-nova-preta.png" alt="Morais Capital" className="h-10 w-auto object-contain" />
              </div>
              <div className="my-auto space-y-6 py-10">
                <div className="space-y-2">
                  <span className="font-display text-sm font-semibold tracking-[0.2em] text-[#5A5A5A] uppercase">Simulação de</span>
                  <h1 className="font-display text-[42px] font-extrabold text-[#E30613] leading-[1.1] uppercase tracking-tight whitespace-pre-line">
                    {group === 'fin' && "Alavancagem\nFinanceira"}
                    {group === 'apl' && "Alavancagem\nde Aplicação"}
                    {group === 'pat' && "Alavancagem\nPatrimonial"}
                  </h1>
                </div>
                <p className="text-sm text-[#5A5A5A] font-medium leading-relaxed">
                  {group === 'fin' && "Estratégia personalizada para alavancagem financeira."}
                  {group === 'apl' && "Estratégia personalizada para alavancagem de aplicação."}
                  {group === 'pat' && "Estratégia personalizada para alavancagem patrimonial."}
                </p>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1 text-[#E30613] shrink-0">
                    <User size={20} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#5A5A5A] font-bold tracking-wider uppercase block font-sans">Cliente</span>
                    <span className="text-sm font-bold text-[#111111] block font-sans">{form.nomeCliente}</span>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 text-[#E30613] shrink-0">
                    <Calendar size={20} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#5A5A5A] font-bold tracking-wider uppercase block font-sans">Data da Simulação</span>
                    <span className="text-sm font-bold text-[#111111] block font-sans">
                      {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="mt-1 text-[#E30613] shrink-0">
                    <UserCheck size={20} strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#5A5A5A] font-bold tracking-wider uppercase block font-sans">Consultor Responsável</span>
                    <span className="text-sm font-bold text-[#111111] block font-sans">
                      {(() => {
                        const userStr = sessionStorage.getItem('usuario');
                        const u = userStr ? JSON.parse(userStr) : null;
                        return u?.nome || 'Assessor Morais';
                      })()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-8 border-t border-border/40 w-full mt-auto">
                <div className="h-[2px] w-12 bg-[#E30613] mb-3" />
                <p className="text-[11px] italic font-medium text-[#5A5A5A] leading-relaxed">
                  Construindo patrimônio através de estratégias inteligentes.
                </p>
              </div>
            </div>
            <div 
              className="absolute inset-0 bg-[#F5F6F8] z-0" 
              style={{ clipPath: 'polygon(49% 0, 100% 0, 100% 100%, 35% 100%)' }}
            />
            <div 
              className="absolute right-0 top-0 h-full w-[62%] z-0" 
              style={{ clipPath: 'polygon(22.5% 0, 100% 0, 100% 100%, 0 100%)' }} 
            >
              <img src="/pdf-cover-house.png" alt="House Cover" className="w-full h-full object-cover shadow-2xl" />
            </div>
          </div>

          {/* PÁGINA DO GRÁFICO (Evolução Patrimonial) */}
          {group === 'pat' && (
            <div className={`pdf-page w-full bg-white relative overflow-hidden rounded-xl mb-12 select-none ${showPdfPreview ? 'border-2 border-dashed border-red-500/20' : 'pdf-only'}`} style={{ height: '1448px' }}>
              <div className="p-16 h-full flex flex-col justify-between text-left font-sans">
                {/* Top Header */}
                <div className="space-y-4">
                  <span className="text-sm font-bold tracking-wider text-[#E30613] font-display block">03</span>
                  <div className="space-y-1">
                    <h2 className="text-[28px] font-extrabold uppercase text-[#111111] leading-tight font-display tracking-tight">
                      Evolução Patrimonial
                    </h2>
                    <p className="text-sm text-[#5A5A5A] font-semibold">
                      Projeção do investimento até a contemplação.
                    </p>
                  </div>
                </div>
                
                {/* Chart Bounding Box */}
                <div className="my-auto relative border border-gray-100 bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                  {/* Legend */}
                  <div className="flex items-center gap-2 mb-6 ml-[68px]">
                    <div className="w-8 h-[3px] bg-[#E30613] rounded-full" />
                    <span className="text-xs font-bold text-[#1e293b]">Investimento acumulado</span>
                  </div>
                  
                  {/* SVG Chart */}
                  <div className="relative w-full h-[280px]">
                    {renderSvgChart(currentResults, form, 800, 400, false)}
                  </div>
                </div>
                
                {/* Alert block at bottom */}
                <div className="w-full py-4 px-6 rounded-2xl bg-red-50/55 border border-red-100/70 flex items-center gap-4 text-left">
                  <div className="shrink-0 text-[#E30613]">
                    <Target size={24} className="stroke-[1.75]" />
                  </div>
                  <p className="text-[13px] font-medium text-slate-700 leading-relaxed">
                    A contemplação foi simulada para o <strong className="text-[#111111] font-bold">{currentResults.parcelaContemplacao}º mês</strong>, com crédito projetado de <strong className="text-[#E30613] font-bold">{fmtMoney(currentResults.creditoDaCarta)}</strong>.
                  </p>
                </div>
                
                {/* Footer with separator line */}
                <div className="pt-6 border-t border-gray-100 w-full mt-auto flex justify-between items-center text-slate-400 font-semibold text-[10px] uppercase tracking-wider font-sans">
                  <span>Morais Capital</span>
                  <span className="text-slate-400 font-bold">Simulação de Alavancagem Patrimonial</span>
                </div>
              </div>
            </div>
          )}
          
          {/* PÁGINA DE RESULTADOS DO PDF */}
          <div className="pdf-page w-full bg-card border border-border p-6 md:p-8 rounded-2xl shadow-card space-y-4 flex flex-col justify-between" style={{ minHeight: isExporting ? '1448px' : 'auto' }}>
            {/* Header do PDF (Exclusivo para exportação) */}
            <div className="pdf-only flex-row items-center justify-between border-b-2 border-primary/20 pb-6 mb-6 w-full">
              <div className="flex items-center">
                <img src="/png-nova-preta.png" alt="Morais Capital" className="h-10 w-auto object-contain" />
              </div>
              <div className="text-right flex flex-col justify-center">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-primary">Relatório de Simulação</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</span>
                {(() => {
                  const userStr = sessionStorage.getItem('usuario');
                  const u = userStr ? JSON.parse(userStr) : null;
                  return u?.nome ? (
                    <span className="text-[10px] text-foreground font-semibold mt-0.5">Assessor: {u.nome}</span>
                  ) : null;
                })()}
              </div>
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                {group === 'pat' && "Alavancagem Patrimonial"}
                {group === 'fin' && "Alavancagem Financeira"}
                {group === 'apl' && "Alavancagem de Aplicação"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {variant === 'sorteio' ? "Simulação por Sorteio" : "Simulação por Lance"}
              </p>
            </div>

          {group === 'pat' && (
            <div className="space-y-3">
              {/* Bloco 1 - Topo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FinanceCard label="Crédito" value={fmtMoney(form.credito)} Icon={Wallet} isResult={false} />
                <FinanceCard 
                  label={form.meiaParcela === 'MEIA' ? 'Meia Parcela' : 'Parcela Integral'} 
                  value={fmtMoney(currentResults.parcelaInicial)} 
                  Icon={Receipt} 
                  isResult={false}
                />
              </div>

              {/* Bloco 2 - Card Composto */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.7fr] gap-6 border border-border rounded-2xl bg-card p-5 shadow-sm items-center">
                <div className="flex flex-col justify-center divide-y divide-border h-full pr-0 lg:pr-6 lg:border-r border-primary/60">
                  <MiniCard label="Simulando contemplação no mês" value={fmtInt(currentResults.parcelaContemplacao)} Icon={Calendar} isResult={true} />
                  <MiniCard label="Prazo" value={`${form.prazoGrupo} meses`} Icon={Clock} isResult={true} />
                  <MiniCard label="Valor investido até a contemplação" value={fmtMoney(currentResults.desembolso)} Icon={PiggyBank} isResult={true} />
                </div>

                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-lg md:text-xl font-extrabold text-primary uppercase mb-4">Crédito na Contemplação</span>
                  
                  <div 
                    className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center mb-4 shrink-0" 
                    style={{ clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)' }}
                  >
                    <Check size={24} className="stroke-[3]" />
                  </div>

                  <div className="font-display text-4xl md:text-6xl font-extrabold text-primary leading-none">
                    {fmtMoney(currentResults.creditoDaCarta)}
                  </div>

                  <div className="flex items-center gap-3 w-full justify-center mt-6">
                    <div className="h-px bg-primary/60 flex-1" />
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary tracking-wider uppercase font-display">
                      <span className="text-[8px] text-primary">●</span>
                      <span>{variant === 'sorteio' ? 'Sorteio' : 'Lance'}</span>
                    </div>
                    <div className="h-px bg-primary/60 flex-1" />
                  </div>

                  {variant === 'lance' && form.tipoLance === 'LANCE LIVRE' && (
                    <div className="mt-4">
                      <span className="text-sm font-bold uppercase tracking-wider text-primary block mb-1">Lance Livre Ofertado</span>
                      <span className="font-display text-2xl md:text-3xl font-extrabold text-primary leading-none">{fmtMoney(currentResults.boletoLanceLivre)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bloco 3 - Rodapé de Dados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FinanceCard label="Atualização % ao ano" value={fmtPercent(form.correcaoCredito)} Icon={TrendingUp} isResult={true} />
                <FinanceCard label="Pós contemplação" value={fmtMoney(currentResults.parcelaPosContemplacao)} Icon={Banknote} isResult={true} />
              </div>


            </div>
          )}

          {group === 'fin' && (
            <div className="space-y-3">
              {/* Bloco 1 - Topo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FinanceCard label="Crédito Contratado" value={fmtMoney(form.credito)} Icon={Wallet} isResult={false} />
                <FinanceCard label="Parcelas Pagas" value={`${fmtInt(currentResults.parcelaContemplacao)} / ${fmtInt(form.prazoGrupo)}`} Icon={Calendar} isResult={false} />
                <FinanceCard 
                  label={form.meiaParcela === 'MEIA' ? 'Meia Parcela' : 'Parcela Integral'} 
                  value={fmtMoney(currentResults.parcelaInicial)} 
                  Icon={Banknote} 
                  isResult={false}
                />
              </div>

              {/* Bloco 2 - Card Composto */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.7fr] gap-6 border border-border rounded-2xl bg-card p-5 shadow-sm items-center">
                <div className="flex flex-col justify-center divide-y divide-border h-full pr-0 lg:pr-6 lg:border-r border-primary/60">
                  <MiniCard label="Valor Investido" value={fmtMoney(currentResults.desembolso)} Icon={TrendingUp} isResult={true} />
                  <MiniCard label="Valor da Carta" value={fmtMoney(currentResults.creditoDaCarta)} Icon={PiggyBank} isResult={true} />
                </div>

                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-lg md:text-xl font-extrabold text-primary uppercase mb-4">Valor de Revenda</span>
                  
                  <div 
                    className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center mb-4 shrink-0" 
                    style={{ clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)' }}
                  >
                    <DollarSign size={24} className="stroke-[3]" />
                  </div>

                  <div className="font-display text-4xl md:text-6xl font-extrabold text-primary leading-none">
                    {fmtMoney(currentResults.creditoDaCarta * form.percentualRecompra)}
                  </div>

                  <div className="flex items-center gap-3 w-full justify-center mt-6">
                    <div className="h-px bg-primary/60 flex-1" />
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary tracking-wider uppercase font-display">
                      <Check size={12} className="text-primary stroke-[3]" />
                      <span>{variant === 'sorteio' ? 'Sorteio' : (form.tipoLance === 'FIDELIDADE' ? 'Lance Fixo' : 'Lance')}</span>
                    </div>
                    <div className="h-px bg-primary/60 flex-1" />
                  </div>

                  {variant === 'lance' && form.tipoLance === 'LANCE LIVRE' && (
                    <div className="mt-4">
                      <span className="text-sm font-bold uppercase tracking-wider text-primary block mb-1">Lance Livre Ofertado</span>
                      <span className="font-display text-2xl md:text-3xl font-extrabold text-primary leading-none">{fmtMoney(currentResults.boletoLanceLivre)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bloco 3 - Rodapé */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex-1 pb-3 sm:pb-0 sm:pr-4">
                    <MiniCard label="Retorno ao Mês" value={fmtPercent(currentResults.retornoAoMes)} Icon={TrendingUp} isResult={true} />
                  </div>
                  <div className="flex-1 pt-3 sm:pt-0 sm:pl-4">
                    <MiniCard label="Retorno Total" value={fmtPercent(currentResults.retornoTotalPercent)} Icon={Percent} isResult={true} />
                  </div>
                </div>
                
                <FinanceCard label="Lucro Líquido" value={fmtMoney(currentResults.lucroLiquidoVenda)} Icon={DollarSign} isResult={true} />
              </div>
            </div>
          )}

          {group === 'apl' && (
            <div className="space-y-3">
              {/* Bloco 1 - Topo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FinanceCard label="Crédito Contratado" value={fmtMoney(form.credito)} Icon={Wallet} isResult={false} />
                <FinanceCard label="Parcelas Pagas" value={`${fmtInt(currentResults.parcelaContemplacao)} / ${fmtInt(form.prazoGrupo)}`} Icon={Calendar} isResult={false} />
                <FinanceCard 
                  label={form.meiaParcela === 'MEIA' ? 'Meia Parcela' : 'Parcela Integral'} 
                  value={fmtMoney(currentResults.parcelaInicial)} 
                  Icon={Banknote} 
                  isResult={false}
                />
              </div>

              {/* Bloco 2 - Card Composto */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.7fr] gap-6 border border-border rounded-2xl bg-card p-5 shadow-sm items-center">
                <div className="flex flex-col justify-center divide-y divide-border h-full pr-0 lg:pr-6 lg:border-r border-primary/60">
                  <MiniCard label="Valor Investido" value={fmtMoney(currentResults.desembolso)} Icon={PiggyBank} isResult={true} />
                  <MiniCard label="Custo Total" value={fmtMoney(currentResults.custoTotal)} Icon={Banknote} isResult={true} />
                </div>

                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-lg md:text-xl font-extrabold text-primary uppercase mb-4">Valor Corrigido</span>
                  
                  <div 
                    className="h-12 w-12 bg-primary/10 text-primary flex items-center justify-center mb-4 shrink-0" 
                    style={{ clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)' }}
                  >
                    <Check size={28} className="stroke-[3]" />
                  </div>

                  <div className="font-display text-4xl md:text-6xl font-extrabold text-primary leading-none">
                    {fmtMoney(currentResults.valorCorrigidoAplicacao)}
                  </div>

                  <div className="flex items-center gap-3 w-full justify-center mt-6">
                    <div className="h-px bg-primary/60 flex-1" />
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary tracking-wider uppercase font-display">
                      <span className="text-[8px] text-primary">●</span>
                      <span>{variant === 'sorteio' ? 'Sorteio' : (form.tipoLance === 'FIDELIDADE' ? 'Lance Fixo' : 'Lance')}</span>
                    </div>
                    <div className="h-px bg-primary/60 flex-1" />
                  </div>
                </div>
              </div>

              {/* Bloco 3 - Rodapé */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 divide-y md:divide-y-0 md:divide-x divide-border rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="pb-3 md:pb-0 md:pr-4">
                  <MiniCard label="Lucro Líquido" value={fmtMoney(currentResults.lucroLiquidoAplicacao)} Icon={DollarSign} isResult={true} />
                </div>
                <div className="pt-3 md:pt-0 md:pl-4">
                  <MiniCard label="Retorno Total %" value={fmtPercent3(currentResults.retornoAplicacaoPercent)} Icon={BarChart3} isResult={true} />
                </div>
              </div>
            </div>
          )}



          {/* Parâmetros da Simulação (Exclusivo para o PDF) */}
          <div className="pdf-only flex-col mt-6 pt-6 border-t border-border/60 w-full">
            <h3 className="font-display text-[11px] font-bold uppercase tracking-wider text-primary mb-3">Parâmetros Utilizados na Simulação</h3>
            
            <div className="grid grid-cols-4 gap-y-3 gap-x-6 text-[10px] text-foreground font-semibold">
              {isFieldVisible('credito') && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Crédito Contratado</span>
                  <span className="mt-0.5">{fmtMoney(form.credito)}</span>
                </div>
              )}
              {isFieldVisible('prazoGrupo') && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Prazo do Grupo</span>
                  <span className="mt-0.5">{form.prazoGrupo} meses</span>
                </div>
              )}
              {isFieldVisible('taxaAdm') && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Taxa de Administração</span>
                  <span className="mt-0.5">{fmtPercent(form.taxaAdm)}</span>
                </div>
              )}
              {isFieldVisible('fundoReserva') && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Fundo de Reserva</span>
                  <span className="mt-0.5">{fmtPercent(form.fundoReserva)}</span>
                </div>
              )}
              {isFieldVisible('correcaoCredito') && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Correção do Crédito</span>
                  <span className="mt-0.5">{fmtPercent(form.correcaoCredito)} reajuste</span>
                </div>
              )}
              {isFieldVisible('tipoSeguro') && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Seguro Contratado</span>
                  <span className="mt-0.5">{form.tipoSeguro}</span>
                </div>
              )}
              {isFieldVisible('meiaParcela') && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Parcela Inicial</span>
                  <span className="mt-0.5">{form.meiaParcela === 'MEIA' ? 'Meia Parcela' : 'Parcela Integral'}</span>
                </div>
              )}
              {isFieldVisible('tipoLance') && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Tipo de Lance</span>
                  <span className="mt-0.5">{form.tipoLance}</span>
                </div>
              )}
              {isFieldVisible('valorLanceLivre') && form.tipoLance === 'LANCE LIVRE' && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Valor Lance Livre</span>
                  <span className="mt-0.5">{fmtMoney(form.valorLanceLivre)}</span>
                </div>
              )}
              {isFieldVisible('usaEmbutido') && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Usa Embutido</span>
                  <span className="mt-0.5">{form.usaEmbutido}</span>
                </div>
              )}
              {isFieldVisible('abatimentoLance') && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Reduz Prazo/Parcela</span>
                  <span className="mt-0.5">{form.abatimentoLance}</span>
                </div>
              )}
              {isFieldVisible('parcelasRestantes') && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Parcelas Restantes</span>
                  <span className="mt-0.5">{form.parcelasRestantes} meses</span>
                </div>
              )}
              {isFieldVisible('parcelasPagasAtéContemplar') && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Pagas até Contemplar</span>
                  <span className="mt-0.5">{form.parcelasPagasAtéContemplar} parcelas</span>
                </div>
              )}
              {isFieldVisible('vendeCarta') && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Vende a Carta</span>
                  <span className="mt-0.5">{form.vendeCarta}</span>
                </div>
              )}
              {isFieldVisible('percentualRecompra') && form.vendeCarta === 'SIM' && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Recompra da Carta</span>
                  <span className="mt-0.5">{fmtPercent(form.percentualRecompra)}</span>
                </div>
              )}
              {isFieldVisible('txInvestimentoComparativo') && group === 'apl' && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Tx. Invest. Comparativo</span>
                  <span className="mt-0.5">{fmtPercent(form.txInvestimentoComparativo)} a.m.</span>
                </div>
              )}
              {isFieldVisible('retornoAluguelMes') && group === 'apl' && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Retorno Aluguel</span>
                  <span className="mt-0.5">{fmtPercent(form.retornoAluguelMes)} a.m.</span>
                </div>
              )}
              {isFieldVisible('correcaoImovelAno') && group === 'apl' && (
                <div className="flex flex-col">
                  <span className="text-muted-foreground uppercase text-[8px] font-bold tracking-wider">Corr. Anual Imóvel</span>
                  <span className="mt-0.5">{fmtPercent(form.correcaoImovelAno)} a.a.</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-border/60 text-center">
            <p className="text-xs italic text-muted-foreground">
              "As informações contidas neste documento não representam uma promessa de contemplação."
            </p>
          </div>

          </div> {/* FIM DA PÁGINA DE RESULTADOS DO PDF */}

          {/* ── PÁGINA 4 DO PDF: Comparativo de Financiamento ─────────── */}
          <div className={`pdf-page w-full bg-white relative overflow-hidden p-16 select-none flex flex-col justify-between font-sans mb-12 ${showPdfPreview ? 'border-2 border-dashed border-red-500/20' : 'pdf-only'}`} style={{ height: '1448px' }}>
            {/* Cabeçalho */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 w-full">
              <img src="/png-nova-preta.png" alt="Morais Capital" className="h-10 w-auto object-contain" />
              <div className="text-right flex flex-col">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-primary">Comparativo de Financiamento</span>
                <span className="text-[9px] text-muted-foreground mt-0.5">Financiamento SAC vs Consórcio</span>
              </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="my-auto space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground font-display uppercase tracking-tight">Simulação Comparativa: Financiamento vs Consórcio</h3>
                <p className="text-xs text-muted-foreground">Projeção detalhada de custos considerando taxas do financiamento bancário configuradas contra o consórcio alavancado.</p>
              </div>

              {/* Tabela de Comparação */}
              <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.01)] bg-white">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-gray-100 bg-[#E30613] text-white">
                      <th className="p-4 text-[10px] font-bold uppercase tracking-wider font-display w-[40%]">Métrica</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-wider font-display text-right w-[30%]">Financiamento SAC</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-wider font-display text-right w-[30%] bg-[#B50B15]">Consórcio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[11px] font-sans text-slate-700">
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-4 font-semibold">Valor do Imóvel</td>
                      <td className="p-4 text-right font-semibold text-slate-900">{formatBRL(cdbValorImovelHoje)}</td>
                      <td className="p-4 text-right font-semibold text-slate-900 bg-red-50/10">{formatBRL(cdbValorImovelHoje)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-4 font-semibold">Entrada / Lance</td>
                      <td className="p-4 text-right font-semibold text-slate-900">{formatBRL(finResultados.entrada)}</td>
                      <td className="p-4 text-right font-semibold text-slate-900 bg-red-50/10">
                        {!cdbIsSorteio && currentResults.boletoLanceLivre > 0 ? formatBRL(currentResults.boletoLanceLivre) : 'R$ 0,00'}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-4 font-semibold">Prazo de Pagamento</td>
                      <td className="p-4 text-right font-semibold text-slate-900">{Math.floor(activeInputsFin.prazoFin / 12)} anos ({activeInputsFin.prazoFin}m)</td>
                      <td className="p-4 text-right font-semibold text-slate-900 bg-red-50/10">{Math.floor(form.prazoGrupo / 12)} anos ({form.prazoGrupo}m)</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-4 font-semibold">Parcela / Aporte Inicial</td>
                      <td className="p-4 text-right font-semibold text-slate-900">{formatBRL(finResultados.parcelaInicialFin)}</td>
                      <td className="p-4 text-right font-semibold text-slate-900 bg-red-50/10">{formatBRL(currentResults.parcelaInicial)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-4 font-semibold">Renda p/ Aprovação (30%)</td>
                      <td className="p-4 text-right font-semibold text-slate-900">{formatBRL(finResultados.rendaAprovacaoFin)}</td>
                      <td className="p-4 text-right font-semibold text-slate-900 bg-red-50/10">{formatBRL(currentResults.parcelaPosContemplacao / 0.3)}</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-4 font-semibold">Taxa de Juros / Correção</td>
                      <td className="p-4 text-right font-semibold text-slate-900">{activeInputsFin.taxaJuros.toFixed(3).replace('.', ',')}% a.a. + TR</td>
                      <td className="p-4 text-right font-semibold text-slate-900 bg-red-50/10">{formatPercent(form.correcaoCredito)} a.a. (Reajuste)</td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="p-4 font-semibold text-slate-500">Custo Financeiro (Juros/Taxas)</td>
                      <td className="p-4 text-right font-medium text-slate-500">{formatBRL(finResultados.custoFinanceiroFin)}</td>
                      <td className="p-4 text-right font-medium text-slate-500 bg-red-50/10">
                        {formatBRL(pdfCustoTotalConsorcio - currentResults.creditoDaCarta)}
                      </td>
                    </tr>
                    <tr className="bg-red-50/20 font-bold text-xs text-[#E30613]">
                      <td className="p-4 uppercase">Custo Total Pago</td>
                      <td className="p-4 text-right font-display text-sm text-[#E30613]">{formatBRL(pdfCustoTotalFinanciamento)}</td>
                      <td className="p-4 text-right font-display text-sm text-[#E30613] bg-red-50/30">{formatBRL(pdfCustoTotalConsorcio)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Barra de Economia com o Consórcio */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/40 px-6 py-5 flex items-center justify-between shadow-[0_4px_20px_rgba(16,185,129,0.04)]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-500/15 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                    <TrendingUp size={20} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 font-display block">Economia Estimada com o Consórcio</span>
                    <span className="text-xs text-slate-500 font-sans">Diferença direta no total investido nas duas modalidades</span>
                  </div>
                </div>
                <span className="font-display text-3xl font-extrabold text-emerald-600">
                  {formatBRL(pdfEconomiaConsorcio)}
                </span>
              </div>
            </div>

            {/* Rodapé */}
            <div className="pt-4 border-t border-gray-100 w-full flex justify-between items-center text-slate-400 font-semibold text-[9px] uppercase tracking-wider font-sans">
              <span>Morais Capital</span>
              <span>Simulação de Alavancagem</span>
            </div>
          </div>

          {/* ── PÁGINA 5 DO PDF: Comparativo de CDB ─────────────────────── */}
          <div className="pdf-only pdf-page w-full bg-white relative overflow-hidden p-16 select-none flex flex-col justify-between font-sans" style={{ height: '1448px' }}>
            {/* Cabeçalho */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 w-full">
              <img src="/png-nova-preta.png" alt="Morais Capital" className="h-10 w-auto object-contain" />
              <div className="text-right flex flex-col">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-primary">Comparativo de CDB</span>
                <span className="text-[9px] text-muted-foreground mt-0.5">CDB pós-fixado vs Consórcio</span>
              </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="my-auto space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground font-display uppercase tracking-tight">Simulação Comparativa: CDB vs Consórcio</h3>
                <p className="text-xs text-muted-foreground">Esta página analisa a estratégia de acumular capital em um CDB pós-fixado com aportes mensais para comprar o imóvel à vista no futuro, contra a aquisição via Consórcio hoje.</p>
              </div>

              {/* Tabela de Parâmetros CDB */}
              <div className="grid grid-cols-4 gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-5 text-[10px] text-slate-700 font-semibold shadow-[0_4px_10px_rgba(0,0,0,0.01)]">
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-sans">Objetivo de Acúmulo</span>
                  <span className="mt-1 text-slate-900 font-bold">{activeInputsCdb.objetivo === 'ENTRADA' ? 'Apenas Entrada' : 'Valor Total do Imóvel'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-sans">Rendimento do CDB</span>
                  <span className="mt-1 text-slate-900 font-bold">{activeInputsCdb.rendimentoCdb.toFixed(2).replace('.', ',')}% a.m.</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-sans">Valorização Imóvel</span>
                  <span className="mt-1 text-slate-900 font-bold">{activeInputsCdb.valorizacaoImovel.toFixed(2).replace('.', ',')}% a.a.</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider block font-sans">Correção de Aporte</span>
                  <span className="mt-1 text-slate-900 font-bold">{activeInputsCdb.corrigirParcela === 'CORRIGIR' ? 'Anual pelo Reajuste' : 'Sem Correção'}</span>
                </div>
              </div>

              {/* Cards de Comparação de Custo */}
              <div className="grid grid-cols-2 gap-6">
                
                {/* Poupar no CDB */}
                <div className="border border-gray-100 rounded-3xl p-6 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.01)] flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-sans">CDB (Poupar e Esperar)</span>
                    <div className="h-[2px] w-6 bg-slate-200 mt-1.5 mb-3" />
                    <h4 className="text-lg font-extrabold text-slate-950 font-display">Comprar no Futuro</h4>
                  </div>
                  
                  <div className="space-y-2.5 text-[11px] font-sans text-slate-700">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Tempo para atingir</span>
                      <span className="font-bold text-slate-950">{cdbResultados.tempoFormatado || `${cdbResultados.mesAtingido} meses`}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Valor do Imóvel no futuro</span>
                      <span className="font-bold text-slate-950">{formatBRL(cdbResultados.imovelCorrigido)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Aportes acumulados</span>
                      <span className="font-bold text-slate-950">{formatBRL(cdbResultados.totalAportado)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Aluguel pago no período</span>
                      <span className="font-bold text-slate-950">{formatBRL(cdbResultados.aluguelAcumulado)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Imposto de Renda (IR)</span>
                      <span className="font-bold text-slate-950">{formatBRL(cdbResultados.irPago)}</span>
                    </div>
                    <div className="flex justify-between pt-2 font-extrabold text-[#E30613] text-xs">
                      <span>Custo de Aquisição (Poupança + Aluguel)</span>
                      <span className="font-display text-sm text-[#E30613]">{formatBRL(cdbResultados.custoTotalCdb)}</span>
                    </div>
                  </div>
                </div>

                {/* Alavancar no Consórcio */}
                <div className="border border-red-100 rounded-3xl p-6 bg-red-50/10 shadow-[0_4px_20px_rgba(227,6,19,0.01)] flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[9px] font-bold text-primary uppercase tracking-wider block font-sans">Consórcio (Alavancagem)</span>
                    <div className="h-[2px] w-6 bg-primary/20 mt-1.5 mb-3" />
                    <h4 className="text-lg font-extrabold text-primary font-display">Comprar Hoje / Morar</h4>
                  </div>
                  
                  <div className="space-y-2.5 text-[11px] font-sans text-slate-700">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Tempo médio simulado</span>
                      <span className="font-bold text-slate-950">{currentResults.parcelaContemplacao}º mês</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Crédito liberado hoje</span>
                      <span className="font-bold text-slate-950">{formatBRL(cdbValorImovelHoje)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Parcela mensal inicial</span>
                      <span className="font-bold text-slate-950">{formatBRL(cdbAporteInicial)}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Prazo do grupo</span>
                      <span className="font-bold text-slate-950">{form.prazoGrupo} meses</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span>Correção do crédito</span>
                      <span className="font-bold text-slate-950">{formatPercent(form.correcaoCredito)} a.a.</span>
                    </div>
                    <div className="flex justify-between pt-2 font-extrabold text-[#E30613] text-xs">
                      <span>Custo Total do Consórcio</span>
                      <span className="font-display text-sm text-[#E30613]">{formatBRL(pdfCustoTotalConsorcio)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nota Informativa */}
              <p className="text-[9px] text-slate-400 leading-relaxed pl-2 font-sans border-l-2 border-slate-100">
                * No Consórcio, a contemplação permite adquirir o imóvel imediatamente (ou na média simulada), eliminando gastos com aluguel e protegendo o capital contra a inflação imobiliária. O CDB pressupõe que o capital é mantido aplicado sem liquidez imobiliária até o acúmulo total do saldo necessário.
              </p>
            </div>

            {/* Rodapé */}
            <div className="pt-4 border-t border-gray-100 w-full flex justify-between items-center text-slate-400 font-semibold text-[9px] uppercase tracking-wider font-sans">
              <span>Morais Capital</span>
              <span>Simulação de Alavancagem</span>
            </div>
          </div>

          {/* ── PÁGINA 6 DO PDF: Resumo Geral das 3 Colunas ─────────────── */}
          <div className="pdf-only pdf-page w-full bg-white relative overflow-hidden p-16 select-none flex flex-col justify-between font-sans" style={{ height: '1448px' }}>
            {/* Cabeçalho */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 w-full">
              <img src="/png-nova-preta.png" alt="Morais Capital" className="h-10 w-auto object-contain" />
              <div className="text-right flex flex-col">
                <span className="font-display text-xs font-bold uppercase tracking-wider text-primary">Resumo Comparativo Geral</span>
                <span className="text-[9px] text-muted-foreground mt-0.5">Visão unificada das três modalidades</span>
              </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="my-auto space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground font-display uppercase tracking-tight">Grade Comparativa</h3>
                <p className="text-xs text-muted-foreground">Resumo dos custos, prazos e exigências para as três opções simuladas no sistema.</p>
              </div>

              {/* Três Colunas */}
              <div className="grid grid-cols-3 gap-6 items-stretch">
                
                {/* Financiamento */}
                <div className="border border-gray-100 bg-white rounded-3xl p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                  <div>
                    <div className="border-b border-gray-100 pb-3 mb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">Financiamento SAC</span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1 font-display">Bancário Tradicional</h4>
                    </div>
                    
                    <div className="space-y-2.5 text-[9px] font-sans text-slate-600">
                      <span className="text-[8px] font-bold text-primary uppercase block">Perfil Operacional</span>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Valor Imóvel</span>
                        <span className="font-semibold text-slate-900">{formatBRL(cdbValorImovelHoje)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Prazo total</span>
                        <span className="font-semibold text-slate-900">{activeInputsFin.prazoFin} meses</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Parcela Inicial</span>
                        <span className="font-semibold text-slate-900">{formatBRL(finResultados.parcelaInicialFin)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Renda Mínima</span>
                        <span className="font-semibold text-slate-900">{formatBRL(finResultados.rendaAprovacaoFin)}</span>
                      </div>

                      <span className="text-[8px] font-bold text-primary uppercase block pt-2">Desembolsos</span>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Entrada Necessária</span>
                        <span className="font-semibold text-slate-900">{formatBRL(finResultados.entrada)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Juros/Taxas Totais</span>
                        <span className="font-semibold text-slate-900">{formatBRL(finResultados.custoFinanceiroFin)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Aluguel Pago</span>
                        <span className="font-semibold text-slate-400">—</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center mt-5">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Total Desembolsado</span>
                    <span className="text-base font-extrabold text-slate-800 font-display block mt-1">{formatBRL(pdfCustoTotalFinanciamento)}</span>
                  </div>
                </div>

                {/* Consórcio */}
                <div className="border border-red-200 bg-red-50/5 rounded-3xl p-5 flex flex-col justify-between shadow-[0_4px_25px_rgba(227,6,19,0.02)]">
                  <div>
                    <div className="border-b border-red-100 pb-3 mb-4">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block font-sans">Consórcio Morais</span>
                      <h4 className="text-base font-extrabold text-primary mt-1 font-display">Alavancagem Planejada</h4>
                    </div>
                    
                    <div className="space-y-2.5 text-[9px] font-sans text-slate-600">
                      <span className="text-[8px] font-bold text-primary uppercase block">Perfil Operacional</span>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Valor Imóvel</span>
                        <span className="font-semibold text-slate-900">{formatBRL(cdbValorImovelHoje)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Prazo total</span>
                        <span className="font-semibold text-slate-900">{form.prazoGrupo} meses</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Parcela Inicial</span>
                        <span className="font-semibold text-slate-900">{formatBRL(cdbAporteInicial)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Renda Mínima</span>
                        <span className="font-semibold text-slate-900">{formatBRL(currentResults.parcelaPosContemplacao / 0.3)}</span>
                      </div>

                      <span className="text-[8px] font-bold text-primary uppercase block pt-2">Desembolsos</span>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Lance / Entrada</span>
                        <span className="font-semibold text-slate-900">
                          {cdbIsSorteio ? 'R$ 0,00' : (currentResults.boletoLanceLivre > 0 ? formatBRL(currentResults.boletoLanceLivre) : '—')}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Custo Adm/Seguro</span>
                        <span className="font-semibold text-slate-900">{formatBRL(pdfCustoTotalConsorcio - currentResults.creditoDaCarta)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Aluguel Pago</span>
                        <span className="font-semibold text-slate-400">—</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-100 rounded-2xl p-3 text-center mt-5">
                    <span className="text-[8px] font-bold text-[#E30613] uppercase tracking-wider block font-display">Total Desembolsado</span>
                    <span className="text-base font-extrabold text-[#E30613] font-display block mt-1">{formatBRL(pdfCustoTotalConsorcio)}</span>
                  </div>
                </div>

                {/* CDB */}
                <div className="border border-gray-100 bg-white rounded-3xl p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                  <div>
                    <div className="border-b border-gray-100 pb-3 mb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">CDB Pós-Fixado</span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1 font-display">Acúmulo de Capital</h4>
                    </div>
                    
                    <div className="space-y-2.5 text-[9px] font-sans text-slate-600">
                      <span className="text-[8px] font-bold text-primary uppercase block">Perfil Operacional</span>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Valor Imóvel</span>
                        <span className="font-semibold text-slate-900">{formatBRL(cdbValorImovelHoje)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Prazo (Tempo)</span>
                        <span className="font-semibold text-slate-900">{cdbResultados.tempoFormatado || `${cdbResultados.mesAtingido}m`}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Aporte Inicial</span>
                        <span className="font-semibold text-slate-900">{formatBRL(cdbResultados.aporteInicial)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Renda Mínima</span>
                        <span className="font-semibold text-slate-400">—</span>
                      </div>

                      <span className="text-[8px] font-bold text-primary uppercase block pt-2">Desembolsos</span>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Aporte Entrada</span>
                        <span className="font-semibold text-slate-400">—</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>IR s/ Rendimentos</span>
                        <span className="font-semibold text-slate-900">{formatBRL(cdbResultados.irPago)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span>Aluguel Acumulado</span>
                        <span className="font-semibold text-slate-900">{formatBRL(cdbResultados.aluguelAcumulado)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center mt-5">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Total Desembolsado</span>
                    <span className="text-base font-extrabold text-slate-800 font-display block mt-1">{formatBRL(cdbResultados.custoTotalCdb)}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Rodapé */}
            <div className="pt-4 border-t border-gray-100 w-full flex justify-between items-center text-slate-400 font-semibold text-[9px] uppercase tracking-wider font-sans">
              <span>Morais Capital</span>
              <span>Simulação de Alavancagem</span>
            </div>
          </div>


          {/* ── PÁGINA FINAL: Citação + Cartão do Assessor ─────────────── */}
          {(() => {
            const userStr = sessionStorage.getItem('usuario');
            const u = userStr ? JSON.parse(userStr) : null;
            const assessorName = u?.nome || 'Assessor Morais';
            const assessorEmail = assessorProfile.emailContato || u?.email || '';
            const phone = assessorProfile.phone || '';
            const whatsapp = assessorProfile.whatsapp || '';
            const photo = assessorProfile.photoUrl;
            // WhatsApp QR: link to wa.me with cleaned number
            const waNumber = whatsapp.replace(/\D/g, '');
            const waLink = waNumber ? `https://wa.me/55${waNumber}` : 'https://wa.me/';
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(waLink)}`;
            return (
              <div className={`pdf-page w-full bg-white relative overflow-hidden rounded-xl mb-12 select-none ${showPdfPreview ? 'border-2 border-dashed border-red-500/20' : 'pdf-only'}`} style={{ height: '1448px' }}>
                {/* TOP: Mansion background with quote */}
                <div className="relative w-full" style={{ height: '55%' }}>
                  <img
                    src="/closing-bg.png"
                    alt="Morais Capital"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.6) 100%)' }} />
                  {/* Quote content */}
                  <div className="relative z-10 p-16 flex flex-col justify-start h-full">
                    {/* Opening quote mark */}
                    <div className="mb-4">
                      <svg width="48" height="38" viewBox="0 0 48 38" fill="none">
                        <rect width="20" height="7" rx="2" fill="#E30613" />
                        <rect y="10" width="20" height="26" rx="2" fill="#E30613" />
                        <rect x="28" width="20" height="7" rx="2" fill="#E30613" />
                        <rect x="28" y="10" width="20" height="26" rx="2" fill="#E30613" />
                      </svg>
                    </div>
                    <h2 className="text-[38px] font-extrabold text-white leading-[1.15] font-display mb-5" style={{ maxWidth: '70%' }}>
                      Grandes patrimônios não surgem por acaso.
                    </h2>
                    <p className="text-[17px] text-white/85 font-medium leading-relaxed font-sans" style={{ maxWidth: '55%' }}>
                      Eles são construídos através<br />de decisões estratégicas.
                    </p>
                    {/* Red line accent */}
                    <div className="mt-6 w-10 h-1 bg-[#E30613] rounded-full" />
                  </div>
                </div>

                {/* MIDDLE: Contact card */}
                <div className="absolute left-10 right-10 bg-white rounded-3xl shadow-2xl flex items-stretch" style={{ top: '52%', minHeight: '210px' }}>
                  {/* Photo + Info */}
                  <div className="flex items-center gap-6 flex-1 p-7">
                    {/* Circular photo */}
                    <div className="w-28 h-28 rounded-full border-4 border-gray-100 bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {photo
                        ? <img src={photo} alt={assessorName} className="w-full h-full object-cover" />
                        : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <User size={40} className="text-gray-400" />
                          </div>
                        )
                      }
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.18em] font-sans block mb-1">Consultor Responsável</span>
                      <span className="text-[22px] font-extrabold text-[#E30613] font-display block mb-3">{assessorName}</span>
                      <div className="space-y-1.5">
                        {phone && (
                          <div className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E30613" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3-8.59A2 2 0 0 1 3.1 1.5h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 16.92z" /></svg>
                            <span className="text-[13px] font-semibold text-gray-700 font-sans">{phone}</span>
                          </div>
                        )}
                        {whatsapp && (
                          <div className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#E30613"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.5 2C6.262 2 2 6.262 2 11.5c0 1.913.564 3.693 1.533 5.183L2 22l5.434-1.519C8.9 21.446 10.165 22 11.5 22 16.738 22 21 17.738 21 12.5S16.738 2 11.5 2zm0 17.9c-1.645 0-3.173-.491-4.451-1.332l-.319-.19-3.305.924.939-3.218-.208-.33A8.35 8.35 0 0 1 3.1 11.5C3.1 6.867 6.867 3.1 11.5 3.1S19.9 6.867 19.9 11.5 16.133 19.9 11.5 19.9z"/></svg>
                            <span className="text-[13px] font-semibold text-gray-700 font-sans">{whatsapp}</span>
                          </div>
                        )}
                        {assessorEmail && (
                          <div className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E30613" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            <span className="text-[13px] font-semibold text-gray-700 font-sans">{assessorEmail}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="w-px bg-gray-100 my-6" />

                  {/* QR Code */}
                  <div className="flex flex-col items-center justify-center p-7 gap-2" style={{ minWidth: '140px' }}>
                    <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-[0.18em] text-center font-sans">Fale Comigo<br />pelo WhatsApp</span>
                    {waNumber ? (
                      <img
                        src={qrUrl}
                        alt="QR WhatsApp"
                        className="w-[90px] h-[90px] object-contain"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-[90px] h-[90px] border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                        <span className="text-[9px] text-gray-300 text-center font-sans">Configure seu<br />WhatsApp no<br />Perfil</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTTOM: Red footer */}
                <div className="absolute bottom-0 left-0 right-0 bg-[#E30613] flex items-center justify-between px-12" style={{ height: '18%' }}>
                  <div className="flex items-center gap-3">
                    <img src="/logo-white.png" alt="Morais Capital" className="h-10 w-auto object-contain" />
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2 justify-end">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                      <span className="text-[12px] text-white font-semibold font-sans">www.moraiscapital.com.br</span>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                      <span className="text-[12px] text-white font-semibold font-sans">@moraiscapital</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      )}

      {/* Modal para Nome do Cliente */}
      {showNameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-elevated w-full max-w-md p-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-[3px] gradient-primary" />
            
            <h3 className="text-lg font-bold font-display text-foreground mb-1">Gerar Proposta</h3>
            <p className="text-xs text-muted-foreground mb-4 font-sans">Insira o nome do lead para gerar um link de simulação personalizado.</p>
            
            <input
              type="text"
              placeholder="Nome completo do lead (ex: João Silva)"
              value={clienteNameInput}
              onChange={e => {
                setClienteNameInput(e.target.value);
                if (e.target.value.trim() !== '') setModalError(null);
              }}
              className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm font-semibold outline-none transition-all focus:ring-4 focus:ring-primary/10 focus:border-primary/50 text-foreground mb-4 font-sans"
              autoFocus
              disabled={isSavingProposta}
              onKeyDown={e => {
                if (e.key === 'Enter') handleConfirmPdf();
              }}
            />
            
            {modalError && (
              <div className="text-xs text-red-600 font-semibold bg-red-50 py-2.5 px-3 rounded-lg border border-red-100 mb-4 animate-in fade-in duration-200 font-sans">
                {modalError}
              </div>
            )}
            
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setShowNameModal(false)}
                disabled={isSavingProposta}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors font-display disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPdf}
                disabled={isSavingProposta}
                className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider btn-premium rounded-xl flex items-center gap-1.5 font-display disabled:opacity-75"
              >
                {isSavingProposta ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
                <span>{isSavingProposta ? "Gerando..." : "Gerar Proposta"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}