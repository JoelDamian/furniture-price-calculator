// FormCotizacion.tsx
import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    TextField,
    Button,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Autocomplete
} from '@mui/material';
import { useMaterialStore } from '../store/materialStore';
import { useCotizacionStore } from '../store/cotizacionStore';
import { EstanteItem } from '../models/Interfaces';

interface Dimensiones {
    ancho: number;
    alto: number;
    profundidad: number;
}

const piezaOptions = [
    'lateral', 'zocalo', 'base', 'fondo', 'puerta',
    'tapa de cajon', 'frente de cajon', 'laterales de cajon',
    'meson', 'repisa', 'puertas'
];

const tipoMuebleOptions = ['estante', 'gabinete'];

export const FormCotizacion: React.FC = () => {
    const materiales = useMaterialStore((state) => state.materiales);

    // Estado local para formulario, dimensiones y tipo de mueble
    const [furnitureType, setFurnitureType] = useState<string>('');
    const [dimensiones, setDimensiones] = useState<Dimensiones>({
        ancho: 0,
        alto: 0,
        profundidad: 0
    });
    const [form, setForm] = useState<Omit<EstanteItem, 'precioUnitario' | 'precioTotal' | 'tc'>>({
        id: '',
        cantidad: 0,
        pieza: '',
        material: '',
        ancho: 0,
        largo: 0,
        precioM2: 0,
        atc: 0,
        ltc: 0
    });

    // Store para la lista y manejo de items
    const {
        items,
        addItem,
        updateItem
    } = useCotizacionStore();

    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editOpen, setEditOpen] = useState<boolean>(false);

    // Sincronizar precioM2 desde materiales cuando cambie material
    useEffect(() => {
        const selected = materiales.find((m) => m.material === form.material);
        if (selected) {
            setForm((prev) => ({
                ...prev,
                precioM2: selected.precioM2
            }));
        }
    }, [form.material, materiales]);

    // Rellenado automático de ancho/largo en función del tipo de mueble/ pieza
    useEffect(() => {
        if (!furnitureType || !form.pieza) return;
        const { ancho, alto, profundidad } = dimensiones;
        const piezaLower = form.pieza.toLowerCase();

        if (furnitureType === 'estante') {
            if (['lateral', 'laterales'].includes(piezaLower)) {
                setForm((prev) => ({ ...prev, ancho: profundidad, largo: alto }));
            } else if (['base', 'repisa'].includes(piezaLower)) {
                setForm((prev) => ({ ...prev, ancho: ancho, largo: profundidad }));
            } else if (piezaLower === 'fondo') {
                setForm((prev) => ({ ...prev, ancho: ancho, largo: alto }));
            }
        } else if (furnitureType === 'gabinete') {
            if (piezaLower === 'lateral') {
                setForm((prev) => ({ ...prev, ancho: profundidad, largo: alto }));
            } else if (piezaLower === 'fondo') {
                setForm((prev) => ({ ...prev, ancho: ancho, largo: alto }));
            } else if (['base', 'repisa'].includes(piezaLower)) {
                setForm((prev) => ({ ...prev, ancho: ancho, largo: profundidad }));
            } else if (piezaLower === 'puertas') {
                setForm((prev) => ({ ...prev, ancho: ancho / 2, largo: alto }));
            }
        }
    }, [form.pieza, furnitureType, dimensiones]);

    const calcularPrecioUnitario = (ancho: number, largo: number, precioM2: number) => {
        const area = ancho * largo;
        return parseFloat((area * precioM2).toFixed(2));
    };

    const calcularTC = (cantidad: number, ancho: number, largo: number, atc: number = 0, ltc: number = 0) => {
        return cantidad * (ancho * atc + largo * ltc);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name as string]: name === 'material' ? (value as string) : parseFloat(value as string)
        });
    };

    const handleDimensionesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDimensiones((prev) => ({
            ...prev,
            [name]: parseFloat(value as string)
        }));
    };

    const handleAddItem = () => {
        const precioUnitario = calcularPrecioUnitario(form.ancho, form.largo, form.precioM2);
        const precioTotal = parseFloat((precioUnitario * form.cantidad).toFixed(2));
        const tc = calcularTC(form.cantidad, form.ancho, form.largo, form.atc || 0, form.ltc || 0);
        const nuevoItem: EstanteItem = {
            ...form,
            precioUnitario,
            precioTotal,
            tc: tc
        } as EstanteItem;  // Type assertion
        addItem(nuevoItem);

        // Reset formulario
        setForm({
            id: '',
            cantidad: 0,
            pieza: '',
            material: '',
            ancho: 0,
            largo: 0,
            precioM2: 0,
            atc: 0,
            ltc: 0
        });
    };

    const handleRowClick = (index: number) => {
        const item = items[index];
        setForm({
            id: item.id,
            cantidad: item.cantidad,
            pieza: item.pieza,
            material: item.material,
            ancho: item.ancho,
            largo: item.largo,
            precioM2: item.precioM2,
            atc: item.atc || 0,
            ltc: item.ltc || 0
        });
        setEditIndex(index);
        setEditOpen(true);
    };

    const handleUpdateItem = () => {
        if (editIndex === null) return;
        const precioUnitario = calcularPrecioUnitario(form.ancho, form.largo, form.precioM2);
        const precioTotal = parseFloat((precioUnitario * form.cantidad).toFixed(2));
        const tc = calcularTC(form.cantidad, form.ancho, form.largo, form.atc || 0, form.ltc || 0);
        const updatedItem: EstanteItem = {
            ...form,
            precioUnitario,
            precioTotal,
            tc: tc
        } as EstanteItem;

        updateItem(items[editIndex].id, updatedItem);
        setEditOpen(false);
        setEditIndex(null);
    };

    return (
        <Container sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>Formulario Cotización</Typography>

            <Typography variant="h6" gutterBottom>Tipo de Mueble</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <Box width={180}>
                        <FormControl fullWidth>
                            <InputLabel>Tipo de Mueble</InputLabel>
                            <Select
                                fullWidth
                                value={furnitureType}
                                label="Tipo de Mueble"
                                onChange={(e) => setFurnitureType(e.target.value as string)}
                            >
                                {tipoMuebleOptions.map((tipo, i) => (
                                    <MenuItem key={i} value={tipo}>{tipo}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>Medidas</Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        label="ANCHO (m)"
                        name="ancho"
                        type="number"
                        inputProps={{ step: 'any' }}
                        value={dimensiones.ancho}
                        onChange={handleDimensionesChange}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        label="ALTO (m)"
                        name="alto"
                        type="number"
                        inputProps={{ step: 'any' }}
                        value={dimensiones.alto}
                        onChange={handleDimensionesChange}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        label="PROFUNDIDAD (m)"
                        name="profundidad"
                        type="number"
                        inputProps={{ step: 'any' }}
                        value={dimensiones.profundidad}
                        onChange={handleDimensionesChange}
                    />
                </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>Crear Pieza</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        label="Cantidad"
                        name="cantidad"
                        value={form.cantidad}
                        onChange={handleChange}
                        type="number"
                        inputProps={{ step: 'any' }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Autocomplete
                        freeSolo
                        options={piezaOptions}
                        value={form.pieza}
                        onInputChange={(_, newValue) =>
                            setForm((prev) => ({ ...prev, pieza: newValue }))
                        }
                        renderInput={(params) => (
                            <TextField {...params} label="Pieza" fullWidth />
                        )}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                        <InputLabel>Material</InputLabel>
                        <Select
                            name="material"
                            value={form.material}
                            label="Material"
                            onChange={handleChange}
                        >
                            {materiales.map((mat, i) => (
                                <MenuItem key={i} value={mat.material}>{mat.material}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        label="Ancho (m)"
                        name="ancho"
                        value={form.ancho}
                        onChange={handleChange}
                        type="number"
                        inputProps={{ step: 'any' }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        label="Largo (m)"
                        name="largo"
                        value={form.largo}
                        onChange={handleChange}
                        type="number"
                        inputProps={{ step: 'any' }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        fullWidth
                        label="P/M2"
                        name="precioM2"
                        value={form.precioM2}
                        InputProps={{ readOnly: true }}
                        type="number"
                        inputProps={{ step: 'any' }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        fullWidth
                        label="ATC"
                        name="atc"
                        value={form.atc}
                        onChange={handleChange}
                        type="number"
                        inputProps={{ step: 'any' }}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        fullWidth
                        label="LTC"
                        name="ltc"
                        value={form.ltc}
                        onChange={handleChange}
                        type="number"
                        inputProps={{ step: 'any' }}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button variant="contained" onClick={handleAddItem}>
                        Agregar Pieza
                    </Button>
                </Grid>
            </Grid>

            <Typography variant="h5" sx={{ mt: 4 }}>Resumen</Typography>
            <TableContainer component={Paper} sx={{ mt: 2 }}>
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
                            <TableCell>TC</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow
                                key={item.id}
                                onClick={() => handleRowClick(index)}
                                hover
                                sx={{ cursor: 'pointer' }}
                            >
                                <TableCell>{item.cantidad}</TableCell>
                                <TableCell>{item.pieza}</TableCell>
                                <TableCell>{item.material}</TableCell>
                                <TableCell>{item.ancho}</TableCell>
                                <TableCell>{item.largo}</TableCell>
                                <TableCell>{item.precioM2}</TableCell>
                                <TableCell>{item.precioUnitario}</TableCell>
                                <TableCell>{item.precioTotal}</TableCell>
                                <TableCell>{item.tc?.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
                <DialogTitle>Editar Línea</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Cantidad"
                                name="cantidad"
                                value={form.cantidad}
                                onChange={handleChange}
                                type="number"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                freeSolo
                                options={piezaOptions}
                                value={form.pieza}
                                onInputChange={(_, newValue) =>
                                    setForm((prev) => ({ ...prev, pieza: newValue }))
                                }
                                renderInput={(params) => (
                                    <TextField {...params} label="Pieza" fullWidth />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Material</InputLabel>
                                <Select
                                    name="material"
                                    value={form.material}
                                    label="Material"
                                    onChange={handleChange}
                                >
                                    {materiales.map((mat, i) => (
                                        <MenuItem key={i} value={mat.material}>{mat.material}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Ancho (m)"
                                name="ancho"
                                value={form.ancho}
                                onChange={handleChange}
                                type="number"
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Largo (m)"
                                name="largo"
                                value={form.largo}
                                onChange={handleChange}
                                type="number"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                label="ATC"
                                name="atc"
                                value={form.atc}
                                onChange={handleChange}
                                type="number"
                                inputProps={{ step: 'any' }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                fullWidth
                                label="LTC"
                                name="ltc"
                                value={form.ltc}
                                onChange={handleChange}
                                type="number"
                                inputProps={{ step: 'any' }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
                    <Button onClick={handleUpdateItem} variant="contained">Actualizar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};
