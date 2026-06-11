import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Alert } from 'react-native';

// Interfaces locais para evitar problemas de import
interface Crediario {
  id?: number;
  cliente_id: number;
  cliente_nome: string;
  data_emissao: string;
  data_vencimento_primeira: string;
  valor_total: number;
  juros_diario: number;
  numero_parcelas: number;
  valor_parcela: number;
  created_at?: string;
}

interface Parcela {
  id?: number;
  crediario_id: number;
  numero_parcela: number;
  valor_original: number;
  valor_restante?: number;
  valor_pago_parcial?: number;
  data_vencimento: string;
  status: 'pendente' | 'paga';
  data_pagamento?: string;
  valor_pago?: number;
  dias_atraso: number;
  created_at?: string;
}

interface ConfiguracaoEmpresa {
  nome: string;
  endereco: string;
  telefone: string;
  avisoPersonalizado: string;
}

export class PDFService {
  static async gerarPDFCrediario(crediario: Crediario, parcelas: Parcela[], clienteNome: string, config?: ConfiguracaoEmpresa): Promise<void> {
    try {
      console.log('📄 [PDF] Iniciando geração de PDF para:', clienteNome);
      console.log('📄 [PDF] Dados recebidos:', { crediario, parcelas: parcelas.length, config });
      console.log('📄 [PDF] Verificando dependências...');
      console.log('📄 [PDF] Print disponível:', !!Print);
      console.log('📄 [PDF] Sharing disponível:', !!Sharing);
      console.log('📄 [PDF] Platform disponível:', !!Platform);
      
      console.log('📄 [PDF] Gerando HTML...');
      const htmlContent = this.gerarHTMLParcelas(crediario, parcelas, clienteNome, config);
      console.log('📄 [PDF] HTML gerado, tamanho:', htmlContent.length);
      console.log('📄 [PDF] Primeiros 200 chars do HTML:', htmlContent.substring(0, 200));
      
      console.log('📄 [PDF] Chamando Print.printToFileAsync...');
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 612,
        height: 792,
        margins: {
          left: 20,
          top: 20,
          right: 20,
          bottom: 20,
        },
      });

      console.log('📄 [PDF] PDF gerado com sucesso:', uri);
      console.log('📄 [PDF] Tipo de URI:', typeof uri);
      console.log('📄 [PDF] URI válida:', uri && uri.length > 0);
      console.log('📄 [PDF] Platform.OS:', Platform.OS);

      if (Platform.OS === 'web') {
        console.log('📄 [PDF] Plataforma web detectada, iniciando download...');
        // Na web, converter para blob e fazer download
        try {
          console.log('📄 [PDF] Fazendo fetch do arquivo...');
          // Buscar o arquivo PDF gerado
          const response = await fetch(uri);
          console.log('📄 [PDF] Response status:', response.status);
          console.log('📄 [PDF] Response ok:', response.ok);
          console.log('📄 [PDF] Response headers:', response.headers);
          
          const blob = await response.blob();
          console.log('📄 [PDF] Blob criado, tamanho:', blob.size);
          console.log('📄 [PDF] Blob type:', blob.type);
          
          // Criar URL do blob
          const blobUrl = URL.createObjectURL(blob);
          console.log('📄 [PDF] Blob URL criado:', blobUrl);
          
          console.log('📄 [PDF] Criando link de download...');
          // Criar link de download
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `crediario-${clienteNome.replace(/\s+/g, '-').toLowerCase()}.pdf`;
          link.style.display = 'none';
          
          console.log('📄 [PDF] Adicionando link ao DOM e clicando...');
          // Adicionar ao DOM, clicar e remover
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log('📄 [PDF] Limpando blob URL...');
          // Limpar URL do blob após um tempo
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
          }, 1000);

