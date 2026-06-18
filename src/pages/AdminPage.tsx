import React, { useState, useEffect } from 'react';
import { LogOut, ArrowLeft } from 'lucide-react';
import AdminTab from '../components/tabs/AdminTab';

interface AdminPageProps {
  navigateTo: (path: string) => void;
}

export default function AdminPage({ navigateTo }: AdminPageProps) {
  const [usuario, setUsuario] = useState<any>(null);
  const [visibilidadeCampos, setVisibilidadeCampos] = useState<Record<string, boolean>>({});

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

  return (
    <div className="flex h-screen overflow-hidden flex-col bg-background">
      <header className="shrink-0 gradient-primary px-6 shadow-[0_4px_20px_-8px_rgba(180,20,30,0.45)] flex items-center h-16 relative z-20">
        <div className="h-8 mr-8 flex items-center shrink-0">
          <img src="/logo-white.png" alt="Morais Capital" className="h-8 w-auto object-contain" />
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <button 
            onClick={() => navigateTo('/')} 
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
          >
            <ArrowLeft size={14} /> Voltar ao Simulador
          </button>
          <span className="text-white/75 text-sm">Olá, {usuario?.nome?.split(' ')[0] || 'Admin'}</span>
          <button onClick={handleLogout} className="flex items-center justify-center h-9 w-9 bg-white/5 border border-white/15 rounded-full text-white">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-8 bg-background nice-scroll relative">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between animate-in fade-in duration-500">
            <div>
              <h2 className="text-[32px] font-bold text-foreground leading-tight">Administração</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Painel de controle de campos e logins</p>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <AdminTab 
              visibilidadeCampos={visibilidadeCampos} 
              setVisibilidadeCampos={(nextVal: any) => {
                setVisibilidadeCampos(nextVal);
                localStorage.setItem('simulador_campos_dados_entrada', JSON.stringify(nextVal));
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
