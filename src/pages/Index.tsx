import React, { useState, useEffect } from 'react';
import { LogOut, Camera, User, Loader2 } from 'lucide-react';
import SimularTab from '../components/tabs/SimularTab';
import FinanciamentoTab from '../components/tabs/FinanciamentoTab';
import CdbTab from '../components/tabs/CdbTab';
import ResumoTab from '../components/tabs/ResumoTab';
import { calcular } from '../engine/engine';
import { InputsConsorcio } from '../engine/types';

const DEFAULT_FORM: InputsConsorcio = {
  nomeCliente: '',
  credito: 500000,
  taxaAdm: 0.22,
  fundoReserva: 0.01,
  prazoGrupo: 200,
  correcaoCredito: 0.04,
  parcelasRestantes: 200,
  parcelasPagasAtéContemplar: 40,
  meiaParcela: 'MEIA',
  abateOuRatea: 'RATEAR',
  tipoSeguro: 'IMÓVEL',
  tipoLance: 'FIDELIDADE',
  valorLanceLivre: 0,
  usaEmbutido: 'SIM',
  abatimentoLance: 'REDUZIR PARCELA',
  vendeCarta: 'NÃO',
  percentualRecompra: 0.20,
  txInvestimentoComparativo: 0.0085,
  retornoAluguelMes: 0.005,
  correcaoImovelAno: 0.06,
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
  correcaoImovelAno: 'cia',
  taxaJuros: 'tj',
  trMensal: 'tr'
};

const LONG_KEYS: Record<string, string> = Object.fromEntries(
  Object.entries(SHORT_KEYS).map(([k, v]) => [v, k])
);

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

