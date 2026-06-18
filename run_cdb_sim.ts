import { calcularCDB, simularCDB, CDBDefaults } from './scratch_test/cdb-simulator';

const outputs = calcularCDB(CDBDefaults);
console.log('--- CDB simulator outputs ---');
console.log('Tempo:', outputs.tempoParaComprarFormatado);
console.log('Imóvel Corrigido:', outputs.imovelCorrigidoNaDataDoSaque);
console.log('Total Aportado:', outputs.totalAportado);
console.log('Rendimento Líquido:', outputs.rendimentoLiquidoAposIR);
console.log('IR Pago:', outputs.IRPago);
console.log('Saldo Líquido:', outputs.saldoLiquidoTotal);
console.log('Aluguel Pago:', outputs.aluguelTotalPago);
console.log('Total Poupado + Aluguel:', outputs.totalPoupadoMaisAluguel);

const tabela = simularCDB(CDBDefaults);
console.log('\nFirst 5 rows:');
for (let i = 0; i < 5; i++) {
  console.log(`Month ${tabela[i].mes}: Bruto=${tabela[i].saldoBruto.toFixed(2)} | Aportado=${tabela[i].totalAportado.toFixed(2)} | Liquido=${tabela[i].saldoLiquido.toFixed(2)} | Imovel=${tabela[i].imovelCorrigido.toFixed(2)}`);
}
