import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface DatosContrato {
  arrendatario: string;
  cabana: string;
  celular: string;
  fechaInicio: Date;
  fechaFin: Date;
  valorMensual: number;
  comentarios?: string;
}

export function generarContratoArrendamiento(datos: DatosContrato): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const lineHeight = 4.5;
  let currentY = 20;

  // Configurar fuente
  doc.setFont('helvetica');

  // Título del contrato
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRATO DE ARRENDAMIENTO MENSUAL', pageWidth / 2, currentY, { align: 'center' });
  currentY += lineHeight * 2;

  // Datos del contrato con texto más compacto
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const textoContrato = `En Valdivia, ${format(new Date(), 'dd')} de ${format(new Date(), 'MMMM', { locale: es })} ${format(new Date(), 'yyyy')}, entre:

ARRENDADOR: Victor Eduardo Riquelme Varas, RUT: 6.888.787-9, domiciliado en José Maria Muñoz Hermosilla 252, Valdivia, teléfono +56 9 9699 2369.

ARRENDATARIO: ${datos.arrendatario.toUpperCase()}, teléfono +56 9 ${datos.celular}.

PRIMERA: El arrendador da en arrendamiento la propiedad "${datos.cabana}", ubicada en José Maria Muñoz Hermosilla 252, Valdivia, Chile, para habitación exclusiva.

SEGUNDA: Plazo desde el ${format(datos.fechaInicio, 'dd/MM/yyyy')} hasta el ${format(datos.fechaFin, 'dd/MM/yyyy')}.

TERCERA: Renta mensual de $${datos.valorMensual.toLocaleString('es-CL')} (${numeroALetras(datos.valorMensual)} pesos), pagadera los primeros 5 días de cada mes.

CUARTA: La propiedad se entrega en perfecto estado, comprometiéndose el arrendatario a devolverla en iguales condiciones.

QUINTA: Obligaciones del arrendatario: pagar puntualmente, cuidar como buen padre de familia, no subarrendar sin autorización, permitir inspecciones con aviso previo.

SEXTA: El contrato termina por vencimiento del plazo, mutuo acuerdo o incumplimiento.
${datos.comentarios ? `
OBSERVACIONES: ${datos.comentarios}` : ''}

Las partes firman en duplicado.`;

  // Calcular el espacio disponible para el contenido
  const espacioDisponible = pageHeight - currentY - 60; // 60 para firmas
  const maxWidth = pageWidth - (margin * 2);

  // Dividir el texto en líneas que se ajusten al ancho
  const lines = doc.splitTextToSize(textoContrato.trim(), maxWidth);
  
  // Calcular si necesitamos ajustar el interlineado
  const espacioNecesario = lines.length * lineHeight;
  const lineHeightAjustado = espacioNecesario > espacioDisponible ? 
    Math.max(3.8, espacioDisponible / lines.length) : lineHeight;

  // Renderizar las líneas sin permitir salto de página
  lines.forEach((line: string) => {
    if (line.trim() !== '') {
      doc.text(line, margin, currentY);
    }
    currentY += lineHeightAjustado;
  });

  // Asegurar espacio mínimo para firmas
  const espacioMinimo = pageHeight - 50;
  if (currentY < espacioMinimo) {
    currentY = espacioMinimo;
  }

  // Firmas en la parte inferior
  currentY += 10;
  doc.setFontSize(8);
  
  // Líneas de firma
  const firmaY = currentY;
  const firmaWidth = 60;
  const firmaArrendadorX = margin + 10;
  const firmaArrendatarioX = pageWidth - margin - firmaWidth - 10;
  
  // Líneas para firmas
  doc.line(firmaArrendadorX, firmaY, firmaArrendadorX + firmaWidth, firmaY);
  doc.line(firmaArrendatarioX, firmaY, firmaArrendatarioX + firmaWidth, firmaY);
  
  // Textos de firma
  doc.text('ARRENDADOR', firmaArrendadorX + firmaWidth/2, firmaY + 5, { align: 'center' });
  doc.text('ARRENDATARIO', firmaArrendatarioX + firmaWidth/2, firmaY + 5, { align: 'center' });
  
  doc.text('Victor Eduardo Riquelme Varas', firmaArrendadorX + firmaWidth/2, firmaY + 9, { align: 'center' });
  doc.text(datos.arrendatario, firmaArrendatarioX + firmaWidth/2, firmaY + 9, { align: 'center' });
  
  doc.text('RUT: 6.888.787-9', firmaArrendadorX + firmaWidth/2, firmaY + 13, { align: 'center' });
  doc.text(`Tel: +56 9 ${datos.celular}`, firmaArrendatarioX + firmaWidth/2, firmaY + 13, { align: 'center' });

  // Generar y descargar el PDF
  const nombreArchivo = `Contrato_${datos.cabana.replace(/\s+/g, '_')}_${datos.arrendatario.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(nombreArchivo);
}

// Función auxiliar para convertir números a letras (simplificada)
function numeroALetras(numero: number): string {
  const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const centenas = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  if (numero === 0) return 'cero';
  if (numero < 10) return unidades[numero];
  if (numero < 100) {
    const decena = Math.floor(numero / 10);
    const unidad = numero % 10;
    if (numero >= 11 && numero <= 15) {
      const especiales = ['once', 'doce', 'trece', 'catorce', 'quince'];
      return especiales[numero - 11];
    }
    if (numero >= 16 && numero <= 19) {
      return 'dieci' + unidades[unidad];
    }
    if (numero >= 21 && numero <= 29) {
      return 'veinti' + unidades[unidad];
    }
    return decenas[decena] + (unidad > 0 ? ' y ' + unidades[unidad] : '');
  }
  if (numero < 1000) {
    const centena = Math.floor(numero / 100);
    const resto = numero % 100;
    return centenas[centena] + (resto > 0 ? ' ' + numeroALetras(resto) : '');
  }
  
  // Para números más grandes, simplificar
  if (numero >= 1000 && numero < 1000000) {
    const miles = Math.floor(numero / 1000);
    const resto = numero % 1000;
    const textoMiles = miles === 1 ? 'mil' : numeroALetras(miles) + ' mil';
    return textoMiles + (resto > 0 ? ' ' + numeroALetras(resto) : '');
  }
  
  return numero.toString(); // Fallback para números muy grandes
}