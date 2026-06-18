# Contrato de Integração do Simulador (API Contract)

Este documento descreve o contrato de dados (Request e Response) necessário para que o simulador de consórcios funcione em qualquer ambiente, detalhando como os parâmetros de entrada e os resultados calculados trafegam entre o front-end (React) e a API (Google Apps Script / Planilha Excel).

> [!IMPORTANT]
> **Aviso de Responsabilidade Matemática:** As fórmulas de simulação, as regras de amortização e a lógica financeira vivem e são executadas na planilha do consultor (via Google Apps Script / Code.gs). Este documento cobre exclusivamente o **contrato de tráfego de dados** (schemas de entrada e saída), não a implementação matemática interna das fórmulas.

---

## 1. Visão Geral do Fluxo

O simulador funciona no modelo clássico de Request/Response sem estado persistido em banco na API. O front-end envia um payload de dados completo, a planilha calcula todos os cenários e devolve o conjunto final de dados consolidados.

```
+------------------------------------+
|       Front-end (React/TS)         |
+------------------------------------+
                  |
                  | 1. POST JSON (FormData)
                  v
+------------------------------------+
|  Google Apps Script (Code.gs)      |
+------------------------------------+
                  |
                  | 2. Grava nas Células / Recalcula
                  v
+------------------------------------+
|  Planilha de Cálculos (.xlsx)      |
+------------------------------------+
                  |
                  | 3. Lê Resultados Finais
                  v
+------------------------------------+
|  Google Apps Script (Code.gs)      |
+------------------------------------+
                  |
                  | 4. Response JSON (resultados)
                  v
+------------------------------------+
|       Front-end (React/TS)         |
+------------------------------------+
```

---

## 2. Contrato de Input (`FormData`)

O payload de envio (Request) consiste em um objeto plano com **19 campos** obrigatórios, mapeados diretamente do formulário da interface do usuário.

| Campo | Tipo | Unidade | Rótulo na Tela | Default | Aba/Célula da Planilha (Destino) |
|---|---|---|---|---|---|
| `credito` | number | R$ | "Crédito" | 500000 | Simular!B3 |
| `taxaAdm` | number | % (decimal) | "Taxa Adm" | 0.22 | Simular!B4 |
| `fundoReserva` | number | % (decimal) | "Fundo de Reserva" | 0.01 | a confirmar com Code.gs |
| `prazoGrupo` | number | inteiro | "Prazo do Grupo" | 220 | a confirmar com Code.gs |
| `correcaoCredito` | number | % (decimal) | "Correção do Crédito" | 0.04 | a confirmar com Code.gs |
| `parcelasRestantes` | number | inteiro | "Parcelas Restantes" | 220 | a confirmar com Code.gs |
| `parcelasPagasAtéContemplar` | number | inteiro | "Pagas até Contemplar" | 40 | a confirmar com Code.gs |
| `meiaParcela` | string | enum | "Meia ou Integral" | "MEIA" | a confirmar com Code.gs |
| `abateOuRatea` | string | enum | "Reduz Prazo ou Parcela?" | "RATEAR" | a confirmar com Code.gs |
| `tipoLance` | string | enum | "Tipo de Lance" | "SORTEIO" | a confirmar com Code.gs |
| `valorLanceLivre` | number | R$ | "Valor Lance Livre" | 0 | a confirmar com Code.gs |
| `usaEmbutido` | string | enum | "Usa Embutido?" | "NÃO" | a confirmar com Code.gs |
| `abatimentoLance` | string | enum | "Reduz Prazo ou Parcela?" | "REDUZIR PARCELA" | a confirmar com Code.gs |
| `tipoSeguro` | string | enum | "Seguro" | "IMÓVEL" | a confirmar com Code.gs |
| `vendeCarta` | string | enum | "Vende a Carta?" | "NÃO" | a confirmar com Code.gs |
| `percentualRecompra` | number | % (decimal) | "Recompra da Carta" | 0.20 | a confirmar com Code.gs |
| `txInvestimentoComparativo` | number | % (decimal) | "Tx. Invest. Comparativo" | 0.0085 | a confirmar com Code.gs |
| `retornoAluguelMes` | number | % (decimal) | "Retorno Aluguel" | 0.005 | a confirmar com Code.gs |
| `correcaoImovelAno` | number | % (decimal) | "Corr. Anual Imóvel" | 0.06 | a confirmar com Code.gs |

