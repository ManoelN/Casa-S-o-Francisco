import { Platform } from 'react-native';
import { jsPDF } from 'jspdf';

interface ConfiguracaoLoja {
  nome_loja?: string;
  endereco?: string;
  telefone?: string;
}

const DEFAULT_CONFIG: Required<ConfiguracaoLoja> = {
  nome_loja: 'CASA SÃO FRANCISCO',
  endereco: 'Parintins - AM',
  telefone: '',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

function padCode(crediarioId: any, numeroParcela: number): string {
  return String(crediarioId ?? 0).padStart(5, '0') + String(numeroParcela).padStart(2, '0');
}

function downloadPDF(doc: jsPDF, filename: string): void {
  if (Platform.OS === 'web') {
    doc.save(filename);
  } else {
    const dataUri = doc.output('datauristring');
    console.log('[PDFService] PDF gerado (mobile):', filename, dataUri.substring(0, 80) + '...');
  }
}

// ─── Carnê ────────────────────────────────────────────────────────────────────

function desenharVia(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  crediario: any,
  parcela: any,
  clienteNome: string,
  cfg: Required<ConfiguracaoLoja>
): void {
  const pad = 4;
  const right = x + w;
  const fieldH = 7;

  // Borda externa
  doc.setDrawColor(0);
  doc.setLineWidth(0.4);
  doc.rect(x, y, w, h);

  // ── Cabeçalho ─────────────────────────────────────────────────────────────
  const headerH = 12;
  doc.setFillColor(248, 248, 248);
  doc.rect(x, y, w, headerH, 'F');
  doc.setLineWidth(0.3);
  doc.line(x, y + headerH, right, y + headerH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text(cfg.nome_loja, x + w / 2, y + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80);
  const contato = [cfg.endereco, cfg.telefone].filter(Boolean).join(' | Tel: ');
  doc.text(contato, x + w / 2, y + 10, { align: 'center' });
  doc.setTextColor(0);

  // ── Campos ────────────────────────────────────────────────────────────────
  let cy = y + headerH + 3;

  const drawField = (label: string, value: string, fx: number, fw: number, fy: number): void => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(label, fx + pad, fy + 4.5);
    const labelW = doc.getTextWidth(label) + pad + 1;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(value, fx + labelW, fy + 4.5);
    doc.setLineWidth(0.2);
    doc.line(fx, fy + fieldH, fx + fw, fy + fieldH);
  };

  // Cliente (linha inteira)
  drawField('Cliente:', clienteNome.toUpperCase(), x, w, cy);
  cy += fieldH + 2;

  // Emissão | Parcela
  const halfW = w / 2 - 1;
  drawField('Emissão:', formatDate(crediario.data_emissao), x, halfW, cy);
  drawField(
    'Parcela:',
    `${parcela.numero_parcela}/${crediario.numero_parcelas}`,
    x + halfW + 2,
    halfW,
    cy
  );
  cy += fieldH + 2;

  // Vencimento | Juros/Dia
  drawField('Vencimento:', formatDate(parcela.data_vencimento), x, halfW, cy);
  drawField(
    'Juros/Dia:',
    `R$ ${Number(crediario.juros_diario ?? 0).toFixed(2)}`,
    x + halfW + 2,
    halfW,
    cy
  );
  cy += fieldH + 4;

  // ── Rodapé: código | valor ────────────────────────────────────────────────
  const footerH = 10;
  const footerY = y + h - footerH;
  doc.setLineWidth(0.3);
  doc.line(x, footerY, right, footerY);

  // Divisor vertical no meio do rodapé
  const midX = x + w / 2;
  doc.line(midX, footerY, midX, y + h);

  // Código
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('Código do Documento', x + pad, footerY + 3.5);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text(padCode(crediario.id, parcela.numero_parcela), x + pad, footerY + 8);

  // Valor
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('Valor do documento', midX + pad, footerY + 3.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    `R$ ${Number(parcela.valor_original ?? 0).toFixed(2)}`,
    midX + pad,
    footerY + 8.5
  );
}

export class PDFService {
  static async gerarPDFCrediario(
    crediario: any,
    parcelas: any[],
    clienteNome: string,
    config?: ConfiguracaoLoja
  ): Promise<void> {
    const cfg: Required<ConfiguracaoLoja> = { ...DEFAULT_CONFIG, ...config };

    // A4 retrato: 210 × 297 mm
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = 210;
    const pageH = 297;
    const marginX = 8;
    const marginY = 8;
    const gap = 4;       // espaço entre vias na horizontal
    const rowGap = 5;    // espaço entre linhas de parcelas

    const viaW = (pageW - marginX * 2 - gap) / 2;
    const viaH = 52;     // altura de cada via em mm

    let currentY = marginY;
    let isFirstPage = true;

    for (const parcela of parcelas) {
      // Verifica se cabe na página atual
      if (!isFirstPage && currentY + viaH > pageH - marginY) {
        doc.addPage();
        currentY = marginY;
      }
      isFirstPage = false;

      const xLeft = marginX;
      const xRight = marginX + viaW + gap;

      desenharVia(doc, xLeft, currentY, viaW, viaH, crediario, parcela, clienteNome, cfg);
      desenharVia(doc, xRight, currentY, viaW, viaH, crediario, parcela, clienteNome, cfg);

      currentY += viaH + rowGap;
    }

    const safeNome = clienteNome.replace(/\s+/g, '_').toLowerCase();
    const filename = `carne_${safeNome}_${parcelas.length}xParcelas.pdf`;
    downloadPDF(doc, filename);
  }

  static async gerarRelatorioGeral(
    stats: any,
    parcelasAtrasadas: any[],
    todosCrediarios: any[],
    todosClientes: any[],
    todasParcelas: any[],
    config?: ConfiguracaoLoja
  ): Promise<void> {
    const cfg: Required<ConfiguracaoLoja> = { ...DEFAULT_CONFIG, ...config };

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const marginX = 15;
    const usableW = pageW - marginX * 2;
    let y = 20;

    const checkPage = (needed = 10): void => {
      if (y + needed > 280) {
        doc.addPage();
        y = 20;
      }
    };

    const sectionTitle = (title: string): void => {
      checkPage(12);
      doc.setFillColor(240, 240, 240);
      doc.rect(marginX, y, usableW, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text(title, marginX + 2, y + 5);
      y += 9;
    };

    // ── Cabeçalho ─────────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(cfg.nome_loja, pageW / 2, y, { align: 'center' });
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const contato = [cfg.endereco, cfg.telefone].filter(Boolean).join(' | Tel: ');
    doc.text(contato, pageW / 2, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('RELATÓRIO GERAL DO SISTEMA', pageW / 2, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageW / 2, y, {
      align: 'center',
    });
    doc.setTextColor(0);
    y += 7;
    doc.setLineWidth(0.5);
    doc.line(marginX, y, marginX + usableW, y);
    y += 5;

    // ── Estatísticas gerais ────────────────────────────────────────────────────
    sectionTitle('Estatísticas Gerais');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const statLines = [
      [`Total de Clientes:`, String(stats?.totalClientes ?? todosClientes.length)],
      [`Total de Crediários:`, String(stats?.totalCrediarios ?? todosCrediarios.length)],
      [`Parcelas em Aberto:`, String(stats?.parcelasEmAberto ?? todasParcelas.filter((p) => p.status === 'pendente').length)],
      [`Valor Total (crediários):`, formatCurrency(stats?.valorTotalCrediarios ?? 0)],
      [`Valor Total Pago:`, formatCurrency(stats?.valorTotalPago ?? 0)],
      [`Valor Total em Aberto:`, formatCurrency(stats?.valorTotalEmAberto ?? 0)],
    ];
    for (const [label, value] of statLines) {
      checkPage(6);
      doc.setFont('helvetica', 'bold');
      doc.text(label, marginX + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value, marginX + 70, y);
      y += 5.5;
    }
    y += 2;

    // ── Parcelas atrasadas ─────────────────────────────────────────────────────
    if (parcelasAtrasadas.length > 0) {
      sectionTitle(`Parcelas Atrasadas (${parcelasAtrasadas.length})`);

      const colW = [45, 22, 25, 25, 20, 28];
      const headers = ['Cliente', 'Parcela', 'Vencimento', 'Valor Orig.', 'Dias Atr.', 'Com Juros'];

      const drawTableRow = (cells: string[], bold = false, fill = false): void => {
        checkPage(6);
        if (fill) {
          doc.setFillColor(240, 240, 240);
          doc.rect(marginX, y - 4, usableW, 6, 'F');
        }
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        doc.setFontSize(7);
        let cx = marginX + 1;
        for (let i = 0; i < cells.length; i++) {
          doc.text(cells[i], cx, y);
          cx += colW[i];
        }
        y += 5.5;
      };

      drawTableRow(headers, true, true);

      for (const p of parcelasAtrasadas) {
        const hoje = new Date();
        const venc = new Date(p.data_vencimento);
        const dias = Math.max(0, Math.ceil((hoje.getTime() - venc.getTime()) / 86400000));
        const comJuros = (p.valor_original ?? 0) + dias * (p.juros_diario ?? 0);
        drawTableRow([
          String(p.cliente_nome ?? '-'),
          String(p.numero_parcela ?? '-'),
          formatDate(p.data_vencimento),
          formatCurrency(p.valor_original ?? 0),
          `${dias} dias`,
          formatCurrency(comJuros),
        ]);
      }
      y += 2;
    }

    // ── Clientes ───────────────────────────────────────────────────────────────
    sectionTitle(`Clientes (${todosClientes.length})`);

    const cliColW = [55, 35, 20, 20, 25, 25];
    const cliHeaders = ['Nome', 'Telefone', 'Crediários', 'Parcelas', 'Pago', 'Em Aberto'];

    const drawCellRow = (cells: string[], bold = false, fill = false): void => {
      checkPage(6);
      if (fill) {
        doc.setFillColor(240, 240, 240);
        doc.rect(marginX, y - 4, usableW, 6, 'F');
      }
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(7);
      let cx = marginX + 1;
      for (let i = 0; i < cells.length; i++) {
        doc.text(cells[i], cx, y);
        cx += cliColW[i];
      }
      y += 5.5;
    };

    drawCellRow(cliHeaders, true, true);

    for (const cliente of todosClientes) {
      const crediariosCliente = todosCrediarios.filter((c) => c.cliente_id === cliente.id);
      const parcelasCliente = todasParcelas.filter((p) =>
        crediariosCliente.some((c) => c.id === p.crediario_id)
      );
      const pagas = parcelasCliente.filter((p) => p.status === 'paga');
      const abertas = parcelasCliente.filter((p) => p.status === 'pendente');
      const valorPago = pagas.reduce((s, p) => s + (p.valor_pago ?? p.valor_original ?? 0), 0);
      const valorAberto = abertas.reduce((s, p) => s + (p.valor_original ?? 0), 0);

      drawCellRow([
        cliente.nome ?? '-',
        cliente.telefone ?? '-',
        String(crediariosCliente.length),
        String(parcelasCliente.length),
        formatCurrency(valorPago),
        formatCurrency(valorAberto),
      ]);
    }

    // ── Rodapé ─────────────────────────────────────────────────────────────────
    checkPage(12);
    y += 5;
    doc.setLineWidth(0.3);
    doc.line(marginX, y, marginX + usableW, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text('Relatório gerado automaticamente pelo Sistema de Crediário', pageW / 2, y, {
      align: 'center',
    });

    const filename = `relatorio_geral_${new Date().toISOString().split('T')[0]}.pdf`;
    downloadPDF(doc, filename);
  }
}
