import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import {
  Container,
  Typography,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button
} from '@mui/material';
import { useCotizacionStore } from '../store/cotizacionStore';
import { useAccessoryStore } from '../store/accessoryStore';
import { useCotizacionGlobalStore } from '../store/finalCotizacion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { EstanteItem, Accessory } from '../models/Interfaces';

interface CotizacionPreviewProps {
  isEdit?: boolean;
}

// Memoized Pieza Row
interface PiezaRowProps {
  item: EstanteItem;
}

const PiezaRow = memo(({ item }: PiezaRowProps) => (
  <TableRow>
    <TableCell>{item.cantidad}</TableCell>
    <TableCell>{item.pieza}</TableCell>
    <TableCell>{item.material}</TableCell>
    <TableCell>{item.ancho}</TableCell>
    <TableCell>{item.largo}</TableCell>
    <TableCell>{item.precioM2}</TableCell>
    <TableCell>{item.precioUnitario}</TableCell>
    <TableCell>{item.precioTotal}</TableCell>
  </TableRow>
));

PiezaRow.displayName = 'PiezaRow';

// Memoized Accesorio Row
interface AccesorioRowProps {
  item: Accessory;
}

const AccesorioRow = memo(({ item }: AccesorioRowProps) => (
  <TableRow>
    <TableCell>{item.cantidad}</TableCell>
    <TableCell>{item.nombre}</TableCell>
    <TableCell>{item.precioUnitario}</TableCell>
    <TableCell>{item.precioTotal}</TableCell>
  </TableRow>
));

AccesorioRow.displayName = 'AccesorioRow';

export const CotizacionPreview: React.FC<CotizacionPreviewProps> = ({ isEdit }) => {
  // Store selectors
  const piezas = useCotizacionStore((state) => state.items);
  const dimensiones = useCotizacionStore((state) => state.dimensiones);
  const accesorios = useAccessoryStore((state) => state.items);
  const cotizacion = useCotizacionGlobalStore((state) => state.cotizacion);
  const setCotizacion = useCotizacionGlobalStore((state) => state.setCotizacion);

  const [nombre, setNombre] = useState(isEdit ? cotizacion.nombre : '');
  const componentRef = useRef<HTMLDivElement>(null);

  // Memoized calculations
  const calculations = useMemo(() => {
    const totalEstantes = piezas.reduce((acc, item) => acc + item.precioTotal, 0);
    const totalAccesorios = accesorios.reduce((acc, item) => acc + item.precioTotal, 0);
    const newTotal = totalEstantes + totalAccesorios;
    const precioConIva = newTotal * 2.5;
    const calculoManoObra = newTotal + (newTotal * 0.05);
    const precioDeVenta = newTotal + calculoManoObra;

    return {
      total: newTotal,
      manoDeObra: calculoManoObra,
      precioVenta: precioDeVenta,
      precioVentaConIva: precioConIva
    };
  }, [piezas, accesorios]);

  // Update cotizacion store only when necessary data changes
  useEffect(() => {
    setCotizacion({
      id: isEdit && cotizacion.id ? cotizacion.id : '',
      nombre,
      piezas,
      accesorios,
      manoDeObra: calculations.manoDeObra,
      total: calculations.total,
      precioVenta: calculations.precioVenta,
      precioVentaConIva: calculations.precioVentaConIva,
      dimensiones
    });
  }, [
    nombre, 
    piezas, 
    accesorios, 
    calculations, 
    dimensiones, 
    setCotizacion, 
    isEdit, 
    cotizacion.id
  ]);

  const handleNombreChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNombre(e.target.value);
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!componentRef.current) return;
    const element = componentRef.current;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 40;

    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth - 2 * margin;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    pdf.save(`${nombre || 'cotizacion'}.pdf`);
  }, [nombre]);

  // Memoized pieza rows
  const piezaRows = useMemo(() => 
    piezas.map((item) => (
      <PiezaRow key={item.id} item={item} />
    ))
  , [piezas]);

  // Memoized accesorio rows
  const accesorioRows = useMemo(() => 
    accesorios.map((item) => (
      <AccesorioRow key={item.id} item={item} />
    ))
  , [accesorios]);

  return (
    <Container sx={{ py: 4 }}>
      <Button variant="contained" sx={{ mb: 2 }} onClick={handleDownloadPdf}>
        Descargar PDF
      </Button>
      <div ref={componentRef}>
        <Typography variant="h4" gutterBottom>Resumen de Cotización</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Nombre de la Cotización"
              type="text"
              value={nombre}
              onChange={handleNombreChange}
            />
          </Grid>
        </Grid>

        <Typography variant="h6">Piezas</Typography>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cantidad</TableCell>
                <TableCell>Pieza</TableCell>
                <TableCell>Material</TableCell>
                <TableCell>Ancho</TableCell>
                <TableCell>Largo</TableCell>
                <TableCell>P/M2</TableCell>
                <TableCell>P/Unitario</TableCell>
                <TableCell>P/Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {piezaRows}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6">Accesorios</Typography>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cantidad</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Precio Unitario</TableCell>
                <TableCell>Precio Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accesorioRows}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="h6">Totales</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Typography>Total: ${calculations.total.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography>Mano de Obra: ${calculations.manoDeObra.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography>Precio de Venta: ${calculations.precioVenta.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography>Precio de Venta con IVA: ${calculations.precioVentaConIva.toFixed(2)}</Typography>
          </Grid>
        </Grid>
      </div>
    </Container>
  );
};
