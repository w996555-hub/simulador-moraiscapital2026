import React, { useState, useEffect } from 'react';
import { Search, X, ExternalLink, Loader2, AlertCircle, Inbox } from 'lucide-react';
import { PropostaResumo } from '../../engine/types';

export default function BuscarPropostasTab() {
  const [nomeCliente, setNomeCliente] = useState('');
  const [valorSimulado, setValorSimulado] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultados, setResultados] = useState<PropostaResumo[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce for Nome do Cliente input
  useEffect(() => {
    if (nomeCliente.trim() === '') {
      if (valorSimulado.trim() === '') {
        setResultados([]);
        setHasSearched(false);
      }
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      triggerSearch();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [nomeCliente]);

  const triggerSearch = async () => {
    if (nomeCliente.trim() === '' && valorSimulado.trim() === '') {
      setResultados([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setErro(null);
    setHasSearched(true);

    try {
      let url = `https://n8n.srv939429.hstgr.cloud/webhook/buscar-propostas?nome=${encodeURIComponent(nomeCliente.trim())}`;
      if (valorSimulado.trim() !== '') {
        url += `&valor=${encodeURIComponent(valorSimulado.trim())}`;
      }

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Erro ao buscar propostas. Status: ${res.status}`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.propostas || []);
      setResultados(list);
    } catch (err) {
      console.error('Erro real ao buscar propostas:', err);
      setErro('Erro de conexão ao buscar propostas. Verifique sua rede.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setNomeCliente('');
    setValorSimulado('');
    setResultados([]);
    setErro(null);
    setHasSearched(false);
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  const handleOpenProposal = (id: string) => {
    window.open(`/proposta/${id}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Bloco de Busca */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5 border-b border-border pb-3">
          <Search className="text-primary h-5 w-5" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Buscar Propostas</h3>
            <p className="text-[11px] text-muted-foreground font-sans">
              Localize propostas salvas no sistema pelo nome do cliente ou valor simulado
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            triggerSearch();
          }}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo Nome do Cliente */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold tracking-wide text-muted-foreground font-sans">
                Nome do Cliente
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nomeCliente}
                  onChange={(e) => setNomeCliente(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full h-11 pl-3 pr-10 rounded-xl border border-input bg-background text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all text-foreground font-sans"
                />
                {nomeCliente && (
                  <button
                    type="button"
                    onClick={() => setNomeCliente('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Campo Valor Simulado */}
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold tracking-wide text-muted-foreground font-sans">
                Valor Simulado (Crédito)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={valorSimulado}
                  onChange={(e) => setValorSimulado(e.target.value)}
                  placeholder="Ex: 500000"
                  className="w-full h-11 pl-3 pr-10 rounded-xl border border-input bg-background text-sm font-semibold focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all text-foreground font-sans"
                />
                {valorSimulado && (
                  <button
                    type="button"
                    onClick={() => setValorSimulado('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="h-11 px-6 btn-premium text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5 font-sans"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={14} />}
              <span>Buscar</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="h-11 px-6 border border-border hover:border-primary/40 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 hover:-translate-y-0.5 bg-card text-foreground font-sans"
            >
              <X size={14} />
              <span>Limpar</span>
            </button>
          </div>
        </form>
      </div>

      {/* Bloco de Resultados */}
      {loading && resultados.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center justify-center min-h-[250px] shadow-card">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
          <p className="text-sm font-medium text-muted-foreground font-sans">Buscando propostas...</p>
        </div>
      )}

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50/10 p-6 flex flex-col items-center justify-center text-center shadow-card">
          <AlertCircle className="h-8 w-8 text-primary mb-3" />
          <h4 className="text-sm font-bold text-foreground mb-1">Ocorreu um Erro</h4>
          <p className="text-xs text-muted-foreground max-w-md mb-4 font-sans">{erro}</p>
          <button
            type="button"
            onClick={triggerSearch}
            className="px-4 py-2 bg-primary hover:bg-primary/95 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all font-sans"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {!loading && !erro && hasSearched && resultados.length === 0 && (
        <div className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center justify-center text-center min-h-[250px] shadow-card">
          <Inbox className="h-8 w-8 text-muted-foreground mb-3" />
          <h4 className="text-sm font-bold text-foreground mb-1 font-display">Nenhuma Proposta Encontrada</h4>
          <p className="text-xs text-muted-foreground max-w-sm font-sans">
            Nenhuma simulação atende aos critérios informados. Ajuste os filtros e tente novamente.
          </p>
        </div>
      )}

      {!erro && resultados.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card animate-in fade-in duration-300">
          <div className="px-6 py-4 border-b border-border bg-muted/20">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
              Propostas Encontradas ({resultados.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/10">
                  <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground font-sans">
                    Nome do Cliente
                  </th>
                  <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground font-sans text-right">
                    Valor Simulado
                  </th>
                  <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground font-sans text-center">
                    Data de Criação
                  </th>
                  <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground font-sans text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resultados.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                    <td className="p-4 text-xs font-bold text-foreground truncate max-w-[200px]">
                      {item.nome_cliente || 'Sem Nome'}
                    </td>
                    <td className="p-4 text-xs font-extrabold text-foreground text-right font-display">
                      {formatBRL(item.credito_simulado)}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground text-center font-sans">
                      {formatDateTime(item.criado_em)}
                    </td>
                    <td className="p-4 text-xs text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenProposal(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-border hover:border-primary/40 rounded-lg bg-card hover:bg-muted/30 text-xs font-bold text-foreground uppercase tracking-wider transition-all"
                      >
                        <span>Abrir</span>
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
