import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportElementToPdf(element: HTMLElement | null, filename: string) {
  if (!element) return;
  
  const pages = Array.from(element.querySelectorAll('.pdf-page')) as HTMLElement[];
  
  if (pages.length === 0) {
    // Fallback: renderizar o elemento inteiro e fatiar em A4
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(filename);
    return;
  }
  
  // Renderizar cada .pdf-page como uma página A4 padrão
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'pt',
    format: 'a4'
  });
  
  for (let i = 0; i < pages.length; i++) {
    const pageElement = pages[i];
    
    // Temporariamente forçar a exibição (caso esteja oculto via pdf-only) para o renderizador
    const originalStyleDisplay = pageElement.style.display;
    if (pageElement.classList.contains('pdf-only')) {
      pageElement.style.setProperty('display', 'flex', 'important');
    }
    
    const canvas = await html2canvas(pageElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });
    
    pageElement.style.display = originalStyleDisplay;
    
    const imgData = canvas.toDataURL('image/png');
    
    // Adicionar uma nova página A4 a partir da segunda iteração
    if (i > 0) {
      pdf.addPage('a4', 'p');
    }
    
    // Obter as dimensões da página A4 em pontos (pt)
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Calcular as dimensões da imagem no PDF preservando o aspect ratio (sem esticar)
    const imgRatio = canvas.width / canvas.height;
    const pageRatio = pageWidth / pageHeight;
    
    let renderWidth = pageWidth;
    let renderHeight = pageHeight;
    let x = 0;
    let y = 0;
    
    if (imgRatio > pageRatio) {
      // Mais larga que a proporção da página: ajustar pela largura e centralizar verticalmente
      renderWidth = pageWidth;
      renderHeight = pageWidth / imgRatio;
      y = (pageHeight - renderHeight) / 2;
    } else {
      // Mais alta que a proporção da página: ajustar pela altura e centralizar horizontalmente
      renderHeight = pageHeight;
      renderWidth = pageHeight * imgRatio;
      x = (pageWidth - renderWidth) / 2;
    }
    
    pdf.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight);
  }
  
  pdf.save(filename);
}
