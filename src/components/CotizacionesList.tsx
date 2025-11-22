import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import { Cotizacion, MaterialItem } from '../models/Interfaces';
import { fetchCotizaciones, deleteCotizacionInFirestore } from '../services/cotizacionService';
import { useCotizacionStore } from '../store/cotizacionStore';
import { useAccessoryStore } from '../store/accessoryStore';
import { useCotizacionGlobalStore } from '../store/finalCotizacion';
import { useNavigate } from 'react-router-dom';
import { agruparPiezasPorMaterial } from '../utils/groupByMaterial';
import { optimizarMelamina } from "../utils/optimizerMelamina";
import { useMaterialStore } from '../store/materialStore';

export const CotizacionesList: React.FC = () => {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[] | undefined>([]);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { addListItem, setDimensiones } = useCotizacionStore();
  const { addListAccessories } = useAccessoryStore();
  const { setCotizacion } = useCotizacionGlobalStore();
  const navigate = useNavigate();
  const materiales = useMaterialStore((state) => state.materiales);

  useEffect(() => {
    const loadCotizaciones = async () => {
      const datos = await fetchCotizaciones();
      setCotizaciones(datos);
    };

    loadCotizaciones();
  }, []);

  const handleRowClick = (cotizacion: Cotizacion) => {
    addListItem(cotizacion.piezas);
    addListAccessories(cotizacion.accesorios);
    setCotizacion(cotizacion);
    setDimensiones(cotizacion.dimensiones);
    navigate('/cotizacion', { state: { isEdit: true } });
  };

  const handleDeleteClick = (cotizacion: Cotizacion) => {
    setSelectedCotizacion(cotizacion);
    setOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCotizacion) return;

    try {
      await deleteCotizacionInFirestore(selectedCotizacion.id);
      setCotizaciones((prev) => prev?.filter((c) => c.id !== selectedCotizacion.id));
    } catch (error) {
      console.error('Error eliminando la cotización:', error);
    } finally {
      setOpen(false);
      setSelectedCotizacion(null);
    }
  };

  const handleCancelDelete = () => {
    setOpen(false);
    setSelectedCotizacion(null);
  };

  const filteredCotizaciones = cotizaciones?.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const buildMaterialInfo = (materiales: MaterialItem[]) => {
    const info: Record<string, MaterialItem> = {};

    materiales.forEach((m) => {
      info[m.material] = m; // clave = nombre del material
    });

    return info;
  };


  const handleOptimizar = (cotizacion: Cotizacion) => {
    const grupos = agruparPiezasPorMaterial(cotizacion);

    // Construimos materialInfo automáticamente
    const materialInfo = buildMaterialInfo(materiales);

    const resultadosTotales: any[] = [];

    Object.entries(grupos).forEach(([material, piezas]) => {
      const materialData = materialInfo[material];

      if (!materialData) {
        console.error(`❌ No existe información para el material: ${material}`);
        return;
      }

      const resultado = optimizarMelamina(materialData, piezas);

      resultadosTotales.push({
        material,
        resultado,
      });
    });

    // Enviar a la vista de planos
    navigate("/planos", { state: { planos: resultadosTotales } });
  };


  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Lista de Cotizaciones</Typography>

      <TextField
        fullWidth
        label="Buscar por nombre"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Mano de Obra</TableCell>
              <TableCell>Precio Venta</TableCell>
              <TableCell>Precio Venta + IVA</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCotizaciones?.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.nombre}</TableCell>
                <TableCell>{c.total.toFixed(2)}</TableCell>
                <TableCell>{c.manoDeObra.toFixed(2)}</TableCell>
                <TableCell>{c.precioVenta.toFixed(2)}</TableCell>
                <TableCell>{c.precioVentaConIva.toFixed(2)}</TableCell>
                <TableCell>
                  <Button onClick={() => handleRowClick(c)}>Editar</Button>
                  <Button onClick={() => handleOptimizar(c)} color="primary">Optimizar</Button>
                  <Button color="error" onClick={() => handleDeleteClick(c)}>Eliminar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal de confirmación */}
      <Dialog open={open} onClose={handleCancelDelete}>
        <DialogTitle>¿Eliminar cotización?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro que deseas eliminar la cotización <strong>{selectedCotizacion?.nombre}</strong>? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