          console.log('📄 [PDF] Download iniciado na web com sucesso');
          
        } catch (error) {
          console.error('📄 [PDF] Erro no download do PDF:', error);
          console.error('📄 [PDF] Stack do erro de download:', error.stack);
          // Fallback: abrir em nova aba
          try {
            console.log('📄 [PDF] Tentando fallback - abrir em nova aba...');
            const newWindow = window.open(uri, '_blank');
            if (!newWindow) {
              console.log('📄 [PDF] Pop-up bloqueado, mostrando alerta');
              Alert.alert('PDF Gerado', `PDF gerado com sucesso!\n\nClique no link para baixar:\n${uri}`);
            } else {
              console.log('📄 [PDF] PDF aberto em nova aba');
            }
          } catch (fallbackError) {
            console.error('📄 [PDF] Erro no fallback:', fallbackError);
            Alert.alert('PDF Gerado', `PDF gerado em: ${uri}`);
          }
        }
      } else {
        console.log('📄 [PDF] Plataforma mobile detectada');
        console.log('📄 [PDF] Verificando se arquivo existe:', uri);
        
        // Verificar se o arquivo foi realmente criado
        try {
          console.log('📄 [PDF] Tentando acessar arquivo...');
          const response = await fetch(uri);
          console.log('📄 [PDF] Response status:', response.status);
          console.log('📄 [PDF] Response ok:', response.ok);
        } catch (fetchError) {
          console.error('📄 [PDF] Erro ao acessar arquivo:', fetchError);
        }
        
        // Em dispositivos móveis, usar o compartilhamento
        console.log('📄 [PDF] Verificando disponibilidade do Sharing...');
        const isAvailable = await Sharing.isAvailableAsync();
        console.log('📄 [PDF] Sharing disponível:', isAvailable);
        
        if (isAvailable) {
          console.log('📄 [PDF] Compartilhando PDF no mobile');
          try {
            await Sharing.shareAsync(uri, {
              mimeType: 'application/pdf',
              dialogTitle: `Crediário - ${clienteNome}`,
            });
            console.log('📄 [PDF] Compartilhamento realizado com sucesso');
          } catch (shareError) {
            console.error('📄 [PDF] Erro no compartilhamento:', shareError);
            Alert.alert(
              'Erro no Compartilhamento', 
              `Não foi possível compartilhar o PDF.\n\nErro: ${shareError.message}\n\nPDF gerado em: ${uri}`
            );
          }
        } else {
          console.log('📄 [PDF] Sharing não disponível');
          
          // Tentar abrir o arquivo diretamente
          try {
            console.log('📄 [PDF] Tentando abrir arquivo diretamente...');
            const { WebBrowser } = await import('expo-web-browser');
            await WebBrowser.openBrowserAsync(uri);
            console.log('📄 [PDF] Arquivo aberto no navegador');
          } catch (browserError) {
            console.error('📄 [PDF] Erro ao abrir no navegador:', browserError);
            Alert.alert(
              'PDF Gerado', 
              `PDF gerado com sucesso!\n\nLocalização: ${uri}\n\nO compartilhamento não está disponível neste dispositivo.`
            );
          }
        }
      }
    } catch (error) {
      console.error('📄 [PDF] Erro completo ao gerar PDF:', error);
      console.error('📄 [PDF] Stack trace:', error.stack);
      console.error('📄 [PDF] Tipo do erro:', typeof error);
      console.error('📄 [PDF] Nome do erro:', error.name);
      console.error('📄 [PDF] Mensagem do erro:', error.message);
      console.error('📄 [PDF] Propriedades do erro:', Object.keys(error));
      
      // Mostrar erro mais detalhado
      const errorMessage = error.message || error.toString();
      Alert.alert(
        'Erro ao Gerar PDF', 
        `Detalhes do erro:\n${errorMessage}\n\nPlataforma: ${Platform.OS}\n\nVerifique o console para mais informações.`
      );
      
      throw new Error(`Erro ao gerar PDF: ${errorMessage}`);
    }
  }

  static async gerarRelatorioGeral(
    stats: any,
    parcelasAtrasadas: any[],
    todosCrediarios: any[],
    todosClientes: any[],
    todasParcelas: any[],
    config?: ConfiguracaoEmpresa
  ): Promise<void> {
    try {
      console.log('📊 [PDF] Gerando relatório PDF com dados:', { 
        stats, 
        parcelasAtrasadas: parcelasAtrasadas.length,
        todosCrediarios: todosCrediarios.length,
        todosClientes: todosClientes.length,
        todasParcelas: todasParcelas.length,
        platform: Platform.OS
      });
      
      const htmlContent = this.gerarHTMLRelatorio(stats, parcelasAtrasadas, todosCrediarios, todosClientes, todasParcelas, config);
      console.log('📊 [PDF] HTML do relatório gerado, tamanho:', htmlContent.length);
      
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 612,
        height: 792,
        margins: {
          left: 20,
          top: 20,
          right: 20,
          bottom: 20,
        },
      });
      
      console.log('📊 [PDF] Relatório PDF gerado:', uri);

      if (Platform.OS === 'web') {
        console.log('📊 [PDF] Processando download para web...');
        try {
          const response = await fetch(uri);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `relatorio-geral-${new Date().toISOString().split('T')[0]}.pdf`;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
          }, 1000);
          
          console.log('📊 [PDF] Download do relatório realizado com sucesso');
          
        } catch (error) {
          console.error('📊 [PDF] Erro no download do relatório:', error);
          const newWindow = window.open(uri, '_blank');
          if (!newWindow) {
            Alert.alert('PDF Gerado', `Relatório gerado!\n\nClique no link: ${uri}`);
          }
        }
      } else {
        console.log('📊 [PDF] Processando compartilhamento mobile...');
        const isAvailable = await Sharing.isAvailableAsync();
        console.log('📊 [PDF] Sharing disponível para relatório:', isAvailable);
        
        if (isAvailable) {
          try {
            await Sharing.shareAsync(uri, {
              mimeType: 'application/pdf',
              dialogTitle: 'Relatório Geral',
            });
            console.log('📊 [PDF] Relatório compartilhado com sucesso');
          } catch (shareError) {
            console.error('📊 [PDF] Erro no compartilhamento do relatório:', shareError);
            Alert.alert(
              'Erro no Compartilhamento', 
              `Não foi possível compartilhar o relatório.\n\nErro: ${shareError.message}`
            );
          }
        } else {
          console.log('📊 [PDF] Sharing não disponível, tentando alternativa...');
          try {
            const { WebBrowser } = await import('expo-web-browser');
            await WebBrowser.openBrowserAsync(uri);
            console.log('📊 [PDF] Relatório aberto no navegador');
          } catch (browserError) {
            console.error('📊 [PDF] Erro ao abrir relatório no navegador:', browserError);
            Alert.alert('PDF Gerado', `Relatório gerado em: ${uri}`);
          }
        }
      }
    } catch (error) {
      console.error('📊 [PDF] Erro ao gerar relatório PDF:', error);
      Alert.alert(
        'Erro no Relatório', 
        `Erro ao gerar relatório PDF.\n\nDetalhes: ${error.message}\n\nPlataforma: ${Platform.OS}`
      );
      throw new Error(`Erro ao gerar relatório PDF: ${error.message}`);
    }
  }

  private static gerarHTMLParcelas(crediario: Crediario, parcelas: Parcela[], clienteNome: string, config?: ConfiguracaoEmpresa): string {
    console.log('📄 [PDF] Gerando HTML para parcelas...');
    console.log('📄 [PDF] Número de parcelas:', parcelas.length);
    console.log('📄 [PDF] Cliente:', clienteNome);
    console.log('📄 [PDF] Config disponível:', !!config);
    
    // Agrupar parcelas em grupos de 3 para cada página
    const parcelasPorPagina = 3;
    const paginas = [];
    
    for (let i = 0; i < parcelas.length; i += parcelasPorPagina) {
      const parcelasDaPagina = parcelas.slice(i, i + parcelasPorPagina);
      const paginaHTML = this.gerarHTMLPagina(crediario, parcelasDaPagina, clienteNome, config);
      paginas.push(paginaHTML);
    }
    
    const parcelasHTML = paginas.join('');
    
    console.log('📄 [PDF] HTML das parcelas gerado, tamanho:', parcelasHTML.length);
    
    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Crediário - ${clienteNome}</title>
          <style>
            @page { 
              size: A4 landscape;
              margin: 8mm;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: Arial, sans-serif; 
              font-size: 9px;
              line-height: 1.1;
              color: #000;
            }
            
            .pagina-container {
              width: 100%;
              height: 100vh;
              display: flex;
              flex-direction: column;
              gap: 3mm;
              page-break-after: always;
              page-break-inside: avoid;
            }
            
            .pagina-container:last-child {
              page-break-after: avoid;
            }
            
            .linha-boletos {
              height: 60mm;
              display: flex;
              gap: 3mm;
              flex-shrink: 0;
            }
            
            .via-container { 
              flex: 1;
              height: 100%;
              border: 1.5px solid #000; 
              display: flex;
              flex-direction: column;
              background: white;
              min-width: 0;
            }
            
            .via-header {
              background-color: #f8f8f8;
              border-bottom: 1.5px solid #000;
              padding: 2mm;
              text-align: center;
              font-weight: bold;
              font-size: 10px;
              min-height: 12mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            
            .via-tipo {
              font-size: 7px;
              font-weight: normal;
              background: #000;
              color: white;
              padding: 1mm 2mm;
              border-radius: 2px;
            }
            
            .via-body {
              flex: 1;
              padding: 2mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              min-height: 0;
            }
            
            .info-section {
              flex-shrink: 0;
            }
            
            .info-row {
              display: flex;
              margin-bottom: 2mm;
              align-items: center;
            }
            
            .info-label {
              font-weight: bold;
              min-width: 18mm;
              font-size: 8px;
              flex-shrink: 0;
            }
            
            .info-value {
              flex: 1;
              border-bottom: 1px solid #000;
              padding: 0.5mm 1mm;
              margin-right: 2mm;
              font-size: 8px;
              min-height: 4mm;
              display: flex;
              align-items: center;
            }
            
            .info-row-double {
              display: flex;
              margin-bottom: 2mm;
              gap: 2mm;
            }
            
            .info-group {
              flex: 1;
              display: flex;
              align-items: center;
              min-width: 0;
            }
            
            .valor-section {
              text-align: center;
              margin: 2mm 0;
              border: 1.5px solid #000;
              padding: 2mm;
              background-color: #f9f9f9;
              flex-shrink: 0;
            }
            
            .valor-label {
              font-size: 7px;
              font-weight: bold;
              margin-bottom: 1mm;
            }
            
            .valor-amount {
              font-size: 11px;
              font-weight: bold;
              border-bottom: 1.5px solid #000;
              padding-bottom: 1mm;
              display: inline-block;
              min-width: 25mm;
            }
            
            .assinatura-section {
              margin-top: auto;
              padding-top: 2mm;
              flex-shrink: 0;
              min-height: 12mm;
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
            }
            
            .assinatura-line {
              border-top: 1px solid #000;
              margin: 2mm auto 1mm;
              width: 35mm;
            }
            
            .assinatura-text {
              text-align: center;
              font-size: 7px;
              margin-bottom: 1mm;
            }
            
            .empresa-info {
              font-size: 6px;
              text-align: center;
              margin-top: 1mm;
              color: #666;
              border-top: 1px solid #ccc;
              padding-top: 1mm;
            }
            
            .codigo-section {
              margin: 2mm 0;
              text-align: center;
              border: 1px solid #000;
              padding: 1mm;
              background: #f5f5f5;
              flex-shrink: 0;
            }
            
            .codigo-label {
              font-size: 6px;
              margin-bottom: 0.5mm;
            }
            
            .codigo-numero {
              font-family: 'Courier New', monospace;
              font-size: 7px;
              font-weight: bold;
            }
            
            .empresa-nome {
              font-size: 10px;
              font-weight: bold;
              margin-bottom: 1mm;
            }
            
            .empresa-contato {
              font-size: 7px;
              font-weight: normal;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${parcelasHTML}
        </body>
      </html>
    `;
    
    console.log('📄 [PDF] HTML completo gerado, tamanho final:', fullHTML.length);
    return fullHTML;
  }

  private static gerarHTMLPagina(crediario: Crediario, parcelas: Parcela[], clienteNome: string, config?: ConfiguracaoEmpresa): string {
    const linhasHTML = parcelas.map(parcela => 
      this.gerarHTMLLinhaBoleto(crediario, parcela, clienteNome, config)
    ).join('');
    
    return `
      <div class="pagina-container">
        ${linhasHTML}
      </div>
    `;
  }

  private static gerarHTMLLinhaBoleto(crediario: Crediario, parcela: Parcela, clienteNome: string, config?: ConfiguracaoEmpresa): string {
    const dataVencimento = new Date(parcela.data_vencimento).toLocaleDateString('pt-BR');
    const dataEmissao = new Date(crediario.data_emissao).toLocaleDateString('pt-BR');
    const codigoDocumento = `${crediario.id || '000'}${parcela.numero_parcela.toString().padStart(2, '0')}`;
    
    const nomeEmpresa = config?.nome || 'PARINTINS TECIDOS LTDA.';
    const enderecoEmpresa = config?.endereco || 'Parintins - AM';
    const telefoneEmpresa = config?.telefone || '(92) 99999-9999';
    
    const gerarViaContent = () => `
      <div class="via-container">
        <div class="via-header">
          <div class="empresa-nome">${nomeEmpresa}</div>
          <div class="empresa-contato">${enderecoEmpresa} | Tel: ${telefoneEmpresa}</div>
        </div>
        
        <div class="via-body">
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Cliente:</span>
              <span class="info-value">${clienteNome.toUpperCase()}</span>
            </div>
            
            <div class="info-row-double">
              <div class="info-group">
                <span class="info-label">Emissão:</span>
                <span class="info-value">${dataEmissao}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Parcela:</span>
                <span class="info-value">${parcela.numero_parcela}/${crediario.numero_parcelas}</span>
              </div>
            </div>
            
            <div class="info-row-double">
              <div class="info-group">
                <span class="info-label">Vencimento:</span>
                <span class="info-value">${dataVencimento}</span>
              </div>
              <div class="info-group">
                <span class="info-label">Juros/Dia:</span>
                <span class="info-value">R$ ${crediario.juros_diario.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="codigo-section">
              <div class="codigo-label">Código do Documento</div>
              <div class="codigo-numero">${codigoDocumento}</div>
            </div>
            
            <div class="valor-section">
              <div class="valor-label">Valor do documento</div>
              <div class="valor-amount">R$ ${parcela.valor_original.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    return `
      <div class="linha-boletos">
        ${gerarViaContent()}
        ${gerarViaContent()}
      </div>
    `;
  }

  private static gerarHTMLParcela(crediario: Crediario, parcela: Parcela, clienteNome: string, isLast: boolean = false, config?: ConfiguracaoEmpresa): string {
    // Método mantido para compatibilidade, mas agora usa o novo sistema
    return this.gerarHTMLLinhaBoleto(crediario, parcela, clienteNome, config);
  }

  private static gerarCodigoBarras(): { barras: string; numero: string } {
    const numero = '00190000' + Math.random().toString().slice(2, 8);
    const barras = '||||  ||  ||||  ||  ||  ||||  ||  ||||  ||  ||||  ||  ||||';
    
    return { barras, numero };
  }

  private static gerarHTMLRelatorio(
    stats: any,
    parcelasAtrasadas: any[],
    todosCrediarios: any[],
    todosClientes: any[],
    todasParcelas: any[],
    config?: ConfiguracaoEmpresa
  ): string {
    console.log('🔧 Gerando HTML do relatório completo com TODOS os dados');
    
    const nomeEmpresa = config?.nome || 'CASA SÃO FRANCISCO';
    const enderecoEmpresa = config?.endereco || 'Parintins - AM';
    const telefoneEmpresa = config?.telefone || '(92) 99999-9999';
    const dataRelatorio = new Date().toLocaleDateString('pt-BR');
    
    const formatCurrency = (value: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };
    
    const formatDateBR = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    };
    
    const calcularDiasAtraso = (dataVencimento: string): number => {
      const hoje = new Date();
      const vencimento = new Date(dataVencimento);
      const diffTime = hoje.getTime() - vencimento.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    };
    
    // Agrupar dados por cliente
    const clientesComDados = todosClientes.map(cliente => {
      const crediariosCliente = todosCrediarios.filter(c => c.cliente_id === cliente.id);
      const parcelasCliente = todasParcelas.filter(p => 
        crediariosCliente.some(c => c.id === p.crediario_id)
      );
      
      const parcelasPagas = parcelasCliente.filter(p => p.status === 'paga');
      const parcelasAbertas = parcelasCliente.filter(p => p.status === 'pendente');
      const parcelasAtrasadasCliente = parcelasAbertas.filter(p => calcularDiasAtraso(p.data_vencimento) > 0);
      
      const valorTotalCliente = crediariosCliente.reduce((sum, c) => sum + (c.valor_total || 0), 0);
      const valorPagoCliente = parcelasPagas.reduce((sum, p) => sum + (p.valor_pago || p.valor_original || 0), 0);
      const valorAbertoCliente = parcelasAbertas.reduce((sum, p) => sum + (p.valor_original || 0), 0);
      const valorAtrasadoCliente = parcelasAtrasadasCliente.reduce((sum, p) => {
        const diasAtraso = calcularDiasAtraso(p.data_vencimento);
        const crediario = crediariosCliente.find(c => c.id === p.crediario_id);
        const juros = diasAtraso * (crediario?.juros_diario || 0);
        return sum + (p.valor_original || 0) + juros;
      }, 0);
      
      return {
        ...cliente,
        crediarios: crediariosCliente,
        parcelas: parcelasCliente,
        parcelasPagas: parcelasPagas.length,
        parcelasAbertas: parcelasAbertas.length,
        parcelasAtrasadas: parcelasAtrasadasCliente.length,
        valorTotal: valorTotalCliente,
        valorPago: valorPagoCliente,
        valorAberto: valorAbertoCliente,
        valorAtrasado: valorAtrasadoCliente,
        situacao: parcelasAtrasadasCliente.length > 0 ? 'Em Atraso' : 
                 parcelasAbertas.length > 0 ? 'Em Dia' : 'Quitado'
      };
    });
    
    // Calcular totais gerais
    const totalGeralCrediarios = clientesComDados.reduce((sum, c) => sum + c.valorTotal, 0);
    const totalGeralPago = clientesComDados.reduce((sum, c) => sum + c.valorPago, 0);
    const totalGeralAberto = clientesComDados.reduce((sum, c) => sum + c.valorAberto, 0);
    const totalGeralAtrasado = clientesComDados.reduce((sum, c) => sum + c.valorAtrasado, 0);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Relatório Geral - ${nomeEmpresa}</title>
          <style>
            @page { 
              size: A4;
              margin: 20mm;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: Arial, sans-serif; 
              font-size: 12px;
              line-height: 1.4;
              color: #000;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #000;
              padding-bottom: 20px;
            }
            
            .company-name {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .company-info {
              font-size: 12px;
              margin-bottom: 10px;
            }
            
            .report-title {
              font-size: 16px;
              font-weight: bold;
              margin-top: 15px;
            }
            
            .report-date {
              font-size: 10px;
              color: #666;
            }
            
            .section {
              margin-bottom: 25px;
            }
            
            .section-title {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 10px;
              background-color: #f0f0f0;
              padding: 8px;
              border-left: 4px solid #2563eb;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            
            .stat-box {
              border: 1px solid #ddd;
              padding: 15px;
              text-align: center;
              background-color: #f9f9f9;
            }
            
            .stat-value {
              font-size: 18px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 5px;
            }
            
            .stat-label {
              font-size: 10px;
              color: #666;
            }
            
            .financial-summary {
              border: 1px solid #ddd;
              padding: 15px;
              background-color: #f9f9f9;
            }
            
            .financial-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding: 5px 0;
              border-bottom: 1px dotted #ccc;
            }
            
            .financial-label {
              font-weight: bold;
            }
            
            .financial-value {
              font-weight: bold;
            }
            
            .valor-total { color: #374151; }
            .valor-pago { color: #059669; }
            .valor-aberto { color: #f59e0b; }
            .valor-atrasado { color: #dc2626; }
            
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 9px;
            }
            
            .data-table th,
            .data-table td {
              border: 1px solid #ddd;
              padding: 6px;
              text-align: left;
            }
            
            .data-table th {
              background-color: #f0f0f0;
              font-weight: bold;
              font-size: 8px;
            }
            
            .status-badge {
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 8px;
              font-weight: bold;
              text-align: center;
            }
            
            .status-quitado {
              background-color: #f0f9ff;
              color: #059669;
            }
            
            .status-em-dia {
              background-color: #fef3c7;
              color: #f59e0b;
            }
            
            .status-atrasado {
              background-color: #fef2f2;
              color: #dc2626;
            }
            
            .page-break {
              page-break-before: always;
            }
            
            .cliente-section {
              margin-bottom: 20px;
              border: 1px solid #ddd;
              padding: 10px;
              background-color: #f9f9f9;
            }
            
            .cliente-header {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 8px;
              color: #2563eb;
            }
            
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 15px;
            }
            
            .crediario-details {
              margin-top: 10px;
              background-color: #fff;
              padding: 10px;
              border-radius: 5px;
            }
            
            .crediario-header {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 8px;
              color: #374151;
              background-color: #f3f4f6;
              padding: 5px;
            }
            
            .parcela-row {
              display: flex;
              justify-content: space-between;
              padding: 3px 0;
              border-bottom: 1px dotted #eee;
              font-size: 10px;
            }
            
            .parcela-info {
              flex: 1;
            }
            
            .parcela-valor {
              font-weight: bold;
            }
            
            .parcela-paga {
              color: #059669;
            }
            
            .parcela-pendente {
              color: #f59e0b;
            }
            
            .parcela-atrasada {
              color: #dc2626;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${nomeEmpresa}</div>
            <div class="company-info">${enderecoEmpresa} | Tel: ${telefoneEmpresa}</div>
            <div class="report-title">RELATÓRIO GERAL DO SISTEMA</div>
            <div class="report-date">Gerado em: ${dataRelatorio}</div>
          </div>
          
          <div class="section">
            <div class="section-title">📊 Estatísticas Gerais</div>
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-value">${stats.totalClientes || 0}</div>
                <div class="stat-label">Total de Clientes</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${stats.totalCrediarios || 0}</div>
                <div class="stat-label">Total de Crediários</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${stats.parcelasEmAberto || 0}</div>
                <div class="stat-label">Parcelas em Aberto</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">💰 Resumo Financeiro</div>
            <div class="financial-summary">
              <div class="financial-row">
                <span class="financial-label">Valor Total dos Crediários:</span>
                <span class="financial-value valor-total">${formatCurrency(stats.valorTotalCrediarios || 0)}</span>
              </div>
              <div class="financial-row">
                <span class="financial-label">Valor Total Pago:</span>
                <span class="financial-value valor-pago">${formatCurrency(stats.valorTotalPago || 0)}</span>
              </div>
              <div class="financial-row">
                <span class="financial-label">Valor Total em Aberto:</span>
                <span class="financial-value valor-aberto">${formatCurrency(stats.valorTotalEmAberto || 0)}</span>
              </div>
              <div class="financial-row" style="border-top: 2px solid #000; margin-top: 10px; padding-top: 10px;">
                <span class="financial-label">📈 Taxa de Inadimplência:</span>
                <span class="financial-value">${totalGeralCrediarios > 0 ? ((totalGeralAtrasado / totalGeralCrediarios) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          </div>
          
          ${parcelasAtrasadas.length > 0 ? `
          <div class="section page-break">
            <div class="section-title">⚠️ Resumo de Parcelas Atrasadas (${parcelasAtrasadas.length})</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Parcela</th>
                  <th>Vencimento</th>
                  <th>Valor Original</th>
                  <th>Dias Atraso</th>
                  <th>Valor com Juros</th>
                </tr>
              </thead>
              <tbody>
                ${parcelasAtrasadas.map(parcela => {
                  const diasAtraso = calcularDiasAtraso(parcela.data_vencimento);
                  const valorComJuros = (parcela.valor_original || 0) + (diasAtraso * (parcela.juros_diario || 0));
                  return `
                    <tr>
                      <td>${parcela.cliente_nome || 'N/A'}</td>
                      <td>${parcela.numero_parcela || 'N/A'}</td>
                      <td>${formatDateBR(parcela.data_vencimento)}</td>
                      <td>${formatCurrency(parcela.valor_original || 0)}</td>
                      <td><span class="status-badge status-atrasado">${diasAtraso} dias</span></td>
                      <td>${formatCurrency(valorComJuros)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
          
          <div class="section page-break">
            <div class="section-title">👥 Relatório Completo por Cliente (${clientesComDados.length})</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Telefone</th>
                  <th>Crediários</th>
                  <th>Parcelas Pagas</th>
                  <th>Parcelas Abertas</th>
                  <th>Valor Total</th>
                  <th>Valor Pago</th>
                  <th>Valor Aberto</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                ${clientesComDados.map(cliente => `
                  <tr>
                    <td><strong>${cliente.nome}</strong></td>
                    <td>${cliente.telefone || '-'}</td>
                    <td>${cliente.crediarios.length}</td>
                    <td>${cliente.parcelasPagas}</td>
                    <td>${cliente.parcelasAbertas}</td>
                    <td>${formatCurrency(cliente.valorTotal)}</td>
                    <td class="valor-pago">${formatCurrency(cliente.valorPago)}</td>
                    <td class="valor-aberto">${formatCurrency(cliente.valorAberto)}</td>
                    <td>
                      <span class="status-badge ${
                        cliente.situacao === 'Quitado' ? 'status-quitado' :
                        cliente.situacao === 'Em Dia' ? 'status-em-dia' : 'status-atrasado'
                      }">
                        ${cliente.situacao}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="section page-break">
            <div class="section-title">📋 Detalhamento por Cliente</div>
            ${clientesComDados.map(cliente => `
              <div class="cliente-section">
                <div class="cliente-header">
                  👤 ${cliente.nome} ${cliente.telefone ? `- ${cliente.telefone}` : ''}
                  <span style="float: right; color: ${
                    cliente.situacao === 'Quitado' ? '#059669' :
                    cliente.situacao === 'Em Dia' ? '#f59e0b' : '#dc2626'
                  };">${cliente.situacao}</span>
                </div>
                
                ${cliente.endereco ? `<p style="font-size: 10px; margin-bottom: 8px;">📍 ${cliente.endereco}</p>` : ''}
                
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 10px;">
                  <div style="text-align: center; background: #f0f9ff; padding: 5px; border-radius: 4px;">
                    <div style="font-size: 14px; font-weight: bold; color: #2563eb;">${cliente.crediarios.length}</div>
                    <div style="font-size: 8px; color: #6b7280;">Crediários</div>
                  </div>
                  <div style="text-align: center; background: #f0fdf4; padding: 5px; border-radius: 4px;">
                    <div style="font-size: 14px; font-weight: bold; color: #059669;">${formatCurrency(cliente.valorPago)}</div>
                    <div style="font-size: 8px; color: #6b7280;">Valor Pago</div>
                  </div>
                  <div style="text-align: center; background: #fffbeb; padding: 5px; border-radius: 4px;">
                    <div style="font-size: 14px; font-weight: bold; color: #f59e0b;">${formatCurrency(cliente.valorAberto)}</div>
                    <div style="font-size: 8px; color: #6b7280;">Valor Aberto</div>
                  </div>
                  <div style="text-align: center; background: ${cliente.parcelasAtrasadas > 0 ? '#fef2f2' : '#f9fafb'}; padding: 5px; border-radius: 4px;">
                    <div style="font-size: 14px; font-weight: bold; color: ${cliente.parcelasAtrasadas > 0 ? '#dc2626' : '#6b7280'};">${cliente.parcelasAtrasadas}</div>
                    <div style="font-size: 8px; color: #6b7280;">Atrasadas</div>
                  </div>
                </div>
                
                ${cliente.crediarios.length > 0 ? `
                  <table class="data-table" style="margin-top: 8px;">
                    <thead>
                      <tr>
                        <th>Data Emissão</th>
                        <th>Valor Total</th>
                        <th>Parcelas</th>
                        <th>Valor Parcela</th>
                        <th>Juros/Dia</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${cliente.crediarios.map(crediario => {
                        const parcelasCrediario = cliente.parcelas.filter(p => p.crediario_id === crediario.id);
                        const parcelasPagasCrediario = parcelasCrediario.filter(p => p.status === 'paga').length;
                        const statusCrediario = parcelasPagasCrediario === crediario.numero_parcelas ? 'Quitado' : 
                                              parcelasCrediario.some(p => p.status === 'pendente' && calcularDiasAtraso(p.data_vencimento) > 0) ? 'Em Atraso' : 'Em Dia';
                        
                        return `
                          <tr>
                            <td>${formatDateBR(crediario.data_emissao)}</td>
                            <td>${formatCurrency(crediario.valor_total)}</td>
                            <td>${parcelasPagasCrediario}/${crediario.numero_parcelas}</td>
                            <td>${formatCurrency(crediario.valor_parcela)}</td>
                            <td>${formatCurrency(crediario.juros_diario)}</td>
                            <td>
                              <span class="status-badge ${
                                statusCrediario === 'Quitado' ? 'status-quitado' :
                                statusCrediario === 'Em Dia' ? 'status-em-dia' : 'status-atrasado'
                              }">
                                ${statusCrediario}
                              </span>
                            </td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                ` : ''}
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            <p>Relatório gerado automaticamente pelo Sistema de Crediário</p>
            <p>${config?.avisoPersonalizado || 'Sistema desenvolvido para controle de vendas a prazo'}</p>
            <p><strong>Total de páginas:</strong> Este relatório contém informações detalhadas de todos os ${clientesComDados.length} clientes cadastrados</p>
          </div>
        </body>
      </html>
    `;
  }
}