// MelaminaMaterialsPage.tsx
import React, { useState } from 'react';
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
  DialogActions
} from '@mui/material';
import { useMaterialStore } from '../store/materialStore';

interface MaterialItem {
  id: string;
  precioHoja: number;
  med1: number;
  med2: number;
  material: string;
  precioM2: number;
}

export const MelaminaMaterialsPage: React.FC = () => {
  const [form, setForm] = useState<Omit<MaterialItem, 'precioM2'>>({
    id: '',
    precioHoja: 0,
    med1: 0,
    med2: 0,
    material: ''
  });

  const [material, setMaterial] = useState<Omit<MaterialItem, 'precioM2'>>({
    id: '',
    precioHoja: 0,
    med1: 0,
    med2: 0,
    material: ''
  });

  const [editIndex, setEditIndex] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const materiales = useMaterialStore((state) => state.materiales);
  const addMaterial = useMaterialStore((state) => state.addMaterial);
  const updateMaterial = useMaterialStore((state) => state.updateMaterial);

  const calculatePrecioM2 = (precioHoja: number, med1: number, med2: number): number => {
    const area = med1 * med2;
    return area > 0 ? parseFloat((precioHoja / area).toFixed(6)) : 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === 'material' ? value : parseFloat(value)
    });
  };

    const handleChangeModel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMaterial({
      ...material,
      [name]: name === 'material' ? value : parseFloat(value)
    });
  };

  const handleSubmit = () => {
    const precioM2 = calculatePrecioM2(form.precioHoja, form.med1, form.med2);
    const nuevo = { ...form, precioM2 };
    addMaterial(nuevo);
    setForm({ precioHoja: 0, med1: 0, med2: 0, material: '', id: '' });
  };

  const handleRowClick = (id: string) => {
    const item = materiales.find(mat => mat.id === id);
    if (!item) return;
    setMaterial({
      id: item.id,
      precioHoja: item.precioHoja,
      med1: item.med1,
      med2: item.med2,
      material: item.material
    });
    setEditIndex(id);
    setEditOpen(true);
  };

  const handleUpdate = () => {
    if (editIndex === null) return;
    const precioM2 = calculatePrecioM2(material.precioHoja, material.med1, material.med2);
    const actualizado = { ...material, precioM2 };
    updateMaterial(editIndex, actualizado);
    setEditOpen(false);
    setEditIndex(null);
    setForm({ precioHoja: 0, med1: 0, med2: 0, material: '', id: '' });
  };

  const handleCancelEdit = () => {
    setEditOpen(false);
    setEditIndex(null);
    setForm({ precioHoja: 0, med1: 0, med2: 0, material: '', id: '' });
  }

  const precioM2 = calculatePrecioM2(form.precioHoja, form.med1, form.med2);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Crear Material de Melamina
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="PRECIO HOJA"
            name="precioHoja"
            value={form.precioHoja}
            onChange={handleChange}
            type="number"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="MED1"
            name="med1"
            value={form.med1}
            onChange={handleChange}
            type="number"
          />
        </Grid>
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
            label="P/M2"
            value={precioM2}
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
              <TableCell>PRECIO HOJA</TableCell>
              <TableCell>MED1</TableCell>
              <TableCell>MED2</TableCell>
              <TableCell>MATERIAL</TableCell>
              <TableCell>P/M2</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materiales.map((item, index) => (
              <TableRow key={index} hover onClick={() => handleRowClick(item.id)}>
                <TableCell>{item.precioHoja}</TableCell>
                <TableCell>{item.med1}</TableCell>
                <TableCell>{item.med2}</TableCell>
                <TableCell>{item.material}</TableCell>
                <TableCell>{item.precioM2}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Editar Material</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="PRECIO HOJA"
                name="precioHoja"
                value={material.precioHoja}
                onChange={handleChangeModel}
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="MED1"
                name="med1"
                value={material.med1}
                onChange={handleChangeModel}
                type="number"
              />
            </Grid>
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
