import React, { useEffect, useState } from 'react';
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

export const CotizacionPreview: React.FC = () => {
  const { items: piezas } = useCotizacionStore();
  const { items: accesorios } = useAccessoryStore();
  const [manoDeObra, setManoDeObra] = useState(0);
  const [nombre, setNombre] = useState('');
  const [total, setTotal] = useState(0);
  const [precioVenta, setPrecioVenta] = useState(0);
  const [precioVentaConIva, setPrecioVentaConIva] = useState(0);
  const { setCotizacion } = useCotizacionGlobalStore();

  useEffect(() => {
    const totalEstantes = piezas.reduce((acc, item) => acc + item.precioTotal, 0);
    const totalAccesorios = accesorios.reduce((acc, item) => acc + item.precioTotal, 0);
    const newTotal = totalEstantes + totalAccesorios + manoDeObra;
    const precioDeVenta = newTotal * 2;
    const mO = precioDeVenta - (totalEstantes + totalAccesorios);
    setTotal(newTotal);
    setPrecioVenta(precioDeVenta);
    setPrecioVentaConIva(newTotal * 2.5);
    setManoDeObra(mO);
    setCotizacion({
      id: '',
      nombre: '',
      piezas: piezas,
      accesorios,
      manoDeObra: manoDeObra,
      total: newTotal,
      precioVenta,
      precioVentaConIva,
    });
  }, [piezas, accesorios, manoDeObra]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Resumen de Cotización</Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Nombre de la Cotización"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
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
            {piezas.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.cantidad}</TableCell>
                <TableCell>{item.pieza}</TableCell>
                <TableCell>{item.material}</TableCell>
                <TableCell>{item.ancho}</TableCell>
                <TableCell>{item.largo}</TableCell>
                <TableCell>{item.precioM2}</TableCell>
                <TableCell>{item.precioUnitario}</TableCell>
                <TableCell>{item.precioTotal}</TableCell>
              </TableRow>
            ))}
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
            {accesorios.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.cantidad}</TableCell>
                <TableCell>{item.nombre}</TableCell>
                <TableCell>{item.precioUnitario}</TableCell>
                <TableCell>{item.precioTotal}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>


      <Typography variant="h6">Totales</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Typography>Total: ${total.toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography>Mano de Obra: ${manoDeObra.toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography>Precio de Venta: ${precioVenta.toFixed(2)}</Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography>Precio de Venta con IVA: ${precioVentaConIva.toFixed(2)}</Typography>
        </Grid>
      </Grid>
    </Container>
  );
};
