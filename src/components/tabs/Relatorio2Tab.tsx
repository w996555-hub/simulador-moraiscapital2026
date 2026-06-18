import React from 'react';
import { ArrowLeft, Download, Check } from 'lucide-react';

export default function Relatorio2Tab({ view, onVoltar, dados }: any) {
  return (
    <div className="bg-card border border-border p-8 rounded-2xl shadow-card">
      <div className="flex justify-between items-center mb-8">
        <button onClick={onVoltar} className="flex items-center gap-2 font-bold text-muted-foreground"><ArrowLeft size={18}/> Voltar</button>
        <button className="bg-primary/10 text-primary px-4 py-2 font-bold rounded-lg flex items-center gap-2"><Download size={18}/> Baixar PDF</button>
      </div>
      <h2 className="text-2xl font-black uppercase text-foreground mb-4">Relatório Detalhado: {view}</h2>
      <div className="bg-primary/5 p-8 rounded-2xl flex flex-col items-center">
         <div className="h-16 w-16 bg-primary text-white flex items-center justify-center rounded-full mb-4"><Check size={32}/></div>
         <p className="text-4xl font-black text-primary">R$ {dados?.creditoDaCarta || '500.000,00'}</p>
         <p className="font-bold text-muted-foreground uppercase tracking-widest mt-2">Crédito na Contemplação</p>
      </div>
    </div>
  );
}