### Definição dos Enums
* `meiaParcela`: `"MEIA"` | `"INTEGRAL"`
* `abateOuRatea`: `"RATEAR"` | `"DESCONTAR"`
* `tipoLance`: `"SORTEIO"` | `"LANCE LIVRE"` | `"FIDELIDADE"` | `"SEM LANCE"`
* `usaEmbutido`: `"SIM"` | `"NÃO"`
* `abatimentoLance`: `"REDUZIR PARCELA"` | `"REDUZIR PRAZO"`
* `tipoSeguro`: `"IMÓVEL"` | `"VEÍCULO"` | `"NENHUM"`
* `vendeCarta`: `"SIM"` | `"NÃO"`

---

## 3. Contrato de Output (`ApiResponse.resultados`)

A resposta da API deve conter uma propriedade raiz `resultados`, subdividida em visões especializadas para alimentar as abas do front-end.

### 3.1 `pat_sorteio` e `pat_lance`
* **Tipo TypeScript:** `ResultadosPatrimonial`
* **Consumidor no Front:** `src/components/tabs/SimularTab.tsx` (PatDetailView)
* **Estrutura dos campos consumidos:**
  ```typescript
  interface ResultadosPatrimonial {
    creditoDaCarta: number;        // Usado em FinanceCard (CRÉDITO) e no Hexágono Destaque
    parcelaInicial: number;        // Usado em FinanceCard (PARCELA INICIAL)
    parcelaContemplacao: number;   // Usado no mini-card "Simulando contemplação no mês"
    prazoRestante: number;         // Usado no mini-card "Prazo" (meses restantes)
    desembolso: number;            // Usado no mini-card "Valor investido até a contemplação"
    parcelaPosContemplacao: number;// Usado em FinanceCard (PÓS CONTEMPLAÇÃO)
  }
  ```

### 3.2 `fin_sorteio` e `fin_lance`
* **Tipo TypeScript:** `ResultadosFinanceira`
* **Consumidor no Front:** `src/components/tabs/SimularTab.tsx` (FinDetailView)
* **Estrutura dos campos consumidos:**
  ```typescript
  interface ResultadosFinanceira {
    desembolso: number;            // Usado no mini-card "Valor investido"
    creditoDaCarta: number;        // Usado no mini-card "Valor da carta"
    lucroLiquidoVenda: number;     // Usado no Hexágono Destaque (VALOR DE REVENDA) e no card "Lucro líquido"
    retornoAoMes: number;          // Usado no sub-bloco "Retorno ao mês (TIR)"
    retornoTotalPercent: number;   // Usado no sub-bloco "Retorno total"
  }
  ```

### 3.3 `apl_sorteio` e `apl_lance`
* **Tipo TypeScript:** `ResultadosAplicacao`
* **Consumidor no Front:** `src/components/tabs/SimularTab.tsx` (AplicacaoDetailView)
* **Estrutura dos campos consumidos:**
  ```typescript
  interface ResultadosAplicacao {
    desembolso: number;            // Usado no mini-card "Valor investido"
    custoTotal: number;            // Usado no mini-card "Custo total"
    valorCorrigidoAplicacao: number; // Usado no Hexágono Destaque (VALOR CORRIGIDO)
    lucroLiquidoAplicacao: number; // Usado no card "Lucro Líquido Aplicação"
    retornoAplicacaoPercent: number; // Usado no card "Diferença de Retorno"
  }
  ```

