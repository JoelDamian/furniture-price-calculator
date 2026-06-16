import React, { useCallback, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
  buildFinanzasReport,
  FinanzasReportData,
  formatReportCurrency,
  formatReportDate,
  getOrgLabel,
} from '../../../utils/finanzasReportUtils';
import { downloadFinanzasReportPdf } from '../../../utils/finanzasReportPdf';
import { fetchAllFinanzas } from '../../../services/finanzasService';
import { fetchEmployees } from '../../../services/employeesService';

export const FinanzasReporteTab: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState<FinanzasReportData | null>(null);

  const datesValid = Boolean(startDate && endDate && startDate <= endDate);

  const handleGenerateReport = useCallback(async () => {
    if (!datesValid) return;

    const [finanzas, employees] = await Promise.all([
      fetchAllFinanzas(),
      fetchEmployees(),
    ]);

    setReport(buildFinanzasReport(startDate, endDate, finanzas, employees));
  }, [datesValid, endDate, startDate]);

  const handleDownloadPdf = useCallback(() => {
    if (!report) return;
    downloadFinanzasReportPdf(report);
  }, [report]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Reporte financiero</Typography>
        {report && (
          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={handleDownloadPdf}
          >
            Descargar PDF
          </Button>
        )}
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label="Fecha inicio"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setReport(null);
            }}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label="Fecha fin"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setReport(null);
            }}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="contained"
            onClick={handleGenerateReport}
            disabled={!datesValid}
            fullWidth
          >
            Generar reporte
          </Button>
        </Grid>
      </Grid>

      {startDate && endDate && startDate > endDate && (
        <Alert severity="error" sx={{ mb: 2 }}>
          La fecha de inicio debe ser anterior o igual a la fecha de fin.
        </Alert>
      )}

      {!report && (
        <Alert severity="info">
          Selecciona un rango de fechas y genera el reporte. Se incluirán proyectos
          iniciados y finalizados en ese periodo, y pagos a empleados cuyo periodo
          coincida con el rango seleccionado.
        </Alert>
      )}

      {report && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Proyectos finalizados
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Proyectos iniciados y terminados entre {formatReportDate(report.startDate)} y{' '}
              {formatReportDate(report.endDate)}.
            </Typography>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Proyecto</TableCell>
                    <TableCell>Área</TableCell>
                    <TableCell>Inicio</TableCell>
                    <TableCell>Fin</TableCell>
                    <TableCell align="right">Gasto total</TableCell>
                    <TableCell align="right">Ganancia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.projects.length ? (
                    report.projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>{project.name}</TableCell>
                        <TableCell>{getOrgLabel(project.idOrg)}</TableCell>
                        <TableCell>{formatReportDate(project.createdAt)}</TableCell>
                        <TableCell>{formatReportDate(project.finishedAt ?? '')}</TableCell>
                        <TableCell align="right">
                          Bs. {formatReportCurrency(project.gastoTotal)}
                        </TableCell>
                        <TableCell align="right">
                          Bs. {formatReportCurrency(project.ganancia)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No hay proyectos en este periodo
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Pagos a empleados
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Período</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell align="right">Monto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {report.employeePayments.length ? (
                    report.employeePayments.map((item) => (
                      <TableRow key={`${item.employeeId}-${item.payment.id}`}>
                        <TableCell>{item.employeeName}</TableCell>
                        <TableCell>
                          {formatReportDate(item.payment.startDate)} -{' '}
                          {formatReportDate(item.payment.endDate)}
                        </TableCell>
                        <TableCell>{item.payment.description}</TableCell>
                        <TableCell align="right">
                          Bs. {formatReportCurrency(item.payment.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No hay pagos en este periodo
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resumen financiero
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxWidth: 420 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Gastos por proyecto</Typography>
                <Typography>Bs. {formatReportCurrency(report.summary.totalProjectExpenses)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Ganancia bruta de proyectos</Typography>
                <Typography>Bs. {formatReportCurrency(report.summary.totalProjectProfit)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Gastos en salarios</Typography>
                <Typography>Bs. {formatReportCurrency(report.summary.totalSalaryExpenses)}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Ganancia neta
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  Bs. {formatReportCurrency(report.summary.netProfit)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};
