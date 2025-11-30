// AccessorysPage.tsx
import React, { useState, useCallback, useMemo, memo } from 'react';
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
    Autocomplete,
    Box
} from '@mui/material';
import { useAccessoryStore } from '../store/accessoryStore';
import { Accessory, AccessoryGlobal } from '../models/Interfaces';
import { useAccessoryGlobalStore } from '../store/accessoryGlobalStore';

// Initial form state
const initialFormState: Omit<Accessory, 'precioTotal'> = {
    id: '',
    cantidad: 0,
    nombre: '',
    precioUnitario: 0
};

// Memoized Table Row Component
interface AccessoryRowProps {
    item: Accessory;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

const AccessoryRow = memo(({ item, onEdit, onDelete }: AccessoryRowProps) => (
    <TableRow hover>
        <TableCell>{item.cantidad}</TableCell>
        <TableCell>{item.nombre}</TableCell>
        <TableCell>{item.precioUnitario}</TableCell>
        <TableCell>{item.precioTotal}</TableCell>
        <TableCell>
            <Button onClick={() => onEdit(item.id)}>Editar</Button>
            <Button color="error" onClick={() => onDelete(item.id)}>Eliminar</Button>
        </TableCell>
    </TableRow>
));

AccessoryRow.displayName = 'AccessoryRow';

export const AccessorysPage: React.FC = () => {
    const [form, setForm] = useState(initialFormState);
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState(initialFormState);

    // Store selectors
    const items = useAccessoryStore((state) => state.items);
    const addItem = useAccessoryStore((state) => state.addItem);
    const updateItem = useAccessoryStore((state) => state.updateItem);
    const deleteItem = useAccessoryStore((state) => state.deleteItem);
    const accesoriosGlobal = useAccessoryGlobalStore((state) => state.items);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === 'nombre' ? value : parseFloat(value)
        }));
    }, []);

    const handleSubmit = useCallback(() => {
        const precioTotal = form.cantidad * form.precioUnitario;
        const nuevo: Accessory = { ...form, id: crypto.randomUUID(), precioTotal };
        addItem(nuevo);
        setForm({ ...initialFormState, id: crypto.randomUUID() });
    }, [form, addItem]);

    const handleRowClick = useCallback((id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        setEditForm({ 
            id: item.id, 
            cantidad: item.cantidad, 
            nombre: item.nombre, 
            precioUnitario: item.precioUnitario 
        });
        setEditOpen(true);
    }, [items]);

    const handleEditChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({
            ...prev,
            [name]: name === 'nombre' ? value : parseFloat(value)
        }));
    }, []);

    const handleUpdate = useCallback(() => {
        const precioTotal = editForm.cantidad * editForm.precioUnitario;
        updateItem(editForm.id, { ...editForm, precioTotal });
        setEditOpen(false);
    }, [editForm, updateItem]);

    const handleDelete = useCallback((id: string) => {
        deleteItem(id);
    }, [deleteItem]);

    const handleCloseDialog = useCallback(() => {
        setEditOpen(false);
    }, []);

    // Handle autocomplete selection
    const handleAutocompleteChange = useCallback((
        _: unknown, 
        selectedOption: string | AccessoryGlobal | null
    ) => {
        if (selectedOption && typeof selectedOption !== "string") {
            setForm((prev) => ({
                ...prev,
                nombre: selectedOption.nombre,
                precioUnitario: selectedOption.precioUnitario
            }));
        }
    }, []);

    const handleAutocompleteInputChange = useCallback((_: unknown, newValue: string) => {
        setForm((prev) => ({
            ...prev,
            nombre: newValue
        }));
    }, []);

    // Memoized getOptionLabel
    const getOptionLabel = useCallback((option: string | AccessoryGlobal) => {
        return typeof option === "string" ? option : option.nombre;
    }, []);

    return (
        <Container sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Crear Accesorio
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        label="Cantidad"
                        name="cantidad"
                        value={form.cantidad}
                        onChange={handleChange}
                        type="number"
                    />
                </Grid>
                <Box width={192}>
                    <Autocomplete
                        freeSolo
                        options={accesoriosGlobal}
                        value={form.nombre}
                        getOptionLabel={getOptionLabel}
                        onChange={handleAutocompleteChange}
                        onInputChange={handleAutocompleteInputChange}
                        renderInput={(params) => (
                            <TextField {...params} label="Nombre" fullWidth />
                        )}
                    />
                </Box>
                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        label="Precio Unitario"
                        name="precioUnitario"
                        value={form.precioUnitario}
                        onChange={handleChange}
                        type="number"
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button variant="contained" onClick={handleSubmit}>Agregar</Button>
                </Grid>
            </Grid>

            <Typography variant="h5" gutterBottom>
                Lista de Accessorios
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Cantidad</TableCell>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Precio Unitario</TableCell>
                            <TableCell>Precio Total</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item) => (
                            <AccessoryRow
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
                <DialogTitle>Editar Ítem</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Cantidad"
                                name="cantidad"
                                value={editForm.cantidad}
                                onChange={handleEditChange}
                                type="number"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Nombre"
                                name="nombre"
                                value={editForm.nombre}
                                onChange={handleEditChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Precio Unitario"
                                name="precioUnitario"
                                value={editForm.precioUnitario}
                                onChange={handleEditChange}
                                type="number"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancelar</Button>
                    <Button onClick={handleUpdate} variant="contained">Actualizar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};