### 3.4 `lance_livre`
* **Tipo TypeScript:**
  ```typescript
  interface LanceLivreInfo {
    percentLivre: number;          // Percentual ofertado no lance livre
    totalReais: number;            // Total do lance ofertado em reais (lance_livre + embutido)
    totalPercent: number;          // Percentual total do lance (soma)
  }
  ```
* **Consumidor no Front:** `SimularTab.tsx` (Faixa de Lance Livre)

### 3.5 `financiamento`
* **Consumidor no Front:** `src/components/tabs/FinanciamentoTab.tsx`
* **Campos reais consumidos:**
  * `resultados.financiamento.financiamento.parcelaInicial` (Exemplo de chave lida)
  *(Nota: A aba de financiamento atual do front-end está construída de forma estática como esqueleto mockup. Caso queira alimentá-la futuramente, a API precisará retornar o objeto de comparação de financiamento).*

### 3.6 `cdb`
* **Consumidor no Front:** `src/components/tabs/CdbTab.tsx`
  *(Nota: Atualmente é um esqueleto mockup estático).*

### 3.7 `resumo`
* **Consumidor no Front:** `src/components/tabs/ResumoTab.tsx`
  *(Nota: Atualmente é um esqueleto mockup estático).*

---

## 4. Mapeamento "Tela → JSON → Planilha"

Tabela unificada que descreve a origem e o destino do fluxo de dados para as telas ativas:

### Aba Simular — Card Patrimonial (Sorteio)
| Rótulo na Tela | Chave JSON / Origem | Célula Planilha Destino (a confirmar) |
|---|---|---|
| "INVESTIDO" | `resultados.pat_sorteio.desembolso` | Simular!B36 |
| "CRÉDITO" (Topo) | `form.credito` (Valor digitado) | Simular!B3 |
| "CRÉDITO NA CONTEMPLAÇÃO" (Centro) | `resultados.pat_sorteio.creditoDaCarta` | Simular!B37 |
| "PÓS CONTEMPLAÇÃO" | `resultados.pat_sorteio.parcelaPosContemplacao` | Simular!B38 |
| "PRAZO" | `form.prazoGrupo` (Valor digitado) | a confirmar com Code.gs |

### Aba Simular — Card Patrimonial (Lance)
| Rótulo na Tela | Chave JSON / Origem | Célula Planilha Destino (a confirmar) |
|---|---|---|
| "INVESTIDO" | `resultados.pat_lance.desembolso` | Simular!B36 |
| "CRÉDITO" (Topo) | `form.credito` (Valor digitado) | Simular!B3 |
| "CRÉDITO NA CONTEMPLAÇÃO" (Centro) | `resultados.pat_lance.creditoDaCarta` | Simular!B37 |
| "PÓS CONTEMPLAÇÃO" | `resultados.pat_lance.parcelaPosContemplacao` | Simular!B38 |
| "PRAZO" | `form.prazoGrupo` (Valor digitado) | a confirmar com Code.gs |

---

## 5. Exemplos JSON Reais (Sorteio e Lance)

Os payloads abaixo foram extraídos executando a lógica do motor oficial do projeto.

### 5.1 Cenário Sorteio
Exemplo de simulação com tipo de lance igual a **Sorteio** (Sorteio Puro).

#### Request JSON
```json
{
  "credito": 500000,
  "taxaAdm": 0.22,
  "fundoReserva": 0.01,
  "prazoGrupo": 220,
  "correcaoCredito": 0.04,
  "parcelasRestantes": 220,
  "parcelasPagasAtéContemplar": 40,
  "meiaParcela": "MEIA",
  "abateOuRatea": "RATEAR",
  "tipoLance": "SORTEIO",
  "valorLanceLivre": 0,
  "usaEmbutido": "NÃO",
  "abatimentoLance": "REDUZIR PARCELA",
  "tipoSeguro": "IMÓVEL",
  "vendeCarta": "NÃO",
  "percentualRecompra": 0.2,
  "txInvestimentoComparativo": 0.0085,
  "retornoAluguelMes": 0.005,
  "correcaoImovelAno": 0.06
}
```

