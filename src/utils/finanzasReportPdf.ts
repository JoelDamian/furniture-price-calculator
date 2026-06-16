import jsPDF from 'jspdf';
import {
  FinanzasReportData,
  formatReportCurrency,
  formatReportDate,
  getOrgLabel,
} from './finanzasReportUtils';

const PAGE_HEIGHT = 842;
const MARGIN = 40;
const LINE_HEIGHT = 16;

const addPageIfNeeded = (pdf: jsPDF, y: number, needed = LINE_HEIGHT): number => {
  if (y + needed > PAGE_HEIGHT - MARGIN) {
    pdf.addPage();
    return MARGIN;
  }
  return y;
};

const writeLine = (
  pdf: jsPDF,
  text: string,
  y: number,
  options?: { bold?: boolean; size?: number }
): number => {
  const size = options?.size ?? 11;
  pdf.setFont('helvetica', options?.bold ? 'bold' : 'normal');
  pdf.setFontSize(size);
  y = addPageIfNeeded(pdf, y);
  pdf.text(text, MARGIN, y);
  return y + LINE_HEIGHT;
};

export const downloadFinanzasReportPdf = (report: FinanzasReportData): void => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  let y = MARGIN;

  y = writeLine(pdf, 'Reporte financiero', y, { bold: true, size: 18 });
  y = writeLine(
    pdf,
    `Periodo: ${formatReportDate(report.startDate)} - ${formatReportDate(report.endDate)}`,
    y
  );
  y += 8;

  y = writeLine(pdf, 'Proyectos finalizados en el periodo', y, { bold: true, size: 13 });
  y += 4;

  if (report.projects.length === 0) {
    y = writeLine(pdf, 'No hay proyectos en este periodo.', y);
  } else {
    report.projects.forEach((project) => {
      y = writeLine(
        pdf,
        `${project.name} (${getOrgLabel(project.idOrg)})`,
        y,
        { bold: true }
      );
      y = writeLine(
        pdf,
        `  Inicio: ${formatReportDate(project.createdAt)} | Fin: ${formatReportDate(project.finishedAt ?? '')}`,
        y
      );
      y = writeLine(pdf, `  Gasto total: Bs. ${formatReportCurrency(project.gastoTotal)}`, y);
      y = writeLine(pdf, `  Ganancia: Bs. ${formatReportCurrency(project.ganancia)}`, y);
      y += 4;
    });
  }

  y += 8;
  y = writeLine(pdf, 'Pagos a empleados en el periodo', y, { bold: true, size: 13 });
  y += 4;

  if (report.employeePayments.length === 0) {
    y = writeLine(pdf, 'No hay pagos registrados en este periodo.', y);
  } else {
    report.employeePayments.forEach((item) => {
      y = writeLine(pdf, item.employeeName, y, { bold: true });
      y = writeLine(
        pdf,
        `  Periodo: ${formatReportDate(item.payment.startDate)} - ${formatReportDate(item.payment.endDate)}`,
        y
      );
      y = writeLine(pdf, `  Monto: Bs. ${formatReportCurrency(item.payment.amount)}`, y);
      y = writeLine(pdf, `  Descripcion: ${item.payment.description}`, y);
      y += 4;
    });
  }

  y += 8;
  y = writeLine(pdf, 'Resumen financiero', y, { bold: true, size: 13 });
  y += 4;
  y = writeLine(
    pdf,
    `Gastos por proyecto: Bs. ${formatReportCurrency(report.summary.totalProjectExpenses)}`,
    y
  );
  y = writeLine(
    pdf,
    `Ganancia bruta de proyectos: Bs. ${formatReportCurrency(report.summary.totalProjectProfit)}`,
    y
  );
  y = writeLine(
    pdf,
    `Gastos en salarios: Bs. ${formatReportCurrency(report.summary.totalSalaryExpenses)}`,
    y
  );
  y = writeLine(
    pdf,
    `Ganancia neta: Bs. ${formatReportCurrency(report.summary.netProfit)}`,
    y,
    { bold: true }
  );

  pdf.save(`reporte-financiero-${report.startDate}-${report.endDate}.pdf`);
};
