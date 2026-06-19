import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const response = await fetch('https://n8n.srv939429.hstgr.cloud/webhook/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
      });

      if (response.ok) {
        const data = await response.json();
        const user = Array.isArray(data) ? data[0] : data;
        
        if (user && user.email) {
          sessionStorage.setItem('usuario', JSON.stringify(user));
          onLogin();
        } else {
          setErro('Dados de usuário inválidos retornados pelo servidor.');
          setLoading(false);
        }
      } else {
        const data = await response.json().catch(() => ({}));
        setErro(data.erro || 'E-mail ou senha inválidos.');
        setLoading(false);
      }
    } catch (err) {
      setErro('Erro ao se conectar ao servidor de autenticação.');
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center gradient-soft overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-[var(--radius)] shadow-elevated overflow-hidden p-8">
        <div className="absolute top-0 left-0 right-0 h-[1px] gradient-primary" />
        
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 mb-4 flex items-center justify-center">
            <img src="/png-nova-preta.png" alt="Morais Capital" className="h-12 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-foreground">Simulador de Consórcio</h1>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground mt-1">Acesso Restrito</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs uppercase font-medium text-muted-foreground">E-mail</label>
            <input 
              type="email"
              required
              className="w-full h-11 px-3 rounded-xl border border-input bg-background focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1 relative">
            <label className="text-xs uppercase font-medium text-muted-foreground">Senha</label>
            <div className="relative">
              <input 
                type={showSenha ? "text" : "password"}
                required
                className="w-full h-11 px-3 pr-10 rounded-xl border border-input bg-background focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <button 
                type="button" 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowSenha(!showSenha)}
              >
                {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {erro && (
            <div className="text-sm text-red-600 font-medium text-center bg-red-50 py-2 rounded-lg border border-red-100">
              {erro}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-11 mt-4 btn-premium rounded-xl flex items-center justify-center relative overflow-hidden disabled:opacity-80 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" /> Entrando...
              </span>
            ) : "Entrar"}
            {loading && <div className="absolute bottom-0 left-0 h-1 bg-white/30 animate-loading-bar w-full" />}
          </button>
        </form>
      </div>
    </div>
  );
}