import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trash2, UserPlus, Shield, Settings, Check, AlertCircle, Pencil, Upload, RotateCcw, Save, Plus, ChevronUp, ChevronDown, Paintbrush, Eraser, Undo2, MousePointer2, User } from 'lucide-react';

interface AdminTabProps {
  visibilidadeCampos: Record<string, boolean>;
  setVisibilidadeCampos: (val: Record<string, boolean>) => void;
}

interface TemplateField {
  id: string;
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: string;
  color: string;
  backgroundColor: string;
  align: string;
  isCustomText?: boolean;
  customText?: string;
}

interface DrawingStroke {
  points: { x: number; y: number }[];
  color: string;
  size: number;
  isEraser: boolean;
}

interface TemplatePage {
  id: string;
  image: string;
  aspectRatio: number;
  fields: TemplateField[];
}

// Paleta de cores predefinidas para o pincel
const COLOR_PALETTE = [
  // Marca
  { hex: '#E30613', label: 'Vermelho Morais' },
  { hex: '#B00010', label: 'Vermelho Escuro' },
  { hex: '#FF4D5A', label: 'Vermelho Claro' },
  // Neutros escuros
  { hex: '#111111', label: 'Preto' },
  { hex: '#1e293b', label: 'Slate 900' },
  { hex: '#334155', label: 'Slate 700' },
  { hex: '#475569', label: 'Cinza Médio' },
  { hex: '#64748b', label: 'Cinza Suave' },
  // Neutros claros
  { hex: '#94a3b8', label: 'Cinza Claro' },
  { hex: '#cbd5e1', label: 'Cinza Pálido' },
  { hex: '#f1f5f9', label: 'Quase Branco' },
  { hex: '#ffffff', label: 'Branco' },
  // Cores vivas
  { hex: '#2563eb', label: 'Azul' },
  { hex: '#0ea5e9', label: 'Azul Claro' },
  { hex: '#16a34a', label: 'Verde' },
  { hex: '#f59e0b', label: 'Âmbar' },
  { hex: '#7c3aed', label: 'Roxo' },
  { hex: '#db2777', label: 'Rosa' },
  { hex: '#0891b2', label: 'Ciano' },
  { hex: '#ea580c', label: 'Laranja' },
];

const DUMMY_VALUES: Record<string, string> = {
  credito: 'R$ 500.000,00',
  valorInvestidoAteContemplacao: 'R$ 150.000,00',
  mesContemplacao: '24º',
  creditoProjetado: 'R$ 580.000,00',
  prazo: '200 meses',
  parcelaInicial: 'R$ 2.500,00',
  parcelaPosContemplacao: 'R$ 3.800,00',
  correcaoCredito: '8,00%',
  tipoSeguro: 'Imóvel',
  nomeCliente: 'Guilherme Morais',
  dataSimulacao: new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
  nomeAssessor: 'Guilherme Morais',
  valorRevenda: 'R$ 100.000,00',
  lucroLiquido: 'R$ 80.000,00',
  retornoMes: '1,25%',
  retornoTotal: '45,20%',
  valorCorrigido: 'R$ 720.000,00',
  custoTotal: 'R$ 620.000,00',
};

