import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
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

export default function Index({ navigateTo }: { navigateTo: (path: string) => void }) {
  const [usuario, setUsuario] = useState<any>(null);
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
    if (userStr) setUsuario(JSON.parse(userStr));

    const storedCampos = localStorage.getItem('simulador_campos_dados_entrada');
    if (storedCampos) {
      setVisibilidadeCampos(JSON.parse(storedCampos));
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('usuario');
    window.location.reload();
  };

  const executarCalculo = (customForm?: any) => {
    setLoading(true);
    setTimeout(() => {
      setResultados(calcular(customForm || form));
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
          <span className="text-white/75 text-sm">Olá, {usuario?.nome?.split(' ')[0] || 'Assessor'}</span>
          <button onClick={handleLogout} className="flex items-center justify-center h-9 w-9 bg-white/5 border border-white/15 rounded-full text-white">
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
    </div>
  );
}