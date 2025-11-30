// FormCotizacion.tsx
import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
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
    Autocomplete,
    SelectChangeEvent
} from '@mui/material';
import { useMaterialStore } from '../store/materialStore';
import { useCotizacionStore } from '../store/cotizacionStore';
import { EstanteItem, Dimensiones } from '../models/Interfaces';

const piezaOptions = [
    'lateral', 'zocalo', 'base', 'fondo', 'puerta',
    'tapa de cajon', 'frente de cajon', 'laterales de cajon',
    'meson', 'repisa', 'puertas'
];

const tipoMuebleOptions = ['estante', 'gabinete'];

// Initial form state
const initialFormState: Omit<EstanteItem, 'precioUnitario' | 'precioTotal' | 'tc'> = {
    id: '',
    cantidad: 0,
    pieza: '',
    material: '',
    ancho: 0,
    largo: 0,
    precioM2: 0,
    atc: 0,
    ltc: 0
};

// Memoized Table Row Component
interface TableRowItemProps {
    item: EstanteItem;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

const TableRowItem = memo(({ item, onEdit, onDelete }: TableRowItemProps) => (
    <TableRow>
        <TableCell>{item.cantidad}</TableCell>
        <TableCell>{item.pieza}</TableCell>
        <TableCell>{item.material}</TableCell>
        <TableCell>{item.ancho}</TableCell>
        <TableCell>{item.largo}</TableCell>
        <TableCell>{item.precioM2}</TableCell>
        <TableCell>{item.precioUnitario}</TableCell>
        <TableCell>{item.precioTotal}</TableCell>
        <TableCell>{item.tc?.toFixed(2)}</TableCell>
        <TableCell>
            <Button onClick={() => onEdit(item.id)}>Editar</Button>
            <Button color="error" onClick={() => onDelete(item.id)}>Eliminar</Button>
        </TableCell>
    </TableRow>
));

TableRowItem.displayName = 'TableRowItem';

export const FormCotizacion: React.FC = () => {
    const materiales = useMaterialStore((state) => state.materiales);
    const items = useCotizacionStore((state) => state.items);
    const dimensiones = useCotizacionStore((state) => state.dimensiones);
    const addItem = useCotizacionStore((state) => state.addItem);
    const updateItem = useCotizacionStore((state) => state.updateItem);
    const deleteItem = useCotizacionStore((state) => state.deleteItem);
    const addListItem = useCotizacionStore((state) => state.addListItem);
    const setStoreDimensiones = useCotizacionStore((state) => state.setDimensiones);

    const [furnitureType, setFurnitureType] = useState<string>('');
    const [form, setForm] = useState(initialFormState);
    const [editIndex, setEditIndex] = useState<string | null>(null);
    const [editOpen, setEditOpen] = useState<boolean>(false);

    // Memoized calculations
    const calcularPrecioUnitario = useCallback((ancho: number, largo: number, precioM2: number, isTube?: boolean, precioML?: number) => {
        if (isTube) {
            // For tubes, calculate based on linear meter (only use largo)
            const precio = precioML ?? 0;
            return parseFloat((precio).toFixed(2));
        }
        // For sheets, calculate based on area (m2)
        const area = ancho * largo;
        return parseFloat((area * precioM2).toFixed(2));
    }, []);

    const calcularTC = useCallback((cantidad: number, ancho: number, largo: number, atc: number = 0, ltc: number = 0) => {
        return cantidad * (ancho * atc + largo * ltc);
    }, []);

    // Sync precioM2/precioML from materials when material changes
    useEffect(() => {
        const selected = materiales.find((m) => m.material === form.material);
        if (selected) {
            setForm((prev) => ({
                ...prev,
                // For tubes, store precioML in precioM2 field for display purposes
                precioM2: selected.isTube ? (selected.precioML || 0) : selected.precioM2
            }));
        }
    }, [form.material, materiales]);

    // Get selected material info for UI display
    const selectedMaterial = useMemo(() => 
        materiales.find((m) => m.material === form.material)
    , [form.material, materiales]);
    
    const isTubeMaterial = selectedMaterial?.isTube || false;

    // Auto-fill width/height based on furniture type and piece
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

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name as string]: name === 'material' ? (value as string) : parseFloat(value as string)
        }));
    }, []);

    const handleDimensionesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const parsedValue = parseFloat(value);

        setStoreDimensiones({
            ...dimensiones,
            [name]: parsedValue
        });
    }, [dimensiones, setStoreDimensiones]);

    const handleFurnitureTypeChange = useCallback((e: SelectChangeEvent<string>) => {
        setFurnitureType(e.target.value);
    }, []);

    const handlePiezaChange = useCallback((_: unknown, newValue: string | null) => {
        setForm((prev) => ({ ...prev, pieza: newValue || '' }));
    }, []);

    const handleAddItem = useCallback(() => {
        const selectedMaterial = materiales.find((m) => m.material === form.material);
        const isTube = selectedMaterial?.isTube || false;
        const precioML = selectedMaterial?.precioML || 0;
        const precioUnitario = calcularPrecioUnitario(form.ancho, form.largo, form.precioM2, isTube, precioML);
        const precioTotal = parseFloat((precioUnitario * form.cantidad).toFixed(2));
        const tc = calcularTC(form.cantidad, form.ancho, form.largo, form.atc || 0, form.ltc || 0);
        const nuevoItem: EstanteItem = {
            ...form,
            id: crypto.randomUUID(),
            precioUnitario,
            precioTotal,
            tc
        };
        addItem(nuevoItem);
        setForm(initialFormState);
    }, [form, materiales, calcularPrecioUnitario, calcularTC, addItem]);

    const handleRowClick = useCallback((id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
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
        setEditIndex(item.id);
        setEditOpen(true);
    }, [items]);

    const handleUpdateItem = useCallback(() => {
        if (editIndex === null) return;
        const selectedMaterial = materiales.find((m) => m.material === form.material);
        const isTube = selectedMaterial?.isTube || false;
        const precioML = selectedMaterial?.precioML || 0;
        const precioUnitario = calcularPrecioUnitario(form.ancho, form.largo, form.precioM2, isTube, precioML);
        const precioTotal = parseFloat((precioUnitario * form.cantidad).toFixed(2));
        const tc = calcularTC(form.cantidad, form.ancho, form.largo, form.atc || 0, form.ltc || 0);
        const updatedItem: EstanteItem = {
            ...form,
            precioUnitario,
            precioTotal,
            tc
        };

        updateItem(editIndex, updatedItem);
        setEditOpen(false);
        setEditIndex(null);
    }, [editIndex, form, materiales, calcularPrecioUnitario, calcularTC, updateItem]);

    const handleDelete = useCallback((id: string) => {
        deleteItem(id);
    }, [deleteItem]);

    const handleCloseDialog = useCallback(() => {
        setEditOpen(false);
    }, []);

    const handleActualizarMedidas = useCallback(() => {
        const { ancho, alto, profundidad } = dimensiones;
        const updatedItems = items.map((item) => {
            const piezaLower = item.pieza.toLowerCase();
            let nuevasAncho = item.ancho;
            let nuevoLargo = item.largo;

            if (furnitureType === 'estante') {
                if (['lateral', 'laterales'].includes(piezaLower)) {
                    nuevasAncho = profundidad;
                    nuevoLargo = alto;
                } else if (['base', 'repisa'].includes(piezaLower)) {
                    nuevasAncho = ancho;
                    nuevoLargo = profundidad;
                } else if (piezaLower === 'fondo') {
                    nuevasAncho = ancho;
                    nuevoLargo = alto;
                }
            } else if (furnitureType === 'gabinete') {
                if (piezaLower === 'lateral') {
                    nuevasAncho = profundidad;
                    nuevoLargo = alto;
                } else if (piezaLower === 'fondo') {
                    nuevasAncho = ancho;
                    nuevoLargo = alto;
                } else if (['base', 'repisa'].includes(piezaLower)) {
                    nuevasAncho = ancho;
                    nuevoLargo = profundidad;
                } else if (piezaLower === 'puertas') {
                    nuevasAncho = ancho / 2;
                    nuevoLargo = alto;
                }
            }

            const selectedMaterial = materiales.find((m) => m.material === item.material);
            const isTube = selectedMaterial?.isTube || false;
            const precioML = selectedMaterial?.precioML || 0;
            const precioUnitario = calcularPrecioUnitario(nuevasAncho, nuevoLargo, item.precioM2, isTube, precioML);
            const precioTotal = parseFloat((precioUnitario * item.cantidad).toFixed(2));
            const tc = calcularTC(item.cantidad, nuevasAncho, nuevoLargo, item.atc || 0, item.ltc || 0);

            return {
                ...item,
                ancho: nuevasAncho,
                largo: nuevoLargo,
                precioUnitario,
                precioTotal,
                tc,
            };
        });
        addListItem(updatedItems);
    }, [dimensiones, items, furnitureType, materiales, calcularPrecioUnitario, calcularTC, addListItem]);

    // Memoized material options for Select
    const materialOptions = useMemo(() => 
        materiales.map((mat, i) => (
            <MenuItem key={mat.id || i} value={mat.material}>{mat.material}</MenuItem>
        ))
    , [materiales]);

    // Memoized furniture type options
    const furnitureOptions = useMemo(() => 
        tipoMuebleOptions.map((tipo, i) => (
            <MenuItem key={i} value={tipo}>{tipo}</MenuItem>
        ))
    , []);

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
                                onChange={handleFurnitureTypeChange}
                            >
                                {furnitureOptions}
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
                <Grid item xs={12}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleActualizarMedidas}
                    >
                        Actualizar medidas de piezas
                    </Button>
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
                    <Box width={192}>
                        <Autocomplete
                            freeSolo
                            options={piezaOptions}
                            value={form.pieza}
                            onInputChange={handlePiezaChange}
                            renderInput={(params) => (
                                <TextField {...params} label="Pieza" fullWidth />
                            )}
                        />
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Box width={192}>
                        <FormControl fullWidth>
                            <InputLabel>Material</InputLabel>
                            <Select
                                name="material"
                                value={form.material}
                                label="Material"
                                onChange={handleChange}
                            >
                                {materialOptions}
                            </Select>
                        </FormControl>
                    </Box>
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
                        label={isTubeMaterial ? "P/ML" : "P/M2"}
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
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item) => (
                            <TableRowItem
                                key={item.id}
                                item={item}
                                onEdit={handleRowClick}
                                onDelete={handleDelete}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={editOpen} onClose={handleCloseDialog}>
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
                                onInputChange={handlePiezaChange}
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
                                    {materialOptions}
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
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleUpdateItem} variant="contained">Actualizar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};