const resolvePreviewText = (text: string) => {
  if (!text) return '';
  return text.replace(/\{\{([^}]+)\}\}/g, (match, fieldId) => {
    const trimmed = fieldId.trim();
    return DUMMY_VALUES[trimmed] || match;
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

const SCENARIOS = [
  { id: 'pat-sorteio', label: 'Alavancagem Patrimonial - Sorteio', group: 'pat' },
  { id: 'pat-lance', label: 'Alavancagem Patrimonial - Lance', group: 'pat' },
  { id: 'fin-sorteio', label: 'Alavancagem Financeira - Sorteio', group: 'fin' },
  { id: 'fin-lance', label: 'Alavancagem Financeira - Lance', group: 'fin' },
  { id: 'apl-sorteio', label: 'Alavancagem de Aplicação - Sorteio', group: 'apl' },
  { id: 'apl-lance', label: 'Alavancagem de Aplicação - Lance', group: 'apl' },
];

const FIELDS_BY_GROUP: Record<string, { id: string; label: string }[]> = {
  pat: [
    { id: 'credito', label: 'Crédito Contratado' },
    { id: 'valorInvestidoAteContemplacao', label: 'Investimento até Contemplação' },
    { id: 'mesContemplacao', label: 'Mês de Contemplação' },
    { id: 'creditoProjetado', label: 'Crédito Projetado' },
    { id: 'prazo', label: 'Prazo do Grupo' },
    { id: 'parcelaInicial', label: 'Parcela Inicial' },
    { id: 'parcelaPosContemplacao', label: 'Parcela Pós Contemplação' },
    { id: 'correcaoCredito', label: 'Correção Anual' },
    { id: 'tipoSeguro', label: 'Seguro Contratado' },
    { id: 'nomeCliente', label: 'Nome do Cliente' },
    { id: 'dataSimulacao', label: 'Data da Simulação' },
    { id: 'nomeAssessor', label: 'Assessor Responsável' },
    { id: 'graficoEvolucao', label: 'Gráfico de Evolução' },
  ],
  fin: [
    { id: 'credito', label: 'Crédito Contratado' },
    { id: 'valorInvestidoAteContemplacao', label: 'Investimento até Contemplação' },
    { id: 'mesContemplacao', label: 'Mês de Contemplação' },
    { id: 'creditoProjetado', label: 'Crédito na Contemplação' },
    { id: 'valorRevenda', label: 'Valor de Revenda' },
    { id: 'lucroLiquido', label: 'Lucro Líquido Estimado' },
    { id: 'retornoMes', label: 'Retorno ao Mês (TIR)' },
    { id: 'retornoTotal', label: 'Retorno Total %' },
    { id: 'prazo', label: 'Prazo do Grupo' },
    { id: 'parcelaInicial', label: 'Parcela Inicial' },
    { id: 'nomeCliente', label: 'Nome do Cliente' },
    { id: 'dataSimulacao', label: 'Data da Simulação' },
    { id: 'nomeAssessor', label: 'Assessor Responsável' },
    { id: 'graficoEvolucao', label: 'Gráfico de Evolução' },
  ],
  apl: [
    { id: 'credito', label: 'Crédito Contratado' },
    { id: 'valorInvestidoAteContemplacao', label: 'Investimento até Contemplação' },
    { id: 'mesContemplacao', label: 'Mês de Contemplação' },
    { id: 'valorCorrigido', label: 'Valor Corrigido Aplicação' },
    { id: 'custoTotal', label: 'Custo Total Consórcio' },
    { id: 'lucroLiquido', label: 'Lucro Líquido' },
    { id: 'retornoTotal', label: 'Retorno Total %' },
    { id: 'prazo', label: 'Prazo do Grupo' },
    { id: 'parcelaInicial', label: 'Parcela Inicial' },
    { id: 'nomeCliente', label: 'Nome do Cliente' },
    { id: 'dataSimulacao', label: 'Data da Simulação' },
    { id: 'nomeAssessor', label: 'Assessor Responsável' },
    { id: 'graficoEvolucao', label: 'Gráfico de Evolução' },
  ]
};

interface UserAccount {
  email: string;
  senha?: string;
  nome: string;
  role: 'admin' | 'assessor';
  phone?: string;
  whatsapp?: string;
  emailContato?: string;
  photoUrl?: string;
}

const GRUPOS_CAMPOS = [
  {
    titulo: 'Dados do Grupo',
    campos: [
      { id: 'credito', label: 'Crédito (R$)' },
      { id: 'taxaAdm', label: 'Taxa Adm (%)' },
      { id: 'fundoReserva', label: 'Fundo de Reserva (%)' },
      { id: 'prazoGrupo', label: 'Prazo do Grupo (meses)' },
      { id: 'correcaoCredito', label: 'Correção do Crédito (%)' },
    ]
  },
  {
    titulo: 'Entrada no Grupo',
    campos: [
      { id: 'parcelasRestantes', label: 'Parcelas Restantes' },
      { id: 'parcelasPagasAtéContemplar', label: 'Pagas até Contemplar' },
      { id: 'meiaParcela', label: 'Meia ou Integral' },
      { id: 'tipoSeguro', label: 'Seguro' },
    ]
  },
  {
    titulo: 'Lance',
    campos: [
      { id: 'tipoLance', label: 'Tipo de Lance' },
      { id: 'valorLanceLivre', label: 'Valor Lance Livre (condicional)' },
      { id: 'usaEmbutido', label: 'Usa Embutido?' },
      { id: 'abatimentoLance', label: 'Reduz Prazo ou Parcela?' },
    ]
  },
  {
    titulo: 'Parâmetros Comparativos',
    campos: [
      { id: 'percentualRecompra', label: 'Recompra da Carta (condicional)' },
      { id: 'txInvestimentoComparativo', label: 'Tx. Invest. Comparativo' },
      { id: 'retornoAluguelMes', label: 'Retorno Aluguel' },
      { id: 'correcaoImovelAno', label: 'Corr. Anual Imóvel' },
    ]
  }
];

const VALORES_PADRAO_FALLBACK: Record<string, any> = {
  credito: 500000,
  taxaAdm: 0.22,
  fundoReserva: 0.01,
  prazoGrupo: 200,
  correcaoCredito: 0.04,
  parcelasRestantes: 200,
  parcelasPagasAtéContemplar: 40,
  meiaParcela: 'MEIA',
  tipoSeguro: 'IMÓVEL',
  tipoLance: 'FIDELIDADE',
  valorLanceLivre: 0,
  usaEmbutido: 'SIM',
  abatimentoLance: 'REDUZIR PARCELA',
  percentualRecompra: 0.20,
  txInvestimentoComparativo: 0.0085,
  retornoAluguelMes: 0.005,
  correcaoImovelAno: 0.06,
};

const getSelectOptions = (id: string) => {
  if (id === 'meiaParcela') return [
    { value: 'MEIA', label: 'Meia' },
    { value: 'INTEGRAL', label: 'Integral' }
  ];
  if (id === 'tipoSeguro') return [
    { value: 'IMÓVEL', label: 'Imóvel' },
    { value: 'VEÍCULO', label: 'Veículo' },
    { value: 'NENHUM', label: 'Nenhum' }
  ];
  if (id === 'tipoLance') return [
    { value: 'FIDELIDADE', label: 'Fidelidade' },
    { value: 'LANCE LIVRE', label: 'Lance Livre' }
  ];
  if (id === 'usaEmbutido') return [
    { value: 'SIM', label: 'Sim' },
    { value: 'NÃO', label: 'Não' }
  ];
  if (id === 'abatimentoLance') return [
    { value: 'REDUZIR PARCELA', label: 'Reduzir Parcela' },
    { value: 'REDUZIR PRAZO', label: 'Reduzir Prazo' }
  ];
  return [];
};

const SHORT_KEYS: Record<string, string> = {
  credito: 'c',
  taxaAdm: 'ta',
  fundoReserva: 'fr',
  prazoGrupo: 'pg',
  correcaoCredito: 'cc',
  parcelasRestantes: 'pr',
  parcelasPagasAtéContemplar: 'pp',
  meiaParcela: 'mp',
  tipoSeguro: 'ts',
  tipoLance: 'tl',
  valorLanceLivre: 'vl',
  usaEmbutido: 'ue',
  abatimentoLance: 'al',
  percentualRecompra: 'prc',
  txInvestimentoComparativo: 'tic',
  retornoAluguelMes: 'ram',
  correcaoImovelAno: 'cia'
};

const LONG_KEYS: Record<string, string> = Object.fromEntries(
  Object.entries(SHORT_KEYS).map(([k, v]) => [v, k])
);

function compressConfig(visibilidade: Record<string, boolean>, valores: Record<string, any>) {
  const h: string[] = [];
  const v: Record<string, any> = {};

  Object.keys(SHORT_KEYS).forEach(longKey => {
    const shortKey = SHORT_KEYS[longKey];
    if (visibilidade[longKey] === false) {
      h.push(shortKey);
    }
    const val = valores[longKey];
    if (val !== undefined && val !== VALORES_PADRAO_FALLBACK[longKey]) {
      v[shortKey] = val;
    }
  });

  return JSON.stringify({ h, v });
}

function decompressConfig(compressedStr: string) {
  const visibilidade: Record<string, boolean> = {};
  const valores: Record<string, any> = {};

  Object.keys(SHORT_KEYS).forEach(longKey => {
    visibilidade[longKey] = true;
  });

  try {
    const parsed = JSON.parse(compressedStr);
    const h = parsed.h;
    const v = parsed.v;
    
    if (Array.isArray(h)) {
      h.forEach((shortKey: string) => {
        const longKey = LONG_KEYS[shortKey];
        if (longKey) {
          visibilidade[longKey] = false;
        }
      });
    }

    if (v && typeof v === 'object') {
      Object.keys(v).forEach(shortKey => {
        const longKey = LONG_KEYS[shortKey];
        if (longKey) {
          valores[longKey] = v[shortKey];
        }
      });
    }
  } catch (e) {
    console.error("Erro ao descomprimir configuracoes:", e);
  }

  return { visibilidade, valores };
}

export default function AdminTab({ visibilidadeCampos, setVisibilidadeCampos }: AdminTabProps) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  
  // Form para novos logins
  const [newNome, setNewNome] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSenha, setNewSenha] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'assessor'>('assessor');
  
  // Estados para edição de usuário
  const [editingEmail, setEditingEmail] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSenha, setEditSenha] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'assessor'>('assessor');

  // Feedback banners
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Subtabs state
  const [subtab, setSubtab] = useState<'acessos' | 'modelos'>('acessos');

  const [valoresCampos, setValoresCampos] = useState<Record<string, any>>({});


  // PDF Model Editor state
  const [selectedScenario, setSelectedScenario] = useState('pat-sorteio');
  const [pages, setPages] = useState<TemplatePage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [previewWithValues, setPreviewWithValues] = useState<boolean>(false);

  // Brush / drawing state
  const [brushMode, setBrushMode] = useState<boolean>(false);
  const [brushColor, setBrushColor] = useState<string>('#E30613');
  const [brushSize, setBrushSize] = useState<number>(4);
  const [brushEraser, setBrushEraser] = useState<boolean>(false);
  // drawingStrokes indexed by page id
  const [drawingStrokes, setDrawingStrokes] = useState<Record<string, DrawingStroke[]>>({});
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Load custom template from localStorage
  useEffect(() => {
    if (subtab === 'modelos') {
      const key = `simulador_template_${selectedScenario}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.image) {
            // Migrar esquema antigo para o novo esquema com array de páginas
            const migratedPage: TemplatePage = {
              id: 'page-' + Date.now(),
              image: parsed.image,
              aspectRatio: parsed.aspectRatio || 0.707,
              fields: parsed.fields || []
            };
            setPages([migratedPage]);
            setActivePageIndex(0);
            setSelectedFieldId(migratedPage.fields?.[0]?.id || null);
          } else if (parsed.pages) {
            setPages(parsed.pages);
            setActivePageIndex(0);
            setSelectedFieldId(parsed.pages[0]?.fields?.[0]?.id || null);
          } else {
            setPages([]);
            setActivePageIndex(0);
            setSelectedFieldId(null);
          }
        } catch (e) {
          console.error("Erro ao carregar modelo:", e);
          setPages([]);
          setActivePageIndex(0);
          setSelectedFieldId(null);
        }
      } else {
        setPages([]);
        setActivePageIndex(0);
        setSelectedFieldId(null);
      }
    }
  }, [selectedScenario, subtab]);

  const updateActivePage = (updater: (page: TemplatePage) => TemplatePage) => {
    setPages(pages.map((p, idx) => idx === activePageIndex ? updater(p) : p));
  };

  // ── Brush drawing handlers ──────────────────────────────────────────────
  const getRelativePos = useCallback((e: React.MouseEvent | MouseEvent) => {
    const container = previewContainerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handleBrushMouseDown = useCallback((e: React.MouseEvent) => {
    if (!brushMode) return;
    e.preventDefault();
    e.stopPropagation();
    isDrawingRef.current = true;
    const pos = getRelativePos(e);
    currentStrokeRef.current = [pos];
  }, [brushMode, getRelativePos]);

  const handleBrushMouseMove = useCallback((e: React.MouseEvent) => {
    if (!brushMode || !isDrawingRef.current) return;
    e.preventDefault();
    const pos = getRelativePos(e);
    currentStrokeRef.current = [...currentStrokeRef.current, pos];
    // Force a re-render by updating a tiny state so live stroke shows
    setDrawingStrokes(prev => ({ ...prev }));
  }, [brushMode, getRelativePos]);

  const handleBrushMouseUp = useCallback((e: React.MouseEvent) => {
    if (!brushMode || !isDrawingRef.current) return;
    isDrawingRef.current = false;
    const points = currentStrokeRef.current;
    currentStrokeRef.current = [];
    if (points.length < 1) return;
    const activePage = pages[activePageIndex];
    if (!activePage) return;
    const newStroke: DrawingStroke = {
      points,
      color: brushColor,
      size: brushSize,
      isEraser: brushEraser,
    };
    setDrawingStrokes(prev => ({
      ...prev,
      [activePage.id]: [...(prev[activePage.id] || []), newStroke],
    }));
  }, [brushMode, pages, activePageIndex, brushColor, brushSize, brushEraser]);

  const handleUndoStroke = () => {
    const activePage = pages[activePageIndex];
    if (!activePage) return;
    setDrawingStrokes(prev => {
      const strokes = [...(prev[activePage.id] || [])];
      strokes.pop();
      return { ...prev, [activePage.id]: strokes };
    });
  };

  const handleClearDrawing = () => {
    const activePage = pages[activePageIndex];
    if (!activePage) return;
    setDrawingStrokes(prev => ({ ...prev, [activePage.id]: [] }));
  };

  // Convert drawing strokes to SVG path string
  const strokeToPath = (pts: { x: number; y: number }[], containerW: number, containerH: number) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) {
      const px = (pts[0].x / 100) * containerW;
      const py = (pts[0].y / 100) * containerH;
      return `M ${px} ${py} L ${px + 0.01} ${py}`;
    }
    return pts.map((p, i) => {
      const px = (p.x / 100) * containerW;
      const py = (p.y / 100) * containerH;
      return `${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`;
    }).join(' ');
  };

  // Merge drawings into base images before saving
  // Receives pages and strokes explicitly to avoid React stale closure issues
  const mergeDrawingsIntoImages = async (
    pagesToMerge: TemplatePage[],
    strokesMap: Record<string, DrawingStroke[]>
  ): Promise<TemplatePage[]> => {
    const merged: TemplatePage[] = [];
    // Capture preview container width for correct scaling
    const containerW = previewContainerRef.current?.offsetWidth || 600;

    for (const page of pagesToMerge) {
      const strokes = strokesMap[page.id];
      if (!strokes || strokes.length === 0) {
        merged.push(page);
        continue;
      }
      // Load the base image onto a canvas and draw strokes
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);

          // Scale factor: preview container px -> image px
          const scale = img.width / containerW;

          for (const stroke of strokes) {
            if (stroke.points.length === 0) continue;
            ctx.save();
            ctx.globalCompositeOperation = stroke.isEraser ? 'destination-out' : 'source-over';
            ctx.strokeStyle = stroke.color;
            // stroke.size is in preview-px; scale up to image-px
            ctx.lineWidth = Math.max(1, stroke.size * scale);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            stroke.points.forEach((pt, i) => {
              // pts are stored as % of container -> convert to image pixels
              const px = (pt.x / 100) * img.width;
              const py = (pt.y / 100) * img.height;
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            });
            ctx.stroke();
            ctx.restore();
          }
          const newImage = canvas.toDataURL('image/jpeg', 0.92);
          merged.push({ ...page, image: newImage });
          resolve();
        };
        img.onerror = () => {
          // If image fails to load, push page unchanged
          merged.push(page);
          resolve();
        };
        img.src = page.image;
      });
    }
    return merged;
  };

  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFieldId(fieldId);

    const activePage = pages[activePageIndex];
    if (!activePage) return;
    const field = activePage.fields.find(f => f.id === fieldId);
    if (!field) return;

    const container = e.currentTarget.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = field.left;
    const startTop = field.top;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Converter pixel delta para porcentagem
      const deltaLeftPercent = (deltaX / containerRect.width) * 100;
      const deltaTopPercent = (deltaY / containerRect.height) * 100;

      let newLeft = Math.max(0, Math.min(100 - field.width, startLeft + deltaLeftPercent));
      let newTop = Math.max(0, Math.min(100 - field.height, startTop + deltaTopPercent));

      // Arredondar para 2 casas decimais
      newLeft = Math.round(newLeft * 100) / 100;
      newTop = Math.round(newTop * 100) / 100;

      updateActivePage(page => ({
        ...page,
        fields: page.fields.map(f => f.id === fieldId ? { ...f, left: newLeft, top: newTop } : f)
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const activePage = pages[activePageIndex];
    if (!activePage) return;
    const field = activePage.fields.find(f => f.id === fieldId);
    if (!field) return;

    const fieldDiv = e.currentTarget.parentElement;
    if (!fieldDiv) return;
    const container = fieldDiv.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = field.width;
    const startHeight = field.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Converter delta de pixels para porcentagem
      const deltaWidthPercent = (deltaX / containerRect.width) * 100;
      const deltaHeightPercent = (deltaY / containerRect.height) * 100;

      let newWidth = Math.max(1, Math.min(100 - field.left, startWidth + deltaWidthPercent));
      let newHeight = Math.max(1, Math.min(100 - field.top, startHeight + deltaHeightPercent));

      // Arredondar para 2 casas decimais
      newWidth = Math.round(newWidth * 100) / 100;
      newHeight = Math.round(newHeight * 100) / 100;

      updateActivePage(page => ({
        ...page,
        fields: page.fields.map(f => f.id === fieldId ? { ...f, width: newWidth, height: newHeight } : f)
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgElement = new Image();
      imgElement.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = imgElement.width;
        let height = imgElement.height;
        
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(imgElement, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
          
          const newPage: TemplatePage = {
            id: 'page-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            image: compressedBase64,
            aspectRatio: width / height,
            fields: []
          };
          
          const nextPages = [...pages, newPage];
          setPages(nextPages);
          setActivePageIndex(nextPages.length - 1);
          setSelectedFieldId(null);
        }
      };
      imgElement.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeletePage = (index: number) => {
    if (window.confirm("Deseja realmente excluir esta página do modelo?")) {
      const nextPages = pages.filter((_, idx) => idx !== index);
      setPages(nextPages);
      if (activePageIndex >= nextPages.length) {
        setActivePageIndex(Math.max(0, nextPages.length - 1));
      }
      setSelectedFieldId(null);
    }
  };

  const handleMovePageUp = (index: number) => {
    if (index === 0) return;
    const nextPages = [...pages];
    const temp = nextPages[index];
    nextPages[index] = nextPages[index - 1];
    nextPages[index - 1] = temp;
    setPages(nextPages);
    if (activePageIndex === index) {
      setActivePageIndex(index - 1);
    } else if (activePageIndex === index - 1) {
      setActivePageIndex(index);
    }
  };

  const handleMovePageDown = (index: number) => {
    if (index === pages.length - 1) return;
    const nextPages = [...pages];
    const temp = nextPages[index];
    nextPages[index] = nextPages[index + 1];
    nextPages[index + 1] = temp;
    setPages(nextPages);
    if (activePageIndex === index) {
      setActivePageIndex(index + 1);
    } else if (activePageIndex === index + 1) {
      setActivePageIndex(index);
    }
  };

  const handleAddCustomTextField = () => {
    const activePage = pages[activePageIndex];
    if (!activePage) return;

    const newFieldId = `custom-text-${Date.now()}`;
    const newField: TemplateField = {
      id: newFieldId,
      label: 'Texto Customizado',
      left: 20,
      top: 20,
      width: 40,
      height: 6,
      fontSize: 18,
      fontWeight: 'normal',
      color: '#111111',
      backgroundColor: 'transparent',
      align: 'left',
      isCustomText: true,
      customText: 'Texto com variável: {{nomeCliente}}'
    };

    updateActivePage(page => ({ ...page, fields: [...page.fields, newField] }));
    setSelectedFieldId(newFieldId);
  };

  const handleDeleteCustomTextField = (fieldId: string) => {
    const activePage = pages[activePageIndex];
    if (!activePage) return;

    if (window.confirm("Deseja realmente excluir este campo de texto?")) {
      const nextFields = activePage.fields.filter(f => f.id !== fieldId);
      updateActivePage(page => ({ ...page, fields: nextFields }));
      setSelectedFieldId(null);
    }
  };

  const handleToggleFieldInTemplate = (fieldId: string, label: string) => {
    const activePage = pages[activePageIndex];
    if (!activePage) return;

    const exists = activePage.fields.find(f => f.id === fieldId);
    if (exists) {
      const nextFields = activePage.fields.filter(f => f.id !== fieldId);
      updateActivePage(page => ({ ...page, fields: nextFields }));
      if (selectedFieldId === fieldId) {
        setSelectedFieldId(nextFields[0]?.id || null);
      }
    } else {
      const isGrafico = fieldId === 'graficoEvolucao';
      const newField: TemplateField = {
        id: fieldId,
        label,
        left: isGrafico ? 10 : 20,
        top: isGrafico ? 30 : 20,
        width: isGrafico ? 80 : 20,
        height: isGrafico ? 35 : 5,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#E30613',
        backgroundColor: 'transparent',
        align: 'left'
      };
      updateActivePage(page => ({ ...page, fields: [...page.fields, newField] }));
      setSelectedFieldId(fieldId);
    }
  };

  const handleUpdateFieldProp = (prop: keyof TemplateField, val: any) => {
    if (!selectedFieldId) return;
    updateActivePage(page => ({
      ...page,
      fields: page.fields.map(f => f.id === selectedFieldId ? { ...f, [prop]: val } : f)
    }));
  };

  const handleSaveTemplate = async () => {
    const key = `simulador_template_${selectedScenario}`;
    if (pages.length === 0) {
      localStorage.removeItem(key);
      setSuccessMsg('Modelo removido com sucesso!');
    } else {
      // Capture current state explicitly before async work
      const currentPages = pages;
      const currentStrokes = drawingStrokes;

      // Check if there are any drawings to merge
      const hasDrawings = currentPages.some(p => (currentStrokes[p.id] || []).length > 0);

      let finalPages = currentPages;
      if (hasDrawings) {
        finalPages = await mergeDrawingsIntoImages(currentPages, currentStrokes);
        // Drawings are now baked into images — clear them
        setDrawingStrokes({});
        setPages(finalPages);
      }

      const dataToSave = { pages: finalPages };
      localStorage.setItem(key, JSON.stringify(dataToSave));
      setSuccessMsg(hasDrawings
        ? 'Modelo salvo! Desenhos incorporados à imagem.'
        : 'Modelo de PDF salvo com sucesso!');
    }
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleClearTemplate = () => {
    if (window.confirm("Deseja realmente limpar este modelo? O PDF voltará ao design padrão.")) {
      setPages([]);
      setActivePageIndex(0);
      setSelectedFieldId(null);
      const key = `simulador_template_${selectedScenario}`;
      localStorage.removeItem(key);
      setSuccessMsg('Modelo limpo com sucesso!');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const fetchLogins = async () => {
    try {
      const response = await fetch('https://n8n.srv939429.hstgr.cloud/webhook/listar-usuarios');
      if (response.ok) {
        const data = await response.json();
        const usersList = Array.isArray(data) ? data : (data.users || []);
        setUsers(usersList);

        // Encontrar o usuario config@morais.com e carregar as configuracoes dele
        const configUser = usersList.find((u: any) => u.email === 'config@morais.com');
        if (configUser && configUser.nome) {
          const { visibilidade, valores } = decompressConfig(configUser.nome);
          setValoresCampos(prev => ({ ...prev, ...valores }));
          setVisibilidadeCampos(visibilidade);
          localStorage.setItem('simulador_valores_padrao_admin', JSON.stringify(valores));
          localStorage.setItem('simulador_campos_dados_entrada', JSON.stringify(visibilidade));
        }
      }
    } catch (err) {
      console.error("Erro ao carregar logins:", err);
    }
  };

  const saveConfigToBackend = async (nextVis: Record<string, boolean>, nextValores: Record<string, any>) => {
    try {
      const compressed = compressConfig(nextVis, nextValores);
      
      const res = await fetch('https://n8n.srv939429.hstgr.cloud/webhook/listar-usuarios');
      if (res.ok) {
        const data = await res.json();
        const usersList = Array.isArray(data) ? data : (data.users || []);
        const configUser = usersList.find((u: any) => u.email === 'config@morais.com');
        
        if (!configUser) {
          await fetch('https://n8n.srv939429.hstgr.cloud/webhook/criar-usuario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nome: compressed,
              email: 'config@morais.com',
              senha: 'config-password-123',
              role: 'assessor'
            })
          });
        } else {
          await fetch('https://n8n.srv939429.hstgr.cloud/webhook/editar-usuario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              originalEmail: 'config@morais.com',
              nome: compressed,
              email: 'config@morais.com',
              senha: '',
              role: 'assessor'
            })
          });
        }
      }
    } catch (err) {
      console.error("Erro ao sincronizar configuracoes com o servidor:", err);
    }
  };


  useEffect(() => {
    // Carregar logins da API
    fetchLogins();

    const storedValores = localStorage.getItem('simulador_valores_padrao_admin');
    if (storedValores) {
      try {
        setValoresCampos(JSON.parse(storedValores));
      } catch {}
    }

    // Identificar usuário logado
    const loggedIn = sessionStorage.getItem('usuario');
    if (loggedIn) {
      const parsed = JSON.parse(loggedIn);
      setCurrentUserEmail(parsed.email || '');
    }
  }, []);

  const handleToggleField = (id: string) => {
    const nextVis = { ...visibilidadeCampos };
    const isCurrentlyVisible = nextVis[id] !== false;
    nextVis[id] = !isCurrentlyVisible;
    setVisibilidadeCampos(nextVis);
    saveConfigToBackend(nextVis, valoresCampos);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!newNome.trim() || !newEmail.trim() || !newSenha.trim()) {
      setErrorMsg('Preencha todos os campos.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newEmail)) {
      setErrorMsg('Por favor, informe um e-mail válido.');
      return;
    }

    const emailLower = newEmail.toLowerCase().trim();
    const emailExists = users.some(u => u.email.toLowerCase().trim() === emailLower);
    if (emailExists) {
      setErrorMsg('Já existe um usuário cadastrado com este e-mail.');
      return;
    }

    try {
      const response = await fetch('https://n8n.srv939429.hstgr.cloud/webhook/criar-usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: newNome.trim(),
          email: emailLower,
          senha: newSenha,
          role: newRole
        })
      });

      if (response.ok) {
        setNewNome('');
        setNewEmail('');
        setNewSenha('');
        setNewRole('assessor');
        setSuccessMsg('Login cadastrado com sucesso!');
        fetchLogins();
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorMsg(data.erro || 'Erro ao cadastrar usuário.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão ao cadastrar usuário.');
    }

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const startEdit = (user: UserAccount) => {
    setEditingEmail(user.email);
    setEditNome(user.nome);
    setEditEmail(user.email);
    setEditSenha(''); // Inicia vazio por segurança (não exibe a senha atual)
    setEditRole(user.role);
  };

  const handleSaveEdit = async (originalEmail: string) => {
    setSuccessMsg('');
    setErrorMsg('');

    if (!editNome.trim() || !editEmail.trim()) {
      setErrorMsg('Nome e E-mail de edição devem ser preenchidos.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(editEmail)) {
      setErrorMsg('Por favor, informe um e-mail válido para a edição.');
      return;
    }

    const emailLower = editEmail.toLowerCase().trim();
    const originalLower = originalEmail.toLowerCase().trim();

    if (emailLower !== originalLower) {
      const emailExists = users.some(u => u.email.toLowerCase().trim() === emailLower);
      if (emailExists) {
        setErrorMsg('Já existe um usuário cadastrado com este e-mail.');
        return;
      }
    }

    const admins = users.filter(u => u.role === 'admin');
    if (originalLower === currentUserEmail.toLowerCase().trim() && editRole !== 'admin' && admins.length <= 1) {
      setErrorMsg('Ação não permitida. O sistema deve ter pelo menos um administrador.');
      return;
    }

    try {
      const response = await fetch('https://n8n.srv939429.hstgr.cloud/webhook/editar-usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          originalEmail: originalLower,
          nome: editNome.trim(),
          email: emailLower,
          senha: editSenha.trim() !== '' ? editSenha.trim() : '',
          role: editRole
        })
      });

      if (response.ok) {
        setEditingEmail(null);
        setSuccessMsg('Usuário atualizado com sucesso!');
        
        if (originalLower === currentUserEmail.toLowerCase().trim()) {
          const loggedIn = sessionStorage.getItem('usuario');
          if (loggedIn) {
            const parsed = JSON.parse(loggedIn);
            parsed.nome = editNome.trim();
            parsed.email = emailLower;
            parsed.role = editRole;
            sessionStorage.setItem('usuario', JSON.stringify(parsed));
            setCurrentUserEmail(emailLower);
          }
        }
        fetchLogins();
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorMsg(data.erro || 'Erro ao editar usuário.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão ao atualizar usuário.');
    }

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDeleteUser = async (emailToDelete: string) => {
    setSuccessMsg('');
    setErrorMsg('');

    if (emailToDelete.toLowerCase().trim() === currentUserEmail.toLowerCase().trim()) {
      setErrorMsg('Não é possível excluir a sua própria conta logada.');
      return;
    }

    const admins = users.filter(u => u.role === 'admin');
    const userToDelete = users.find(u => u.email === emailToDelete);
    if (userToDelete?.role === 'admin' && admins.length <= 1) {
      setErrorMsg('Ação não permitida. O sistema deve ter pelo menos um administrador.');
      return;
    }

    if (!window.confirm(`Deseja realmente remover o login de ${emailToDelete}?`)) {
      return;
    }

    try {
      const response = await fetch('https://n8n.srv939429.hstgr.cloud/webhook/deletar-usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: emailToDelete })
      });

      if (response.ok) {
        setSuccessMsg('Login removido com sucesso!');
        fetchLogins();
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorMsg(data.erro || 'Erro ao remover usuário.');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão ao deletar usuário.');
    }

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Subtabs Navigation */}
      <div className="flex border-b border-border bg-card rounded-2xl p-2 shadow-xs gap-2">
        <button
          onClick={() => setSubtab('acessos')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
            subtab === 'acessos'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Acessos e Parâmetros
        </button>
        <button
          onClick={() => setSubtab('modelos')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all ${
            subtab === 'modelos'
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          Modelos de PDF
        </button>
      </div>

      {subtab === 'acessos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
          {/* Coluna 1: Toggles de Visibilidade dos Campos */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                <Settings className="text-primary h-5 w-5" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Campos do Simulador</h3>
                  <p className="text-[11px] text-muted-foreground">Habilite ou desabilite a exibição dos parâmetros na aba Simular</p>
                </div>
              </div>

              <div className="space-y-6">
                {GRUPOS_CAMPOS.map((grupo) => (
                  <div key={grupo.titulo} className="space-y-3">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                      {grupo.titulo}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {grupo.campos.map((campo) => {
                        const isVisible = visibilidadeCampos[campo.id] !== false;
                        const value = valoresCampos[campo.id] !== undefined ? valoresCampos[campo.id] : VALORES_PADRAO_FALLBACK[campo.id];
                        const isDecimalField = ['taxaAdm', 'fundoReserva', 'correcaoCredito', 'percentualRecompra', 'txInvestimentoComparativo', 'retornoAluguelMes', 'correcaoImovelAno'].includes(campo.id);
                        const isSelectField = ['meiaParcela', 'tipoSeguro', 'tipoLance', 'usaEmbutido', 'abatimentoLance'].includes(campo.id);

                        const handleValueChange = (newVal: any) => {
                          const updatedValores = { ...valoresCampos, [campo.id]: newVal };
                          setValoresCampos(updatedValores);
                          localStorage.setItem('simulador_valores_padrao_admin', JSON.stringify(updatedValores));
                          saveConfigToBackend(visibilidadeCampos, updatedValores);
                        };

                        return (
                          <div 
                            key={campo.id} 
                            className="flex flex-col gap-2 p-3.5 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-gray-700">{campo.label}</span>
                              <button
                                type="button"
                                onClick={() => handleToggleField(campo.id)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  isVisible ? 'bg-primary' : 'bg-gray-200'
                                }`}
                              >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  isVisible ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                              </button>
                            </div>

                            <div className="w-full pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                              <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground font-sans">Valor Padrão:</span>
                              {isSelectField ? (
                                <select
                                  value={value}
                                  onChange={(e) => handleValueChange(e.target.value)}
                                  className="h-8 px-2 rounded-lg border border-gray-200 bg-background text-xs font-semibold outline-none text-foreground font-sans focus:border-primary/50"
                                >
                                  {getSelectOptions(campo.id).map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              ) : isDecimalField ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={Number((value * 100).toFixed(4))}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      handleValueChange(val / 100);
                                    }}
                                    className="w-24 h-8 px-2 text-right rounded-lg border border-gray-200 bg-background text-xs font-semibold outline-none text-foreground font-sans focus:border-primary/50"
                                  />
                                  <span className="text-[10px] font-bold text-muted-foreground">%</span>
                                </div>
                              ) : campo.id === 'credito' || campo.id === 'valorLanceLivre' ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-muted-foreground">R$</span>
                                  <input
                                    type="number"
                                    step="1000"
                                    value={value}
                                    onChange={(e) => handleValueChange(Number(e.target.value))}
                                    className="w-28 h-8 px-2 text-right rounded-lg border border-gray-200 bg-background text-xs font-semibold outline-none text-foreground font-sans focus:border-primary/50"
                                  />
                                </div>
                              ) : (
                                <input
                                  type="number"
                                  value={value}
                                  onChange={(e) => handleValueChange(Number(e.target.value))}
                                  className="w-20 h-8 px-2 text-right rounded-lg border border-gray-200 bg-background text-xs font-semibold outline-none text-foreground font-sans focus:border-primary/50"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna 2: Controle de Usuários / Adição de Login */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card: Cadastrar Novo Usuário */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                <UserPlus className="text-primary h-5 w-5" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Novo Login</h3>
                  <p className="text-[11px] text-muted-foreground font-sans">Cadastre novos assessores ou administradores</p>
                </div>
              </div>

              {successMsg && !editingEmail && (
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2.5 rounded-xl">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && !editingEmail && (
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] uppercase font-bold tracking-wide text-muted-foreground">Nome Completo</label>
                  <input
                    type="text"
                    value={newNome}
                    onChange={e => setNewNome(e.target.value)}
                    placeholder="Ex: Guilherme Morais"
                    className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] uppercase font-bold tracking-wide text-muted-foreground">E-mail</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="exemplo@morais.com"
                    className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all text-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase font-bold tracking-wide text-muted-foreground">Senha</label>
                    <input
                      type="password"
                      value={newSenha}
                      onChange={e => setNewSenha(e.target.value)}
                      placeholder="******"
                      className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all text-foreground"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] uppercase font-bold tracking-wide text-muted-foreground">Perfil</label>
                    <select
                      value={newRole}
                      onChange={e => setNewRole(e.target.value as 'admin' | 'assessor')}
                      className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all text-foreground"
                    >
                      <option value="assessor">Assessor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 mt-4 btn-premium rounded-xl flex items-center justify-center text-xs font-bold uppercase tracking-wider"
                >
                  Cadastrar Login
                </button>
              </form>
            </div>

            {/* Card: Lista de Usuários */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                <Shield className="text-primary h-5 w-5" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Logins Ativos</h3>
                  <p className="text-[11px] text-muted-foreground">Logins autorizados a utilizar o simulador</p>
                </div>
              </div>

              {successMsg && editingEmail && (
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2.5 rounded-xl animate-in fade-in">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && editingEmail && (
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 px-3 py-2.5 rounded-xl animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 nice-scroll">
                {users.filter(u => u.email !== 'config@morais.com').map((user) => {
                  const isEditing = editingEmail === user.email;

                  if (isEditing) {
                    return (
                      <div 
                        key={user.email} 
                        className="space-y-2.5 p-3 rounded-xl border border-primary/20 bg-primary/5 animate-in slide-in-from-top-1 duration-200"
                      >
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-extrabold text-primary">Nome Completo</label>
                          <input 
                            type="text" 
                            value={editNome} 
                            onChange={e => setEditNome(e.target.value)} 
                            className="w-full h-8 px-2 rounded-lg border border-input text-xs font-semibold bg-background text-foreground"
                            placeholder="Nome"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-extrabold text-primary">E-mail</label>
                          <input 
                            type="email" 
                            value={editEmail} 
                            onChange={e => setEditEmail(e.target.value)} 
                            className="w-full h-8 px-2 rounded-lg border border-input text-xs font-semibold bg-background text-foreground"
                            placeholder="E-mail"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-extrabold text-primary">Senha</label>
                            <input 
                              type="text" 
                              value={editSenha} 
                              onChange={e => setEditSenha(e.target.value)} 
                              className="w-full h-8 px-2 rounded-lg border border-input text-xs font-semibold bg-background text-foreground"
                              placeholder="Nova senha (opcional)"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-extrabold text-primary">Perfil</label>
                            <select 
                              value={editRole} 
                              onChange={e => setEditRole(e.target.value as any)} 
                              className="w-full h-8 px-2 rounded-lg border border-input text-xs font-semibold bg-background text-foreground"
                            >
                              <option value="assessor">Assessor</option>
                              <option value="admin">Administrador</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1 border-t border-primary/10">
                          <button 
                            type="button" 
                            onClick={() => setEditingEmail(null)} 
                            className="px-2.5 py-1 rounded-md bg-gray-200 text-gray-700 text-[10px] font-bold uppercase tracking-wider hover:bg-gray-300"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleSaveEdit(user.email)} 
                            className="px-2.5 py-1 rounded-md bg-primary text-white text-[10px] font-bold uppercase tracking-wider hover:bg-primary-dark"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={user.email} 
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-all bg-gray-50/25"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900 truncate max-w-[140px]">{user.nome}</span>
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-red-50 text-primary border border-primary/20' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                      </div>
                      
                      <div className="flex items-center shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(user)}
                          className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100/50 transition-colors"
                          title="Editar usuário"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(user.email)}
                          disabled={user.email.toLowerCase().trim() === currentUserEmail.toLowerCase().trim()}
                          className="p-1.5 text-gray-400 hover:text-primary disabled:opacity-40 disabled:hover:text-gray-400 rounded-lg hover:bg-gray-100/50 transition-colors"
                          title={user.email.toLowerCase().trim() === currentUserEmail.toLowerCase().trim() ? "Você não pode deletar sua própria conta logada." : "Excluir usuário"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300 bg-background">
          {/* Left Column: Selector + Visual Canvas */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="text-primary h-5 w-5" />
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Modelos de Relatório</h3>
                    <p className="text-[11px] text-muted-foreground font-sans">Configure um modelo visual de PDF para cada tipo de alavancagem</p>
                  </div>
                </div>
              </div>

              {/* Scenario Dropdown */}
              <div className="space-y-1 mb-6">
                <label className="text-[11px] uppercase font-bold tracking-wide text-muted-foreground font-sans">Cenário de Alavancagem</label>
                <select
                  value={selectedScenario}
                  onChange={e => setSelectedScenario(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all text-foreground font-sans"
                >
                  {SCENARIOS.map(sc => (
                    <option key={sc.id} value={sc.id}>{sc.label}</option>
                  ))}
                </select>
              </div>

              {successMsg && !editingEmail && (
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2.5 rounded-xl">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Visual Canvas Container */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] uppercase font-bold tracking-wide text-muted-foreground font-sans">Visualização do Modelo (Proporcional)</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPreviewWithValues(!previewWithValues)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                        previewWithValues 
                          ? 'bg-primary text-white border-primary shadow-xs' 
                          : 'bg-background border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {previewWithValues ? 'Ver Variáveis (Ex: {{nome}})' : 'Visualizar com Valores Reais'}
                    </button>
                    {selectedFieldId && pages[activePageIndex] && (
                      <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full font-sans">
                        Selecionado: {pages[activePageIndex].fields.find(f => f.id === selectedFieldId)?.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Brush Toolbar ───────────────────────────────────── */}
                {pages[activePageIndex] && (
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {/* Mode toggle */}
                    <button
                      type="button"
                      onClick={() => { setBrushMode(m => !m); setBrushEraser(false); }}
                      title={brushMode ? 'Sair do Modo Pincel' : 'Ativar Pincel de Desenho'}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                        brushMode
                          ? 'bg-primary text-white border-primary shadow-md scale-[1.03]'
                          : 'bg-card border-border text-foreground hover:border-primary/40'
                      }`}
                    >
                      <Paintbrush size={13} />
                      {brushMode ? 'Pincel Ativo' : 'Pincel'}
                    </button>

                    {brushMode && (
                      <>
                        {/* Eraser toggle */}
                        <button
                          type="button"
                          onClick={() => setBrushEraser(b => !b)}
                          title="Borracha"
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                            brushEraser
                              ? 'bg-slate-700 text-white border-slate-700'
                              : 'bg-card border-border text-foreground hover:border-primary/40'
                          }`}
                        >
                          <Eraser size={13} />
                          Borracha
                        </button>

                        {/* Brush color */}
                        {!brushEraser && (
                          <label className="relative flex items-center gap-1.5 cursor-pointer" title="Cor do pincel">
                            <div
                              className="w-7 h-7 rounded-lg border-2 border-white shadow ring-2 ring-primary/30"
                              style={{ backgroundColor: brushColor }}
                            />
                            <input
                              type="color"
                              value={brushColor}
                              onChange={e => setBrushColor(e.target.value)}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            />
                            <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">{brushColor}</span>
                          </label>
                        )}

                        {/* Quick color swatches */}
                        {!brushEraser && (
                          <div className="flex gap-1">
                            {['#E30613','#111111','#ffffff','#2563eb','#16a34a','#f59e0b','#7c3aed'].map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setBrushColor(c)}
                                className="w-5 h-5 rounded-md border-2 transition-all hover:scale-125"
                                style={{
                                  backgroundColor: c,
                                  borderColor: brushColor === c ? '#E30613' : 'rgba(0,0,0,0.15)',
                                  boxShadow: brushColor === c ? '0 0 0 2px #E30613' : undefined
                                }}
                              />
                            ))}
                          </div>
                        )}

                        {/* Brush size */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground font-sans">Tamanho:</span>
                          <input
                            type="range"
                            min="1"
                            max="30"
                            step="1"
                            value={brushSize}
                            onChange={e => setBrushSize(parseInt(e.target.value))}
                            className="w-20 accent-primary"
                          />
                          <div
                            className="rounded-full bg-current flex-shrink-0"
                            style={{
                              width: Math.max(4, Math.min(24, brushSize * 1.2)),
                              height: Math.max(4, Math.min(24, brushSize * 1.2)),
                              backgroundColor: brushEraser ? '#94a3b8' : brushColor
                            }}
                          />
                        </div>

                        {/* Undo */}
                        <button
                          type="button"
                          onClick={handleUndoStroke}
                          title="Desfazer último traço"
                          className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-bold border border-border bg-card text-foreground hover:border-primary/40 transition-all"
                        >
                          <Undo2 size={13} />
                          Desfazer
                        </button>

                        {/* Clear all drawings */}
                        <button
                          type="button"
                          onClick={handleClearDrawing}
                          title="Limpar todos os desenhos desta página"
                          className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-bold border border-red-200 bg-red-50/50 text-primary hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={13} />
                          Limpar
                        </button>

                        {/* Back to select mode */}
                        <button
                          type="button"
                          onClick={() => setBrushMode(false)}
                          title="Voltar ao modo de seleção"
                          className="flex items-center gap-1 px-2 py-1.5 rounded-xl text-[11px] font-bold border border-border bg-card text-foreground hover:border-primary/40 transition-all ml-auto"
                        >
                          <MousePointer2 size={13} />
                          Selecionar
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div
                  ref={previewContainerRef}
                  className="relative border border-border bg-gray-50 rounded-2xl overflow-hidden select-none"
                  style={{
                    width: '100%',
                    aspectRatio: pages[activePageIndex] ? `${pages[activePageIndex].aspectRatio}` : '0.707',
                    cursor: brushMode ? (brushEraser ? 'cell' : 'crosshair') : 'default'
                  }}
                  onMouseDown={brushMode ? handleBrushMouseDown : undefined}
                  onMouseMove={brushMode ? handleBrushMouseMove : undefined}
                  onMouseUp={brushMode ? handleBrushMouseUp : undefined}
                  onMouseLeave={brushMode ? handleBrushMouseUp : undefined}
                >
                  {pages[activePageIndex] ? (
                    <>
                      <img src={pages[activePageIndex].image} alt="Modelo" className="w-full h-full object-fill pointer-events-none" />
                      {pages[activePageIndex].fields.map((field) => (
                        <div
                          key={field.id}
                          className={`absolute border border-dashed flex ${field.isCustomText ? 'items-start py-1' : 'items-center'} ${
                            selectedFieldId === field.id 
                              ? 'border-primary bg-primary/10 shadow-[0_0_8px_rgba(227,6,19,0.35)] z-10' 
                              : 'border-gray-400 bg-black/5 hover:bg-black/10'
                          } transition-all duration-150`}
                          style={{
                            left: `${field.left}%`,
                            top: `${field.top}%`,
                            width: `${field.width}%`,
                            height: `${field.height}%`,
                            color: field.color || '#E30613',
                            backgroundColor: field.backgroundColor || 'transparent',
                            justifyContent: field.align === 'center' ? 'center' : (field.align === 'right' ? 'flex-end' : 'flex-start'),
                            padding: '0 4px',
                            cursor: 'move',
                          }}
                          onMouseDown={(e) => handleMouseDown(e, field.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFieldId(field.id);
                          }}
                        >
                          {field.id === 'graficoEvolucao' ? (
                            <div className="w-full h-full flex flex-col justify-between p-1 bg-white/95 border border-gray-200 rounded overflow-hidden select-none pointer-events-none self-stretch">
                              <div className="text-[7px] font-extrabold text-[#E30613] uppercase tracking-wider text-left pl-1">
                                Evolução Patrimonial (Gráfico)
                              </div>
                              <svg viewBox="0 0 200 100" className="w-full h-[80%] overflow-visible">
                                <defs>
                                  <linearGradient id="mockGradCanvas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#E30613" stopOpacity="0.35" />
                                    <stop offset="100%" stopColor="#E30613" stopOpacity="0.0" />
                                  </linearGradient>
                                </defs>
                                <line x1="20" y1="10" x2="190" y2="10" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2 2" />
                                <line x1="20" y1="30" x2="190" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2 2" />
                                <line x1="20" y1="50" x2="190" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2 2" />
                                <line x1="20" y1="70" x2="190" y2="70" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2 2" />
                                <line x1="20" y1="90" x2="190" y2="90" stroke="#64748b" strokeWidth="1" />
                                <line x1="20" y1="10" x2="20" y2="90" stroke="#64748b" strokeWidth="1" />
                                <path d="M 20 90 Q 105 70 190 20" fill="none" stroke="#E30613" strokeWidth="2" />
                                <path d="M 20 90 Q 105 70 190 20 L 190 90 Z" fill="url(#mockGradCanvas)" />
                                <circle cx="190" cy="20" r="3" fill="#ffffff" stroke="#E30613" strokeWidth="1.5" />
                              </svg>
                            </div>
                          ) : (
                            <span 
                              className={`font-display select-none ${field.isCustomText ? 'whitespace-pre-wrap break-words w-full' : 'whitespace-nowrap'}`}
                              style={{
                                fontSize: `calc(${field.fontSize}px * 0.5)`, // scaled representation
                                fontWeight: field.fontWeight === 'extrabold' ? 800 : (field.fontWeight === 'bold' ? 700 : 400),
                                lineHeight: '1.4',
                              }}
                            >
                              {field.isCustomText 
                                ? parseRichText(previewWithValues ? resolvePreviewText(field.customText || '') : (field.customText || 'Texto com Variável')) 
                                : (previewWithValues ? (DUMMY_VALUES[field.id] || field.label) : field.label)}
                            </span>
                          )}
                          
                          {/* Resize handle in bottom-right corner */}
                          {selectedFieldId === field.id && (
                            <div
                              className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-white rounded-full cursor-se-resize shadow-md hover:scale-125 transition-transform z-20"
                              style={{ transform: 'translate(50%, 50%)' }}
                              onMouseDown={(e) => handleResizeMouseDown(e, field.id)}
                            />
                          )}
                        </div>
                      ))}
                      {/* ── SVG Drawing Overlay ─────────────────── */}
                      {(() => {
                        const container = previewContainerRef.current;
                        const cW = container ? container.offsetWidth : 600;
                        const cH = container ? container.offsetHeight : 800;
                        const pageStrokes = drawingStrokes[pages[activePageIndex].id] || [];
                        const livePoints = isDrawingRef.current ? currentStrokeRef.current : [];
                        return (
                          <svg
                            className="absolute inset-0 w-full h-full pointer-events-none"
                            viewBox={`0 0 ${cW} ${cH}`}
                            style={{ zIndex: 20 }}
                          >
                            {pageStrokes.map((stroke, si) => (
                              <path
                                key={si}
                                d={strokeToPath(stroke.points, cW, cH)}
                                stroke={stroke.isEraser ? 'rgba(255,255,255,0.9)' : stroke.color}
                                strokeWidth={stroke.size}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"

                              />
                            ))}
                            {/* Live stroke being drawn */}
                            {livePoints.length > 0 && (
                              <path
                                d={strokeToPath(livePoints, cW, cH)}
                                stroke={brushEraser ? 'rgba(200,200,200,0.7)' : brushColor}
                                strokeWidth={brushSize}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                                strokeDasharray={brushEraser ? '6 3' : undefined}
                              />
                            )}
                          </svg>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 min-h-[350px]">
                      <AlertCircle size={36} className="mb-3 text-muted-foreground" />
                      <p className="text-sm font-bold text-foreground mb-1">Sem Imagem do Modelo</p>
                      <p className="text-xs text-center max-w-sm font-sans font-medium">Adicione uma página fazendo o upload da imagem de fundo do relatório (PNG/JPEG) no painel lateral.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Uploader + Styles + Actions */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Gerenciador de Páginas */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                <Upload className="text-primary h-5 w-5" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Páginas do Modelo</h3>
                  <p className="text-[11px] text-muted-foreground font-sans font-medium">Adicione e organize as páginas do relatório</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* List of current pages */}
                {pages.length > 0 ? (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 nice-scroll">
                    {pages.map((page, index) => (
                      <div 
                        key={page.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          index === activePageIndex 
                            ? 'border-primary bg-primary/5 shadow-xs' 
                            : 'border-border bg-gray-50/20 hover:bg-gray-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => { setActivePageIndex(index); setSelectedFieldId(null); }}
                          className="flex items-center gap-2 text-xs font-bold text-foreground truncate flex-1 text-left"
                        >
                          <span className="h-5 w-5 flex items-center justify-center bg-gray-200/80 rounded-full text-[10px] text-muted-foreground font-sans">
                            {index + 1}
                          </span>
                          <span className="truncate">Página {index + 1}</span>
                          <span className="text-[10px] text-muted-foreground font-normal font-sans">({page.fields.length} campos)</span>
                        </button>
                        
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMovePageUp(index)}
                            className="p-1 text-gray-400 hover:text-foreground disabled:opacity-30 rounded"
                            title="Mover para cima"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={index === pages.length - 1}
                            onClick={() => handleMovePageDown(index)}
                            className="p-1 text-gray-400 hover:text-foreground disabled:opacity-30 rounded"
                            title="Mover para baixo"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePage(index)}
                            className="p-1 text-gray-400 hover:text-primary rounded"
                            title="Excluir página"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center font-sans font-medium py-2">Nenhuma página adicionada.</p>
                )}

                {/* Upload Button */}
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  id="template-image-file"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <label
                  htmlFor="template-image-file"
                  className="w-full h-20 border-2 border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 transition-all gap-1"
                >
                  <Plus size={16} className="text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground">Adicionar Página</span>
                  <span className="text-[9px] text-muted-foreground font-sans font-medium">PNG ou JPEG até 5MB</span>
                </label>
              </div>
            </div>

            {/* Configuração de Variáveis */}
            {pages.length > 0 && pages[activePageIndex] && (
              <>
                {/* Card 1: Campos Ativos */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                  <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                    <Check className="text-primary h-5 w-5" />
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Campos na Página {activePageIndex + 1}</h3>
                      <p className="text-[11px] text-muted-foreground font-sans">Habilite as variáveis dinâmicas que deseja nesta página</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {FIELDS_BY_GROUP[selectedScenario.split('-')[0]]?.map(f => {
                      const isActive = pages[activePageIndex].fields.some(af => af.id === f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleToggleFieldInTemplate(f.id, f.label)}
                          className={`text-left p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                            isActive 
                              ? 'border-primary/30 bg-primary/5 text-primary' 
                              : 'border-border bg-background hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className="truncate pr-1">{f.label}</span>
                          {isActive && <Check size={12} className="stroke-[3] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddCustomTextField}
                      className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all font-sans"
                    >
                      <Plus size={14} />
                      <span>Adicionar Texto com Variável</span>
                    </button>
                  </div>
                </div>

                {/* Card 2: Estilos do Campo Selecionado */}
                {selectedFieldId && (
                  (() => {
                    const field = pages[activePageIndex].fields.find(f => f.id === selectedFieldId);
                    if (!field) return null;
                    return (
                      <div className="rounded-2xl border border-border bg-card p-6 shadow-card animate-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-2 mb-4 border-b border-border pb-3">
                          <Pencil className="text-primary h-5 w-5" />
                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Ajustar Posição</h3>
                            <p className="text-[11px] text-muted-foreground font-sans">Alinhamento, estilo e cor para: <strong className="text-foreground">{field.label}</strong></p>
                          </div>
                        </div>

                         <div className="space-y-4">
                           {/* Conteúdo do Texto Customizado */}
                          {field.isCustomText && (
                            <div className="space-y-1.5 p-3.5 bg-gray-50 border border-border rounded-xl">
                              <label className="text-[10px] uppercase font-bold tracking-wide text-primary font-sans">Conteúdo do Texto</label>
                              <textarea
                                id={`textarea-custom-text-${field.id}`}
                                value={field.customText || ''}
                                onChange={e => handleUpdateFieldProp('customText', e.target.value)}
                                rows={3}
                                className="w-full p-2 text-xs font-semibold rounded-lg border border-input bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 font-sans"
                                placeholder="Insira seu text. Ex: Olá {{nomeCliente}}"
                              />
                              
                              <div className="space-y-1 mt-2">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[10px] font-bold text-muted-foreground font-sans block">Clique para inserir uma variável:</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const textarea = document.getElementById(`textarea-custom-text-${field.id}`) as HTMLTextAreaElement;
                                      const text = field.customText || '';
                                      let newText = text;
                                      let newStartSelection = text.length;
                                      let newEndSelection = text.length;

                                      if (textarea) {
                                        const start = textarea.selectionStart;
                                        const end = textarea.selectionEnd;
                                        const selected = text.substring(start, end);
                                        const insertion = `**${selected}**`;
                                        newText = text.substring(0, start) + insertion + text.substring(end);
                                        newStartSelection = start + 2;
                                        newEndSelection = start + 2 + selected.length;
                                      } else {
                                        newText = text + ' ****';
                                      }

                                      handleUpdateFieldProp('customText', newText);

                                      if (textarea) {
                                        setTimeout(() => {
                                          textarea.focus();
                                          textarea.setSelectionRange(newStartSelection, newEndSelection);
                                        }, 50);
                                      }
                                    }}
                                    className="px-2 py-0.5 rounded bg-primary/10 hover:bg-primary/20 text-primary text-[9px] font-bold border border-primary/20 transition-all flex items-center gap-0.5"
                                    title="Negritar o texto selecionado na caixa acima"
                                  >
                                    <strong>B</strong> Negritar Seleção
                                  </button>
                                </div>
                                <div className="flex flex-wrap gap-1 max-h-[120px] overflow-y-auto pr-1 nice-scroll">
                                  {FIELDS_BY_GROUP[selectedScenario.split('-')[0]]?.map(v => (
                                    <button
                                      key={v.id}
                                      type="button"
                                      onClick={() => {
                                        const textarea = document.getElementById(`textarea-custom-text-${field.id}`) as HTMLTextAreaElement;
                                        const text = field.customText || '';
                                        const insertion = `{{${v.id}}}`;
                                        let newText = text;
                                        let newCursorPos = text.length + insertion.length;

                                        if (textarea) {
                                          const start = textarea.selectionStart;
                                          const end = textarea.selectionEnd;
                                          newText = text.substring(0, start) + insertion + text.substring(end);
                                          newCursorPos = start + insertion.length;
                                        } else {
                                          newText = text + ` ${insertion}`;
                                        }

                                        handleUpdateFieldProp('customText', newText);

                                        if (textarea) {
                                          setTimeout(() => {
                                            textarea.focus();
                                            textarea.setSelectionRange(newCursorPos, newCursorPos);
                                          }, 50);
                                        }
                                      }}
                                      className="px-2 py-1 rounded bg-muted hover:bg-primary/10 hover:text-primary text-foreground text-[10px] font-semibold border border-border transition-all"
                                      title={`Inserir {{${v.id}}}`}
                                    >
                                      {v.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteCustomTextField(field.id)}
                                className="w-full mt-3 py-1.5 rounded-lg border border-red-200 hover:border-red-300 bg-red-50/55 hover:bg-red-50 text-[10px] font-bold text-primary uppercase tracking-wider flex items-center justify-center gap-1 transition-all font-sans"
                              >
                                <Trash2 size={12} />
                                <span>Excluir Bloco de Texto</span>
                              </button>
                            </div>
                          )}

                          {/* Posição Horizontal (Left) */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-sans font-bold">
                              <span className="text-muted-foreground">Posição Horizontal (X)</span>
                              <span className="text-foreground">{field.left.toFixed(2)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.05"
                              value={field.left}
                              onChange={e => handleUpdateFieldProp('left', parseFloat(e.target.value))}
                              className="w-full accent-primary"
                            />
                          </div>

                          {/* Posição Vertical (Top) */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-sans font-bold">
                              <span className="text-muted-foreground">Posição Vertical (Y)</span>
                              <span className="text-foreground">{field.top.toFixed(2)}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="0.05"
                              value={field.top}
                              onChange={e => handleUpdateFieldProp('top', parseFloat(e.target.value))}
                              className="w-full accent-primary"
                            />
                          </div>

                          {/* Largura (Width) */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-sans font-bold">
                              <span className="text-muted-foreground">Largura</span>
                              <span className="text-foreground">{field.width.toFixed(2)}%</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="100"
                              step="0.05"
                              value={field.width}
                              onChange={e => handleUpdateFieldProp('width', parseFloat(e.target.value))}
                              className="w-full accent-primary"
                            />
                          </div>

                          {/* Altura (Height) */}
                           <div className="space-y-1">
                             <div className="flex justify-between text-xs font-sans font-bold">
                               <span className="text-muted-foreground">Altura</span>
                               <span className="text-foreground">{field.height.toFixed(2)}%</span>
                             </div>
                             <input
                               type="range"
                               min="1"
                               max="100"
                               step="0.05"
                               value={field.height}
                               onChange={e => handleUpdateFieldProp('height', parseFloat(e.target.value))}
                               className="w-full accent-primary"
                             />
                           </div>

                           {field.id !== 'graficoEvolucao' && (
                             <>
                               <div className="grid grid-cols-2 gap-4">
                                 {/* Tamanho da Fonte */}
                                 <div className="space-y-1">
                                   <label className="text-[10px] uppercase font-bold tracking-wide text-muted-foreground font-sans">Fonte (px)</label>
                                   <input
                                     type="number"
                                     min="8"
                                     max="48"
                                     value={field.fontSize}
                                     onChange={e => handleUpdateFieldProp('fontSize', parseInt(e.target.value) || 16)}
                                     className="w-full h-9 px-2 rounded-lg border border-input text-xs font-semibold bg-background text-foreground"
                                   />
                                 </div>

                                 {/* Peso da Fonte */}
                                 <div className="space-y-1">
                                   <label className="text-[10px] uppercase font-bold tracking-wide text-muted-foreground font-sans">Peso</label>
                                   <select
                                     value={field.fontWeight}
                                     onChange={e => handleUpdateFieldProp('fontWeight', e.target.value)}
                                     className="w-full h-9 px-2 rounded-lg border border-input text-xs font-semibold bg-background text-foreground font-sans"
                                   >
                                     <option value="normal">Normal</option>
                                     <option value="bold">Negrito</option>
                                     <option value="extrabold">Extra Negrito</option>
                                   </select>
                                 </div>
                               </div>

                                                        {/* ── Pincel: Cor do Texto ─────────────────────────────────── */}
                                <div className="space-y-2 p-3.5 rounded-xl bg-gray-50/70 border border-border">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Paintbrush size={13} className="text-primary" />
                                      <label className="text-[10px] uppercase font-bold tracking-wide text-foreground font-sans">Cor do Texto</label>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <div
                                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                                        style={{ backgroundColor: field.color }}
                                      />
                                      <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">{field.color}</span>
                                    </div>
                                  </div>
                                  {/* Swatches */}
                                  <div className="grid grid-cols-10 gap-1">
                                    {COLOR_PALETTE.map(c => (
                                      <button
                                        key={c.hex}
                                        type="button"
                                        title={c.label}
                                        onClick={() => handleUpdateFieldProp('color', c.hex)}
                                        className="relative w-6 h-6 rounded-md border-2 transition-all duration-150 hover:scale-110 focus:outline-none"
                                        style={{
                                          backgroundColor: c.hex,
                                          borderColor: field.color === c.hex ? '#E30613' : 'transparent',
                                          boxShadow: field.color === c.hex ? '0 0 0 2px #E30613' : '0 1px 3px rgba(0,0,0,0.18)'
                                        }}
                                      >
                                        {field.color === c.hex && (
                                          <Check size={10} className="absolute inset-0 m-auto" style={{ color: c.hex === '#ffffff' || c.hex === '#f1f5f9' || c.hex === '#cbd5e1' ? '#111111' : '#ffffff' }} />
                                        )}
                                      </button>
                                    ))}
                                    {/* Custom color picker */}
                                    <label
                                      className="relative w-6 h-6 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-all hover:scale-110"
                                      title="Cor personalizada"
                                      style={{ background: 'linear-gradient(135deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)' }}
                                    >
                                      <input
                                        type="color"
                                        value={field.color}
                                        onChange={e => handleUpdateFieldProp('color', e.target.value)}
                                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                      />
                                    </label>
                                  </div>
                                  {/* Hex input */}
                                  <input
                                    type="text"
                                    maxLength={7}
                                    value={field.color}
                                    onChange={e => handleUpdateFieldProp('color', e.target.value)}
                                    className="w-full h-7 px-2 rounded-lg border border-input text-[10px] uppercase font-mono font-bold bg-background text-foreground"
                                    placeholder="#000000"
                                  />
                                </div>

                                {/* ── Pincel: Cor de Fundo ─────────────────────────────────── */}
                                <div className="space-y-2 p-3.5 rounded-xl bg-gray-50/70 border border-border">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <Paintbrush size={13} className="text-primary" />
                                      <label className="text-[10px] uppercase font-bold tracking-wide text-foreground font-sans">Cor de Fundo</label>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateFieldProp('backgroundColor', field.backgroundColor === 'transparent' ? '#ffffff' : 'transparent')}
                                      className={`h-6 px-2 rounded-full border text-[9px] font-bold uppercase tracking-wider font-sans transition-all ${
                                        field.backgroundColor === 'transparent'
                                          ? 'bg-primary/10 border-primary/20 text-primary'
                                          : 'bg-background border-border text-gray-500 hover:bg-gray-50'
                                      }`}
                                    >
                                      {field.backgroundColor === 'transparent' ? '⬜ Transparente' : '🎨 Opaco'}
                                    </button>
                                  </div>
                                  {/* Swatches (disabled when transparent) */}
                                  <div className={`grid grid-cols-10 gap-1 transition-opacity ${field.backgroundColor === 'transparent' ? 'opacity-35 pointer-events-none' : ''}`}>
                                    {COLOR_PALETTE.map(c => (
                                      <button
                                        key={c.hex}
                                        type="button"
                                        title={c.label}
                                        onClick={() => handleUpdateFieldProp('backgroundColor', c.hex)}
                                        className="relative w-6 h-6 rounded-md border-2 transition-all duration-150 hover:scale-110 focus:outline-none"
                                        style={{
                                          backgroundColor: c.hex,
                                          borderColor: field.backgroundColor === c.hex ? '#E30613' : 'transparent',
                                          boxShadow: field.backgroundColor === c.hex ? '0 0 0 2px #E30613' : '0 1px 3px rgba(0,0,0,0.18)'
                                        }}
                                      >
                                        {field.backgroundColor === c.hex && (
                                          <Check size={10} className="absolute inset-0 m-auto" style={{ color: c.hex === '#ffffff' || c.hex === '#f1f5f9' || c.hex === '#cbd5e1' ? '#111111' : '#ffffff' }} />
                                        )}
                                      </button>
                                    ))}
                                    {/* Custom color picker */}
                                    <label
                                      className="relative w-6 h-6 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-all hover:scale-110"
                                      title="Cor personalizada"
                                      style={{ background: 'linear-gradient(135deg, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)' }}
                                    >
                                      <input
                                        type="color"
                                        value={field.backgroundColor === 'transparent' ? '#ffffff' : field.backgroundColor}
                                        onChange={e => handleUpdateFieldProp('backgroundColor', e.target.value)}
                                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                      />
                                    </label>
                                  </div>
                                </div>

                               {/* Alinhamento */}
                               <div className="space-y-1">
                                 <label className="text-[10px] uppercase font-bold tracking-wide text-muted-foreground font-sans">Alinhamento</label>
                                 <div className="flex rounded-lg border border-border bg-gray-50 p-1 gap-1">
                                   {['left', 'center', 'right'].map((alignOpt) => (
                                     <button
                                       key={alignOpt}
                                       type="button"
                                       onClick={() => handleUpdateFieldProp('align', alignOpt)}
                                       className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all font-sans ${
                                         field.align === alignOpt
                                           ? 'bg-white text-primary shadow-xs border border-border'
                                           : 'text-muted-foreground hover:text-foreground'
                                       }`}
                                     >
                                       {alignOpt === 'left' ? 'Esq.' : (alignOpt === 'center' ? 'Cent.' : 'Dir.')}
                                     </button>
                                   ))}
                                 </div>
                               </div>
                             </>
                           )}
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Botões de Ação */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleClearTemplate}
                    className="h-11 border border-border hover:border-primary/40 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5 bg-card text-foreground font-sans"
                  >
                    <RotateCcw size={14} />
                    <span>Limpar</span>
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    className="h-11 btn-premium text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5 font-sans"
                  >
                    <Save size={14} />
                    <span>Salvar Modelo</span>
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
