// MelaminaMaterialsPage.tsx
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Container,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useMaterialStore, Material } from '../store/materialStore';
import { MaterialItem } from '../models/Interfaces';
import { saveMaterial, fetchMaterials, updateMaterialInFirestore } from '../services/materialService';

// Initial form state
const initialFormState: Omit<MaterialItem, 'precioM2' | 'precioML'> = {
  id: '',
  precioHoja: 0,
  med1: 0,
  med2: 0,
  material: '',
  isTube: false
};

// Memoized Table Row Component
interface MaterialRowProps {
  item: Material;
  onClick: (id: string) => void;
}

const MaterialRow = memo(({ item, onClick }: MaterialRowProps) => (
  <TableRow hover onClick={() => onClick(item.id)} sx={{ cursor: 'pointer' }}>
    <TableCell>{item.precioHoja}</TableCell>
    <TableCell>{item.med1}</TableCell>
    <TableCell>{item.isTube ? '-' : item.med2}</TableCell>
    <TableCell>{item.material}</TableCell>
    <TableCell>{item.isTube ? (item.precioML ?? 0) : item.precioM2}</TableCell>
    <TableCell>{item.isTube ? 'Tubo' : 'Hoja'}</TableCell>
  </TableRow>
));

MaterialRow.displayName = 'MaterialRow';

// Helper function to calculate price per M2
const calculatePrecioM2 = (precioHoja: number, med1: number, med2: number): number => {
  const area = med1 * med2;
  return area > 0 ? parseFloat((precioHoja / area).toFixed(6)) : 0;
};

// Helper function to calculate price per linear meter (for tubes)
const calculatePrecioML = (precioHoja: number, med1: number): number => {
  return med1 > 0 ? parseFloat((precioHoja / med1).toFixed(6)) : 0;
};

export const MelaminaMaterialsPage: React.FC = () => {
  const [form, setForm] = useState(initialFormState);
  const [material, setMaterial] = useState(initialFormState);
  const [editIndex, setEditIndex] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Store selectors
  const materiales = useMaterialStore((state) => state.materiales);
  const addMaterial = useMaterialStore((state) => state.addMaterial);
  const updateMaterial = useMaterialStore((state) => state.updateMaterial);
  const setMateriales = useMaterialStore((state) => state.setMateriales);

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const loaded = await fetchMaterials();
        setMateriales(loaded);
      } catch (error) {
        console.error("Error cargando materiales:", error);
      }
    };
    loadMaterials();
  }, [setMateriales]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'material' ? value : parseFloat(value))
    }));
  }, []);

  const handleChangeModel = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setMaterial((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'material' ? value : parseFloat(value))
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    const isTube = form.isTube || false;
    const precioM2 = isTube ? 0 : calculatePrecioM2(form.precioHoja, form.med1, form.med2);
    const precioML = isTube ? calculatePrecioML(form.precioHoja, form.med1) : 0;
    const nuevo = { 
      ...form, 
      precioM2, 
      precioML,
      med2: isTube ? 0 : form.med2 
    };

    try {
      const generatedId = await saveMaterial(nuevo);
      addMaterial({ ...nuevo, id: generatedId });
      setForm(initialFormState);
    } catch (error) {
      console.error('Error al guardar el material:', error);
    }
  }, [form, addMaterial]);

  const handleRowClick = useCallback((id: string) => {
    const item = materiales.find(mat => mat.id === id);
    if (!item) return;
    setMaterial({
      id: item.id,
      precioHoja: item.precioHoja,
      med1: item.med1,
      med2: item.med2,
      material: item.material,
      isTube: item.isTube || false
    });
    setEditIndex(id);
    setEditOpen(true);
  }, [materiales]);

  const handleUpdate = useCallback(async () => {
    if (editIndex === null) return;

    const isTube = material.isTube || false;
    const precioM2 = isTube ? 0 : calculatePrecioM2(material.precioHoja, material.med1, material.med2);
    const precioML = isTube ? calculatePrecioML(material.precioHoja, material.med1) : 0;
    const actualizado = {
      precioHoja: material.precioHoja,
      med1: material.med1,
      med2: isTube ? 0 : material.med2,
      material: material.material,
      precioM2,
      precioML,
      isTube
    };

    try {
      await updateMaterialInFirestore(editIndex, actualizado);
      updateMaterial(editIndex, actualizado);
      setEditOpen(false);
      setEditIndex(null);
      setForm(initialFormState);
    } catch (error) {
      console.error("Error actualizando material en Firestore:", error);
    }
  }, [editIndex, material, updateMaterial]);

  const handleCancelEdit = useCallback(() => {
    setEditOpen(false);
    setEditIndex(null);
    setForm(initialFormState);
  }, []);

  // Memoized calculated precioM2/precioML for form display
  const formPrecioM2 = useMemo(() => 
    form.isTube ? 0 : calculatePrecioM2(form.precioHoja, form.med1, form.med2)
  , [form.precioHoja, form.med1, form.med2, form.isTube]);

  const formPrecioML = useMemo(() => 
    form.isTube ? calculatePrecioML(form.precioHoja, form.med1) : 0
  , [form.precioHoja, form.med1, form.isTube]);

  // Memoized table rows
  const tableRows = useMemo(() => 
    materiales.map((item) => (
      <MaterialRow 
        key={item.id} 
        item={item} 
        onClick={handleRowClick} 
      />
    ))
  , [materiales, handleRowClick]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Crear Material de Melamina
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                name="isTube"
                checked={form.isTube || false}
                onChange={handleChange}
              />
            }
            label="Es Tubo (metro lineal)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label={form.isTube ? "PRECIO TUBO" : "PRECIO HOJA"}
            name="precioHoja"
            value={form.precioHoja}
            onChange={handleChange}
            type="number"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label={form.isTube ? "LARGO (m)" : "MED1"}
            name="med1"
            value={form.med1}
            onChange={handleChange}
            type="number"
          />
        </Grid>
        {!form.isTube && (
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="MED2"
              name="med2"
              value={form.med2}
              onChange={handleChange}
              type="number"
            />
          </Grid>
        )}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="MATERIAL"
            name="material"
            value={form.material}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label={form.isTube ? "P/ML" : "P/M2"}
            value={form.isTube ? formPrecioML : formPrecioM2}
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Agregar Material
          </Button>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom>
        Lista de Materiales
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>PRECIO</TableCell>
              <TableCell>MED1</TableCell>
              <TableCell>MED2</TableCell>
              <TableCell>MATERIAL</TableCell>
              <TableCell>P/M2 o P/ML</TableCell>
              <TableCell>TIPO</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editOpen} onClose={handleCancelEdit}>
        <DialogTitle>Editar Material</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="isTube"
                    checked={material.isTube || false}
                    onChange={handleChangeModel}
                  />
                }
                label="Es Tubo (metro lineal)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={material.isTube ? "PRECIO TUBO" : "PRECIO HOJA"}
                name="precioHoja"
                value={material.precioHoja}
                onChange={handleChangeModel}
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={material.isTube ? "LARGO (m)" : "MED1"}
                name="med1"
                value={material.med1}
                onChange={handleChangeModel}
                type="number"
              />
            </Grid>
            {!material.isTube && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="MED2"
                  name="med2"
                  value={material.med2}
                  onChange={handleChangeModel}
                  type="number"
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="MATERIAL"
                name="material"
                value={material.material}
                onChange={handleChangeModel}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>Cancelar</Button>
          <Button onClick={handleUpdate} variant="contained">Actualizar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
