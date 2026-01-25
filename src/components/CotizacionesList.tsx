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
  Checkbox,
  FormControlLabel,
  List,
  ListItem
} from '@mui/material';
import { Cotizacion, MaterialItem } from '../models/Interfaces';
import { fetchCotizaciones, deleteCotizacionInFirestore, saveCotizacion } from '../services/cotizacionService';
import { useCotizacionStore } from '../store/cotizacionStore';
import { useAccessoryStore } from '../store/accessoryStore';
import { useCotizacionGlobalStore } from '../store/finalCotizacion';
import { useNavigate } from 'react-router-dom';
import { agruparPiezasPorMaterial, agruparPiezasPorMaterialDeVariasCotizaciones } from '../utils/groupByMaterial';
import { optimizarMelamina } from "../utils/optimizerMelamina";
import { useMaterialStore } from '../store/materialStore';
import { DuplicateCotizacionDialog } from './DuplicateCotizacionDialog';

// Memoized Table Row Component
interface CotizacionRowProps {
  cotizacion: Cotizacion;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (cotizacion: Cotizacion) => void;
  onDuplicate: (cotizacion: Cotizacion) => void;
  onOptimize: (cotizacion: Cotizacion) => void;
  onDelete: (cotizacion: Cotizacion) => void;
}

