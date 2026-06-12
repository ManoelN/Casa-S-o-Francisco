import { Platform } from 'react-native';
import { jsPDF } from 'jspdf';

// Aceita tanto ConfiguracaoEmpresa (supabaseService) quanto ConfiguracaoLoja
interface ConfigInput {
  nome?: string;
  nome_loja?: string;
  endereco?: string;
  telefone?: string;
  avisoPersonalizado?: string;
}

function resolveConfig(config?: ConfigInput) {
  return {
    nome: config?.nome_loja ?? config?.nome ?? 'CASA SÃO FRANCISCO',
    endereco: config?.endereco ?? 'Parintins - AM',
    telefone: config?.telefone ?? '',
  };
}

function fmtDate(d: string): string {
  if (!d) return '';
  const s = d.split('T')[0].split('-');
  return `${s[2]}/${s[1]}/${s[0]}`;
}

function fmtMoney(v: number): string {
  return `R$ ${Number(v ?? 0).toFixed(2).replace('.', ',')}`;
}

function triggerDownload(doc: jsPDF, filename: string): void {
  if (Platform.OS === 'web') {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } else {
    const uri = doc.output('datauristring');
    console.log('[PDFService] PDF mobile gerado:', filename, uri.substring(0, 60) + '...');
  }
}