#### Response JSON (`resultados`)
```json
{
  "parcelaBase": 2795.454545454545,
  "parcelaEntrada": 1,
  "parcelaContemplacao": 40,
  "parcelasVencidas": 0,
  "parcelasPagasPreContemplacao": 39,
  "saldoMeiasNaoPagas": 58646.75781818187,
  "valorAcumuladoInvestido": 57074.504727272775,
  "saldoDevedor": 0,
  "lanceEmReais": 0,
  "lanceEmParcelas": 0,
  "prazoAposContemplacao": 180,
  "prazoMantido": 180,
  "parcelaInicial": 1397.7272727272725,
  "desembolso": 58646.75781818187,
  "creditoDaCarta": 562432,
  "parcelaPosContemplacao": 3839.7914375757573,
  "prazoRestante": 180,
  "percentualLanceTotal": 0,
  "boletoLanceLivre": 0,
  "aluguelEstimado": 2812.16,
  "diferencaAPagar": 1027.6314375757574,
  "lucroLiquidoVenda": 53839.64218181814,
  "retornoAoMes": 0.03131986771130388,
  "retornoTotalPercent": 0.9180327128864162,
  "custoTotal": 58646.75781818187,
  "valorCorrigidoAplicacao": 2055130.623560721,
  "lucroLiquidoAplicacao": 1996483.8657425393,
  "retornoAplicacaoPercent": 34.04252749882761
}
```

---

### 5.2 Cenário Lance
Exemplo de simulação com lance do tipo **Lance Livre** e lance embutido ativado.

#### Request JSON
```json
{
  "credito": 500000,
  "taxaAdm": 0.22,
  "fundoReserva": 0.01,
  "prazoGrupo": 220,
  "correcaoCredito": 0.04,
  "parcelasRestantes": 220,
  "parcelasPagasAtéContemplar": 40,
  "meiaParcela": "MEIA",
  "abateOuRatea": "RATEAR",
  "tipoLance": "LANCE LIVRE",
  "valorLanceLivre": 100000,
  "usaEmbutido": "SIM",
  "abatimentoLance": "REDUZIR PARCELA",
  "tipoSeguro": "IMÓVEL",
  "vendeCarta": "NÃO",
  "percentualRecompra": 0.2,
  "txInvestimentoComparativo": 0.0085,
  "retornoAluguelMes": 0.005,
  "correcaoImovelAno": 0.06
}
```

#### Response JSON (`resultados`)
```json
{
  "parcelaBase": 2795.454545454545,
  "parcelaEntrada": 1,
  "parcelaContemplacao": 40,
  "parcelasVencidas": 0,
  "parcelasPagasPreContemplacao": 39,
  "saldoMeiasNaoPagas": 58646.75781818187,
  "valorAcumuladoInvestido": 57074.504727272775,
  "saldoDevedor": 0,
  "lanceEmReais": 268729.6,
  "lanceEmParcelas": 85,
  "prazoAposContemplacao": 180,
  "prazoMantido": 180,
  "parcelaInicial": 1397.7272727272725,
  "desembolso": 58646.75781818187,
  "creditoDaCarta": 393702.39999999997,
  "parcelaPosContemplacao": 2207.8800766060604,
  "prazoRestante": 180,
  "percentualLanceTotal": 0.47779927173418296,
  "boletoLanceLivre": 100000,
  "aluguelEstimado": 1968.512,
  "diferencaAPagar": 239.3680766060604,
  "lucroLiquidoVenda": 20093.722181818128,
  "retornoAoMes": 1746981901544.5574,
  "retornoTotalPercent": 0.3426228990204912,
  "custoTotal": 58646.75781818187,
  "valorCorrigidoAplicacao": 1438591.4364925046,
  "lucroLiquidoAplicacao": 1379944.6786743228,
  "retornoAplicacaoPercent": 23.529769249179324
}
```
