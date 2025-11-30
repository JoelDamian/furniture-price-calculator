import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
  TextField,
  Checkbox
} from '@mui/material';
import { Cotizacion, MaterialItem } from '../models/Interfaces';
import { fetchCotizaciones, deleteCotizacionInFirestore } from '../services/cotizacionService';
import { useCotizacionStore } from '../store/cotizacionStore';
import { useAccessoryStore } from '../store/accessoryStore';
import { useCotizacionGlobalStore } from '../store/finalCotizacion';
import { useNavigate } from 'react-router-dom';
import { agruparPiezasPorMaterial, agruparPiezasPorMaterialDeVariasCotizaciones } from '../utils/groupByMaterial';
import { optimizarMelamina } from "../utils/optimizerMelamina";
import { useMaterialStore } from '../store/materialStore';

// Memoized Table Row Component
interface CotizacionRowProps {
  cotizacion: Cotizacion;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (cotizacion: Cotizacion) => void;
  onOptimize: (cotizacion: Cotizacion) => void;
  onDelete: (cotizacion: Cotizacion) => void;
}

const CotizacionRow = memo(({ 
  cotizacion, 
  isSelected, 
  onToggleSelect, 
  onEdit, 
  onOptimize, 
  onDelete 
}: CotizacionRowProps) => (
  <TableRow>
    <TableCell>
      <Checkbox
        checked={isSelected}
        onChange={() => onToggleSelect(cotizacion.id)}
      />
    </TableCell>
    <TableCell>{cotizacion.nombre}</TableCell>
    <TableCell>{cotizacion.total.toFixed(2)}</TableCell>
    <TableCell>{cotizacion.manoDeObra.toFixed(2)}</TableCell>
    <TableCell>{cotizacion.precioVenta.toFixed(2)}</TableCell>
    <TableCell>{cotizacion.precioVentaConIva.toFixed(2)}</TableCell>
    <TableCell>
      <Button onClick={() => onEdit(cotizacion)}>Editar</Button>
      <Button onClick={() => onOptimize(cotizacion)} color="primary">Optimizar</Button>
      <Button color="error" onClick={() => onDelete(cotizacion)}>Eliminar</Button>
    </TableCell>
  </TableRow>
));

CotizacionRow.displayName = 'CotizacionRow';

// Build material info helper
const buildMaterialInfo = (materiales: MaterialItem[]): Record<string, MaterialItem> => {
  const info: Record<string, MaterialItem> = {};
  materiales.forEach((m) => {
    info[m.material] = m;
  });
  return info;
};

export const CotizacionesList: React.FC = () => {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[] | undefined>([]);
  const [selectedCotizacion, setSelectedCotizacion] = useState<Cotizacion | null>(null);
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Store selectors
  const addListItem = useCotizacionStore((state) => state.addListItem);
  const setDimensiones = useCotizacionStore((state) => state.setDimensiones);
  const addListAccessories = useAccessoryStore((state) => state.addListAccessories);
  const setCotizacion = useCotizacionGlobalStore((state) => state.setCotizacion);
  const materiales = useMaterialStore((state) => state.materiales);
  
  const navigate = useNavigate();

  useEffect(() => {
    const loadCotizaciones = async () => {
      const datos = await fetchCotizaciones();
      setCotizaciones(datos);
    };
    loadCotizaciones();
  }, []);

  // Memoized filtered cotizaciones
  const filteredCotizaciones = useMemo(() => 
    cotizaciones?.filter(c =>
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    ) || []
  , [cotizaciones, searchTerm]);

  // Memoized material info
  const materialInfo = useMemo(() => 
    buildMaterialInfo(materiales)
  , [materiales]);

  const handleRowClick = useCallback((cotizacion: Cotizacion) => {
    addListItem(cotizacion.piezas);
    addListAccessories(cotizacion.accesorios);
    setCotizacion(cotizacion);
    setDimensiones(cotizacion.dimensiones);
    navigate('/cotizacion', { state: { isEdit: true } });
  }, [addListItem, addListAccessories, setCotizacion, setDimensiones, navigate]);

  const handleDeleteClick = useCallback((cotizacion: Cotizacion) => {
    setSelectedCotizacion(cotizacion);
    setOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
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
  }, [selectedCotizacion]);

  const handleCancelDelete = useCallback(() => {
    setOpen(false);
    setSelectedCotizacion(null);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }, []);

  const handleOptimizar = useCallback((cotizacion: Cotizacion) => {
    const grupos = agruparPiezasPorMaterial(cotizacion);
    const resultadosTotales: { material: string; resultado: ReturnType<typeof optimizarMelamina> }[] = [];

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

    navigate("/planos", { state: { planos: resultadosTotales } });
  }, [materialInfo, navigate]);

  const handleOptimizarVarias = useCallback(() => {
    if (!cotizaciones) return;

    const seleccionadas = cotizaciones.filter((c) =>
      selectedRows.includes(c.id)
    );
    const grupos = agruparPiezasPorMaterialDeVariasCotizaciones(seleccionadas);
    const resultadosTotales: { material: string; resultado: ReturnType<typeof optimizarMelamina> }[] = [];

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

    navigate("/planos", { state: { planos: resultadosTotales } });
  }, [cotizaciones, selectedRows, materialInfo, navigate]);

  // Memoized check if multiple selected
  const hasMultipleSelected = useMemo(() => 
    selectedRows.length > 1
  , [selectedRows.length]);

  // Memoized rows
  const tableRows = useMemo(() => 
    filteredCotizaciones.map((c) => (
      <CotizacionRow
        key={c.id}
        cotizacion={c}
        isSelected={selectedRows.includes(c.id)}
        onToggleSelect={toggleSelect}
        onEdit={handleRowClick}
        onOptimize={handleOptimizar}
        onDelete={handleDeleteClick}
      />
    ))
  , [filteredCotizaciones, selectedRows, toggleSelect, handleRowClick, handleOptimizar, handleDeleteClick]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Lista de Cotizaciones</Typography>

      <TextField
        fullWidth
        label="Buscar por nombre"
        variant="outlined"
        value={searchTerm}
        onChange={handleSearchChange}
        sx={{ mb: 3 }}
      />

      {hasMultipleSelected && (
        <Button
          variant="contained"
          color="secondary"
          sx={{ mt: 2 }}
          onClick={handleOptimizarVarias}
        >
          Generar Optimización
        </Button>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Mano de Obra</TableCell>
              <TableCell>Precio Venta</TableCell>
              <TableCell>Precio Venta + IVA</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows}
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