function drawVia(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  crediario: any,
  parcela: any,
  clienteNome: string,
  cfg: ReturnType<typeof resolveConfig>
): void {
  const r = x + w;
  const pad = 3;

  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.rect(x, y, w, h);

  // cabeçalho
  const hdrH = 11;
  doc.setFillColor(245, 245, 245);
  doc.rect(x, y, w, hdrH, 'F');
  doc.setLineWidth(0.3);
  doc.line(x, y + hdrH, r, y + hdrH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0);
  doc.text(cfg.nome, x + w / 2, y + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(80);
  const sub = [cfg.endereco, cfg.telefone ? `Tel: ${cfg.telefone}` : ''].filter(Boolean).join(' | ');
  doc.text(sub, x + w / 2, y + 9, { align: 'center' });
  doc.setTextColor(0);

  let cy = y + hdrH + 3;
  const lineH = 6.5;
  const half = (w - pad) / 2;

  const field = (label: string, value: string, fx: number, fw: number, fy: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(label, fx + pad, fy + 4);
    const lw = doc.getTextWidth(label) + pad + 1;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(value, fx + lw, fy + 4);
    doc.setLineWidth(0.15);
    doc.line(fx, fy + lineH, fx + fw, fy + lineH);
  };

  field('Cliente:', clienteNome.toUpperCase(), x, w, cy);
  cy += lineH + 1.5;

  field('Emissão:', fmtDate(crediario.data_emissao), x, half, cy);
  field('Parcela:', `${parcela.numero_parcela}/${crediario.numero_parcelas}`, x + half + pad, half, cy);
  cy += lineH + 1.5;

  field('Vencimento:', fmtDate(parcela.data_vencimento), x, half, cy);
  field('Juros/Dia:', `R$ ${Number(crediario.juros_diario ?? 0).toFixed(2)}`, x + half + pad, half, cy);

  // rodapé: código | valor
  const footH = 11;
  const fy = y + h - footH;
  doc.setLineWidth(0.3);
  doc.line(x, fy, r, fy);
  const mid = x + w / 2;
  doc.line(mid, fy, mid, y + h);

  const code = String(crediario.id ?? 0).padStart(5, '0') + String(parcela.numero_parcela).padStart(2, '0');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text('Código do Documento', x + pad, fy + 3.5);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.text(code, x + pad, fy + 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text('Valor do documento', mid + pad, fy + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(fmtMoney(parcela.valor_original ?? 0), mid + pad, fy + 9);
}

export class PDFService {
  static async gerarPDFCrediario(
    crediario: any,
    parcelas: any[],
    clienteNome: string,
    config?: ConfigInput
  ): Promise<void> {
    const cfg = resolveConfig(config);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = 210;
    const pageH = 297;
    const marginX = 8;
    const marginY = 8;
    const gapX = 4;
    const gapY = 4;
    const viaW = (pageW - marginX * 2 - gapX) / 2;
    const viaH = 52;

    let curY = marginY;

    for (let i = 0; i < parcelas.length; i++) {
      if (i > 0 && curY + viaH > pageH - marginY) {
        doc.addPage();
        curY = marginY;
      }
      drawVia(doc, marginX, curY, viaW, viaH, crediario, parcelas[i], clienteNome, cfg);
      drawVia(doc, marginX + viaW + gapX, curY, viaW, viaH, crediario, parcelas[i], clienteNome, cfg);
      curY += viaH + gapY;
    }

    const safe = clienteNome.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    triggerDownload(doc, `carne_${safe}_${parcelas.length}xParcelas.pdf`);
  }

  static async gerarRelatorioGeral(
    stats: any,
    parcelasAtrasadas: any[],
    todosCrediarios: any[],
    todosClientes: any[],
    todasParcelas: any[],
    config?: ConfigInput
  ): Promise<void> {
    const cfg = resolveConfig(config);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const mX = 14;
    const usable = pageW - mX * 2;
    let y = 18;

    const chk = (n = 10) => {
      if (y + n > 282) { doc.addPage(); y = 18; }
    };

    const secTitle = (t: string) => {
      chk(10);
      doc.setFillColor(235, 235, 235);
      doc.rect(mX, y, usable, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(0);
      doc.text(t, mX + 2, y + 5);
      y += 9;
    };

    // Cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(cfg.nome, pageW / 2, y, { align: 'center' });
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const sub2 = [cfg.endereco, cfg.telefone ? `Tel: ${cfg.telefone}` : ''].filter(Boolean).join(' | ');
    if (sub2) doc.text(sub2, pageW / 2, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('RELATÓRIO GERAL DO SISTEMA', pageW / 2, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageW / 2, y, { align: 'center' });
    doc.setTextColor(0);
    y += 5;
    doc.setLineWidth(0.4);
    doc.line(mX, y, mX + usable, y);
    y += 5;

    // Estatísticas
    secTitle('Estatísticas Gerais');
    const statRows: [string, string][] = [
      ['Total de Clientes:', String(stats?.totalClientes ?? todosClientes.length)],
      ['Total de Crediários:', String(stats?.totalCrediarios ?? todosCrediarios.length)],
      ['Parcelas em Aberto:', String(stats?.parcelasEmAberto ?? todasParcelas.filter(p => p.status === 'pendente').length)],
      ['Valor Total (crediários):', fmtMoney(stats?.valorTotalCrediarios ?? 0)],
      ['Valor Total Pago:', fmtMoney(stats?.valorTotalPago ?? 0)],
      ['Valor em Aberto:', fmtMoney(stats?.valorTotalEmAberto ?? 0)],
    ];
    for (const [label, val] of statRows) {
      chk(6);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
      doc.text(label, mX + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.text(val, mX + 68, y);
      y += 5.5;
    }
    y += 2;

    // Parcelas atrasadas
    if (parcelasAtrasadas.length > 0) {
      secTitle(`Parcelas Atrasadas (${parcelasAtrasadas.length})`);
      const cols = [44, 18, 24, 26, 20, 28];
      const hdrs = ['Cliente', 'Parcela', 'Vencimento', 'Valor Orig.', 'Dias Atr.', 'Com Juros'];

      const drawRow = (cells: string[], bold = false, fill = false) => {
        chk(6);
        if (fill) { doc.setFillColor(235, 235, 235); doc.rect(mX, y - 4, usable, 6, 'F'); }
        doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(6.5);
        let cx = mX + 1;
        cells.forEach((c, i) => { doc.text(c, cx, y); cx += cols[i]; });
        y += 5.5;
      };

      drawRow(hdrs, true, true);
      for (const p of parcelasAtrasadas) {
        const dias = Math.max(0, Math.ceil((Date.now() - new Date(p.data_vencimento).getTime()) / 86400000));
        const comJuros = (p.valor_original ?? 0) + dias * (p.juros_diario ?? 0);
        drawRow([
          p.cliente_nome ?? '-',
          String(p.numero_parcela ?? '-'),
          fmtDate(p.data_vencimento),
          fmtMoney(p.valor_original ?? 0),
          `${dias}d`,
          fmtMoney(comJuros),
        ]);
      }
      y += 2;
    }

    // Tabela de clientes
    secTitle(`Clientes (${todosClientes.length})`);
    const cCols = [52, 32, 18, 18, 26, 26];
    const cHdrs = ['Nome', 'Telefone', 'Crediários', 'Parcelas', 'Pago', 'Em Aberto'];

    const drawCRow = (cells: string[], bold = false, fill = false) => {
      chk(6);
      if (fill) { doc.setFillColor(235, 235, 235); doc.rect(mX, y - 4, usable, 6, 'F'); }
      doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(6.5);
      let cx = mX + 1;
      cells.forEach((c, i) => { doc.text(c, cx, y); cx += cCols[i]; });
      y += 5.5;
    };

    drawCRow(cHdrs, true, true);
    for (const cli of todosClientes) {
      const creds = todosCrediarios.filter(c => c.cliente_id === cli.id);
      const parts = todasParcelas.filter(p => creds.some(c => c.id === p.crediario_id));
      const pagas = parts.filter(p => p.status === 'paga');
      const abertas = parts.filter(p => p.status === 'pendente');
      const pago = pagas.reduce((s, p) => s + (p.valor_pago ?? p.valor_original ?? 0), 0);
      const aberto = abertas.reduce((s, p) => s + (p.valor_original ?? 0), 0);
      drawCRow([
        cli.nome ?? '-',
        cli.telefone ?? '-',
        String(creds.length),
        String(parts.length),
        fmtMoney(pago),
        fmtMoney(aberto),
      ]);
    }

    // Rodapé
    chk(10);
    y += 4;
    doc.setLineWidth(0.2);
    doc.line(mX, y, mX + usable, y);
    y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(120);
    doc.text('Relatório gerado automaticamente pelo Sistema de Crediário', pageW / 2, y, { align: 'center' });

    triggerDownload(doc, `relatorio_geral_${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