const CotizacionRow = memo(({ 
  cotizacion, 
  isSelected, 
  onToggleSelect, 
  onEdit, 
  onDuplicate,
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
      <Button onClick={() => onDuplicate(cotizacion)} color="secondary">Duplicar</Button>
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
  const [openDuplicate, setOpenDuplicate] = useState(false);
  const [cotizacionToDuplicate, setCotizacionToDuplicate] = useState<Cotizacion | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  // State for optimization modal
  const [openOptimizeModal, setOpenOptimizeModal] = useState(false);
  const [cotizacionToOptimize, setCotizacionToOptimize] = useState<Cotizacion | null>(null);
  const [materialesConBetas, setMaterialesConBetas] = useState<Record<string, boolean>>({});
  const [isMultipleOptimization, setIsMultipleOptimization] = useState(false);

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

  const handleDuplicateRequest = useCallback((cotizacion: Cotizacion) => {
    setCotizacionToDuplicate(cotizacion);
    setOpenDuplicate(true);
  }, []);

  const handleConfirmDuplicate = useCallback(async () => {
    if (!cotizacionToDuplicate) return;

    try {
      const duplicated: Cotizacion = {
        ...cotizacionToDuplicate,
        id: '',
        nombre: `Copy ${cotizacionToDuplicate.nombre}`,
      };

      const newId = await saveCotizacion(duplicated);

      if (newId) {
        setCotizaciones((prev) => {
          const next = prev ?? [];
          return [{ ...duplicated, id: newId }, ...next];
        });
      } else {
        const datos = await fetchCotizaciones();
        setCotizaciones(datos);
      }
    } catch (error) {
      console.error('Error duplicando la cotización:', error);
    } finally {
      setOpenDuplicate(false);
      setCotizacionToDuplicate(null);
    }
  }, [cotizacionToDuplicate]);

  const handleCancelDuplicate = useCallback(() => {
    setOpenDuplicate(false);
    setCotizacionToDuplicate(null);
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

  const handleOptimizarClick = useCallback((cotizacion: Cotizacion) => {
    // Get materials from this cotizacion (filter out tubes)
    const grupos = agruparPiezasPorMaterial(cotizacion);
    const materialesInicial: Record<string, boolean> = {};
    Object.keys(grupos).forEach((material) => {
      // Only include non-tube materials for optimization
      const materialData = materialInfo[material];
      if (!materialData?.isTube) {
        materialesInicial[material] = false;
      }
    });
    setMaterialesConBetas(materialesInicial);
    setCotizacionToOptimize(cotizacion);
    setIsMultipleOptimization(false);
    setOpenOptimizeModal(true);
  }, [materialInfo]);

  const handleToggleBeta = useCallback((material: string) => {
    setMaterialesConBetas((prev) => ({
      ...prev,
      [material]: !prev[material],
    }));
  }, []);

  const handleCancelOptimize = useCallback(() => {
    setOpenOptimizeModal(false);
    setCotizacionToOptimize(null);
    setMaterialesConBetas({});
  }, []);

  // Calculate tube requirements
  const calcularTubos = useCallback((grupos: Record<string, import('../models/Interfaces').EstanteItem[]>) => {
    const tubeResults: { material: string; totalLargo: number; tubeLength: number; tubosNecesarios: number; piezas: { pieza: string; largo: number; cantidad: number }[] }[] = [];

    Object.entries(grupos).forEach(([material, piezas]) => {
      const materialData = materialInfo[material];
      
      if (!materialData || !materialData.isTube) {
        return;
      }

      const tubeLength = materialData.med1; // Length of one tube
      let totalLargo = 0;
      const piezasInfo: { pieza: string; largo: number; cantidad: number }[] = [];

      piezas.forEach((pieza) => {
        // For tubes, use largo if non-zero, otherwise use ancho (user might enter length in either field)
        const piezaLargo = pieza.largo > 0 ? pieza.largo : pieza.ancho;
        const largoTotal = piezaLargo * pieza.cantidad;
        totalLargo += largoTotal;
        piezasInfo.push({
          pieza: pieza.pieza,
          largo: piezaLargo,
          cantidad: pieza.cantidad
        });
      });

      const tubosNecesarios = Math.ceil(totalLargo / tubeLength);

      tubeResults.push({
        material,
        totalLargo,
        tubeLength,
        tubosNecesarios,
        piezas: piezasInfo
      });
    });

    return tubeResults;
  }, [materialInfo]);

  const handleConfirmOptimize = useCallback(() => {
    if (isMultipleOptimization) {
      // Multiple cotizaciones optimization
      if (!cotizaciones) return;

      const seleccionadas = cotizaciones.filter((c) =>
        selectedRows.includes(c.id)
      );
      const grupos = agruparPiezasPorMaterialDeVariasCotizaciones(seleccionadas);
      const resultadosTotales: { material: string; resultado: ReturnType<typeof optimizarMelamina> }[] = [];

      // Calculate tube requirements
      const tubosRequeridos = calcularTubos(grupos);

      Object.entries(grupos).forEach(([material, piezas]) => {
        const materialData = materialInfo[material];

        if (!materialData) {
          console.error(`❌ No existe información para el material: ${material}`);
          return;
        }

        // Skip tube materials - they don't need optimization
        if (materialData.isTube) {
          return;
        }

        // If material has betas, don't allow rotation (rotate = false)
        const allowRotation = !materialesConBetas[material];
        const resultado = optimizarMelamina(materialData, piezas, allowRotation);
        resultadosTotales.push({
          material,
          resultado,
        });
      });

      setOpenOptimizeModal(false);
      setCotizacionToOptimize(null);
      setMaterialesConBetas({});
      navigate("/planos", { state: { planos: resultadosTotales, tubos: tubosRequeridos } });
    } else {
      // Single cotizacion optimization
      if (!cotizacionToOptimize) return;

      const grupos = agruparPiezasPorMaterial(cotizacionToOptimize);
      const resultadosTotales: { material: string; resultado: ReturnType<typeof optimizarMelamina> }[] = [];

      // Calculate tube requirements
      const tubosRequeridos = calcularTubos(grupos);

      Object.entries(grupos).forEach(([material, piezas]) => {
        const materialData = materialInfo[material];

        if (!materialData) {
          console.error(`❌ No existe información para el material: ${material}`);
          return;
        }

        // Skip tube materials - they don't need optimization
        if (materialData.isTube) {
          return;
        }

        // If material has betas, don't allow rotation (rotate = false)
        const allowRotation = !materialesConBetas[material];
        const resultado = optimizarMelamina(materialData, piezas, allowRotation);
        resultadosTotales.push({
          material,
          resultado,
        });
      });

      setOpenOptimizeModal(false);
      setCotizacionToOptimize(null);
      setMaterialesConBetas({});
      navigate("/planos", { state: { planos: resultadosTotales, tubos: tubosRequeridos } });
    }
  }, [isMultipleOptimization, cotizaciones, selectedRows, cotizacionToOptimize, materialInfo, materialesConBetas, calcularTubos, navigate]);

  const handleOptimizarVariasClick = useCallback(() => {
    if (!cotizaciones) return;

    const seleccionadas = cotizaciones.filter((c) =>
      selectedRows.includes(c.id)
    );
    const grupos = agruparPiezasPorMaterialDeVariasCotizaciones(seleccionadas);
    const materialesInicial: Record<string, boolean> = {};
    Object.keys(grupos).forEach((material) => {
      // Only include non-tube materials for optimization
      const materialData = materialInfo[material];
      if (!materialData?.isTube) {
        materialesInicial[material] = false;
      }
    });
    setMaterialesConBetas(materialesInicial);
    setIsMultipleOptimization(true);
    setOpenOptimizeModal(true);
  }, [cotizaciones, selectedRows, materialInfo]);

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
        onDuplicate={handleDuplicateRequest}
        onOptimize={handleOptimizarClick}
        onDelete={handleDeleteClick}
      />
    ))
  , [filteredCotizaciones, selectedRows, toggleSelect, handleRowClick, handleDuplicateRequest, handleOptimizarClick, handleDeleteClick]);

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
          onClick={handleOptimizarVariasClick}
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

      {/* Modal de confirmación de eliminación */}
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

      <DuplicateCotizacionDialog
        open={openDuplicate}
        onCancel={handleCancelDuplicate}
        onConfirm={handleConfirmDuplicate}
      />

      {/* Modal de optimización con selección de betas */}
      <Dialog open={openOptimizeModal} onClose={handleCancelOptimize}>
        <DialogTitle>Configuración de Optimización</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Selecciona los materiales que tienen betas (vetas). Los materiales con betas no se rotarán durante la optimización.
          </DialogContentText>
          <List>
            {Object.keys(materialesConBetas).map((material) => (
              <ListItem key={material} disablePadding>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={materialesConBetas[material]}
                      onChange={() => handleToggleBeta(material)}
                    />
                  }
                  label={`${material} - ¿Tiene betas?`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelOptimize}>Cancelar</Button>
          <Button onClick={handleConfirmOptimize} color="primary" variant="contained">
            Optimizar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