export default function Index({ navigateTo }: { navigateTo: (path: string) => void }) {
  const [usuario, setUsuario] = useState<any>(null);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [perfilErro, setPerfilErro] = useState('');
  const [perfilSucesso, setPerfilSucesso] = useState('');

  const getInitials = (name: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setPerfilErro("A imagem deve ter menos de 5MB.");
      return;
    }

    setUploadingFoto(true);
    setPerfilErro('');
    setPerfilSucesso('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result;
      
      try {
        const response = await fetch('https://n8n.srv939429.hstgr.cloud/webhook/upload-foto-perfil', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: usuario?.id,
            foto_base64: base64String
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const novoUsuario = { ...usuario, foto_base64: base64String };
            sessionStorage.setItem('usuario', JSON.stringify(novoUsuario));
            localStorage.setItem('usuario', JSON.stringify(novoUsuario));
            setUsuario(novoUsuario);
            setPerfilSucesso("Foto de perfil atualizada com sucesso!");
          } else {
            setPerfilErro(data.erro || "Erro ao atualizar a foto no servidor.");
          }
        } else {
          const data = await response.json().catch(() => ({}));
          setPerfilErro(data.erro || "Falha na resposta do servidor.");
        }
      } catch (err) {
        setPerfilErro("Erro de rede ao enviar a imagem.");
      } finally {
        setUploadingFoto(false);
        e.target.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoverFoto = async () => {
    if (uploadingFoto) return;

    setUploadingFoto(true);
    setPerfilErro('');
    setPerfilSucesso('');

    try {
      const response = await fetch('https://n8n.srv939429.hstgr.cloud/webhook/upload-foto-perfil', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: usuario?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const novoUsuario = { ...usuario };
          delete novoUsuario.foto_base64;
          delete novoUsuario.foto_url;
          sessionStorage.setItem('usuario', JSON.stringify(novoUsuario));
          localStorage.setItem('usuario', JSON.stringify(novoUsuario));
          setUsuario(novoUsuario);
          setPerfilSucesso("Foto de perfil removida com sucesso!");
        } else {
          setPerfilErro(data.erro || "Erro ao remover a foto no servidor.");
        }
      } else {
        const data = await response.json().catch(() => ({}));
        setPerfilErro(data.erro || "Falha na resposta do servidor.");
      }
    } catch (err) {
      setPerfilErro("Erro de rede ao remover a imagem.");
    } finally {
      setUploadingFoto(false);
    }
  };

  const [activeTab, setActiveTab] = useState('simular');
  const [simularView, setSimularView] = useState('form');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [resultados, setResultados] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [visibilidadeCampos, setVisibilidadeCampos] = useState<Record<string, boolean>>({});

  // Estados compartilhados de Financiamento e CDB (sincronizados)
  const [inputsFin, setInputsFin] = useState({
    prazoFin: 420,
    taxaJuros: 10.744,
    trMensal: 0.150,
    percentualEntrada: 20,
    seguroMIP: 0.0116,
    seguroDFI: 0.00827,
    taxaAdm: 25.00,
  });

  const [inputsCdb, setInputsCdb] = useState({
    objetivo: 'VALOR TOTAL' as 'VALOR TOTAL' | 'ENTRADA',
    corrigirParcela: 'NÃO CORRIGIR' as 'NÃO CORRIGIR' | 'CORRIGIR',
    rendimentoCdb: 1.0,
    valorizacaoImovel: 6.0,
  });

  useEffect(() => {
    const userStr = sessionStorage.getItem('usuario');
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        // Na inicialização, se existir foto_base64 no localStorage, mesclar com o objeto do usuário
        const localUserStr = localStorage.getItem('usuario');
        if (localUserStr) {
          const localUser = JSON.parse(localUserStr);
          if (localUser && localUser.email === userObj.email && localUser.foto_base64) {
            userObj.foto_base64 = localUser.foto_base64;
            // Garantir que o sessionStorage também tenha a imagem de perfil atualizada para que seja enviada ao gerar propostas
            sessionStorage.setItem('usuario', JSON.stringify(userObj));
          }
        }
        setUsuario(userObj);
      } catch (err) {
        console.error("Erro ao carregar usuário:", err);
      }
    }

    // Carregar configurações do backend (e cachear localmente)
    const loadConfig = async () => {
      let formBase = { ...DEFAULT_FORM };
      let camposObj: Record<string, boolean> = {};
      let valoresObj: Record<string, any> = {};

      // Primeiro carregar do localStorage (resposta imediata para renderização rápida)
      const storedValores = localStorage.getItem('simulador_valores_padrao_admin');
      if (storedValores) {
        try {
          valoresObj = JSON.parse(storedValores);
          formBase = { ...formBase, ...valoresObj };
          if (valoresObj.taxaJuros !== undefined || valoresObj.trMensal !== undefined) {
            setInputsFin(prev => ({
              ...prev,
              taxaJuros: valoresObj.taxaJuros !== undefined ? valoresObj.taxaJuros * 100 : prev.taxaJuros,
              trMensal: valoresObj.trMensal !== undefined ? valoresObj.trMensal * 100 : prev.trMensal,
            }));
          }
        } catch {}
      }

      const storedCampos = localStorage.getItem('simulador_campos_dados_entrada');
      if (storedCampos) {
        try {
          camposObj = JSON.parse(storedCampos);
          setVisibilidadeCampos(camposObj);
          if (camposObj['parcelasRestantes'] === false) {
            formBase.parcelasRestantes = formBase.prazoGrupo;
          }
        } catch {}
      }
      setForm(formBase);

      // Depois, buscar do servidor em segundo plano para garantir atualização
      try {
        const response = await fetch('https://n8n.srv939429.hstgr.cloud/webhook/listar-usuarios');
        if (response.ok) {
          const data = await response.json();
          const usersList = Array.isArray(data) ? data : (data.users || []);
          const configUser = usersList.find((u: any) => u.email === 'config@morais.com');
          if (configUser && configUser.nome) {
            const { visibilidade, valores } = decompressConfig(configUser.nome);
            
            // Atualizar estados
            setVisibilidadeCampos(visibilidade);
            let updatedFormBase = { ...DEFAULT_FORM, ...valores };
            if (visibilidade['parcelasRestantes'] === false) {
              updatedFormBase.parcelasRestantes = updatedFormBase.prazoGrupo;
            }
            setForm(updatedFormBase);

            if (valores.taxaJuros !== undefined || valores.trMensal !== undefined) {
              setInputsFin(prev => ({
                ...prev,
                taxaJuros: valores.taxaJuros !== undefined ? valores.taxaJuros * 100 : prev.taxaJuros,
                trMensal: valores.trMensal !== undefined ? valores.trMensal * 100 : prev.trMensal,
              }));
            }

            // Persistir localmente
            localStorage.setItem('simulador_valores_padrao_admin', JSON.stringify(valores));
            localStorage.setItem('simulador_campos_dados_entrada', JSON.stringify(visibilidade));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar configuracoes do servidor:", err);
      }
    };

    loadConfig();
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('usuario');
    window.location.reload();
  };

  const executarCalculo = (customForm?: any) => {
    setLoading(true);
    setTimeout(() => {
      const baseForm = customForm || form;
      const mergedForm = { ...baseForm };
      
      const storedValores = localStorage.getItem('simulador_valores_padrao_admin');
      if (storedValores) {
        try {
          const valores = JSON.parse(storedValores);
          Object.keys(visibilidadeCampos).forEach(fieldId => {
            if (visibilidadeCampos[fieldId] === false && valores[fieldId] !== undefined) {
              mergedForm[fieldId] = valores[fieldId];
            }
          });
        } catch {}
      }
      
      setResultados(calcular(mergedForm));
      setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
      setLoading(false);
    }, 600);
  };

  const isAdmin = usuario?.role === 'admin';

  return (
    <div className="flex h-screen overflow-hidden flex-col bg-background">
      <header className="shrink-0 gradient-primary px-6 shadow-[0_4px_20px_-8px_rgba(180,20,30,0.45)] flex items-center h-16 relative z-20">
        <div className="h-8 mr-8 flex items-center shrink-0">
          <img src="/logo-white.png" alt="Morais Capital" className="h-8 w-auto object-contain" />
        </div>
        <nav className="flex items-center gap-1">
          {['simular', 'financiamento', 'cdb', 'resumo'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSimularView('form'); }}
              className={`px-4 py-4 text-[13px] font-medium capitalize relative transition-colors ${
                activeTab === tab ? 'text-white' : 'text-white/70 hover:bg-white/5 rounded-lg'
              }`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-3 right-3 h-[2px] bg-white rounded-t-full" />}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          {isAdmin && (
            <button 
              onClick={() => navigateTo('/admin')} 
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
            >
              Painel ADM
            </button>
          )}
          
          {/* Avatar e Nome do Usuário Logado */}
          <button 
            onClick={() => {
              setPerfilErro('');
              setPerfilSucesso('');
              setShowPerfilModal(true);
            }} 
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-white text-left group shrink-0"
            title="Ver Perfil"
          >
            {usuario?.foto_base64 || usuario?.foto_base64 || usuario?.foto_url ? (
              <img 
                src={usuario.foto_base64 || usuario.foto_url} 
                alt={usuario.nome} 
                className="w-7 h-7 rounded-full object-cover border border-white/20 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center border border-white/20 text-[10px] font-bold shrink-0">
                {usuario?.nome ? getInitials(usuario.nome) : 'US'}
              </div>
            )}
            <span className="text-xs font-semibold mr-1 select-none">
              Olá, {usuario?.nome?.split(' ')[0] || 'Assessor'}
            </span>
          </button>

          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center h-9 w-9 bg-white/5 border border-white/15 rounded-full text-white hover:bg-white/10 transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-8 bg-background nice-scroll relative">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between animate-in fade-in duration-500">
            <div>
              <h2 className="text-[32px] font-bold capitalize text-foreground leading-tight">
                {activeTab}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Painel analítico</p>
            </div>
            {lastUpdate && (
              <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 shadow-xs font-mono text-[11px] text-muted-foreground">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span></span>
                Atualizado {lastUpdate}
              </div>
            )}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeTab === 'simular' && (
              <SimularTab 
                form={form} 
                setForm={setForm} 
                resultados={resultados} 
                setResultados={setResultados}
                loading={loading} 
                onSimulate={executarCalculo} 
                visibilidadeCampos={visibilidadeCampos}
                inputsFin={inputsFin}
                inputsCdb={inputsCdb}
              />
            )}
            {activeTab === 'financiamento' && (
              <FinanciamentoTab 
                form={form} 
                resultados={resultados} 
                inputsFin={inputsFin} 
                setInputsFin={setInputsFin} 
              />
            )}
            {activeTab === 'cdb' && (
              <CdbTab 
                form={form} 
                setForm={setForm}
                resultados={resultados} 
                inputsCdb={inputsCdb} 
                setInputsCdb={setInputsCdb} 
                inputsFin={inputsFin}
                loading={loading}
                onSimulate={executarCalculo}
              />
            )}
            {activeTab === 'resumo' && (
              <ResumoTab 
                form={form} 
                setForm={setForm}
                resultados={resultados} 
                inputsFin={inputsFin} 
                inputsCdb={inputsCdb} 
                loading={loading}
                onSimulate={executarCalculo}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modal de Perfil do Usuário */}
      {showPerfilModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl shadow-elevated w-full max-w-sm p-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 right-0 h-[3px] gradient-primary" />
            
            <h3 className="text-lg font-bold font-display text-foreground mb-4">Perfil do Usuário</h3>
            
            <div className="flex flex-col items-center mb-6">
              {/* Avatar circular grande */}
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-border bg-gray-100 overflow-hidden flex items-center justify-center shadow-sm relative group">
                  {usuario?.foto_base64 || usuario?.foto_url ? (
                    <img src={usuario.foto_base64 || usuario.foto_url} alt={usuario.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500 text-xl font-bold font-display">
                      {usuario?.nome ? getInitials(usuario.nome) : 'US'}
                    </div>
                  )}
                  
                  {/* Overlay de loading */}
                  {uploadingFoto && (
                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center rounded-full">
                      <Loader2 className="animate-spin text-white h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* Botão de câmera para trocar foto */}
                <label className={`absolute bottom-0 right-0 h-6 w-6 bg-primary hover:bg-primary/95 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer transition-all ${uploadingFoto ? 'opacity-50 pointer-events-none' : ''}`} title="Alterar Foto">
                  <Camera size={12} className="stroke-[2.5]" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUploadFoto}
                    disabled={uploadingFoto}
                  />
                </label>
              </div>

              {(usuario?.foto_base64 || usuario?.foto_url) && !uploadingFoto && (
                <button
                  type="button"
                  onClick={handleRemoverFoto}
                  className="mt-3 text-xs text-red-500 hover:text-red-600 hover:underline font-semibold transition-colors"
                >
                  Remover Foto
                </button>
              )}
            </div>

            {/* Informações do Usuário */}
            <div className="space-y-4 font-sans text-sm border-t border-border/60 pt-4 mb-6">
              <div className="grid grid-cols-[80px_1fr] items-baseline gap-2">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Nome</span>
                <span className="font-semibold text-foreground break-words">{usuario?.nome || 'Assessor'}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-baseline gap-2">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">E-mail</span>
                <span className="font-semibold text-foreground break-words">{usuario?.email || '—'}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr] items-baseline gap-2">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Função</span>
                <span className="font-semibold text-foreground capitalize">{usuario?.role || 'assessor'}</span>
              </div>
            </div>

            {/* Mensagens de Feedback */}
            {perfilErro && (
              <div className="text-xs text-red-600 font-semibold bg-red-50 py-2.5 px-3 rounded-lg border border-red-100 mb-4 animate-in fade-in duration-200 font-sans">
                {perfilErro}
              </div>
            )}
            {perfilSucesso && (
              <div className="text-xs text-emerald-600 font-semibold bg-emerald-50 py-2.5 px-3 rounded-lg border border-emerald-100 mb-4 animate-in fade-in duration-200 font-sans">
                {perfilSucesso}
              </div>
            )}

            {/* Botão de Fechar */}
            <div className="flex justify-end pt-2 border-t border-border/40">
              <button
                onClick={() => setShowPerfilModal(false)}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors font-display rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}