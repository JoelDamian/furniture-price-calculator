// AccessorysPage.tsx
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
import { useAccessoryStore } from '../store/accessoryStore';
import { Accessory } from '../models/Interfaces';


export const AccessorysPage: React.FC = () => {
    const [form, setForm] = useState<Omit<Accessory, 'precioTotal'>>({
        id: '',
        cantidad: 0,
        nombre: '',
        precioUnitario: 0
    });

    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState<Omit<Accessory, 'precioTotal'>>({
        id: '',
        cantidad: 0,
        nombre: '',
        precioUnitario: 0
    });

    const { items, addItem, updateItem, deleteItem } = useAccessoryStore();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: name === 'nombre' ? value : parseFloat(value)
        });
    };

    const handleSubmit = () => {
        const precioTotal = form.cantidad * form.precioUnitario;
        const nuevo: Accessory = { ...form, precioTotal };
        addItem(nuevo);
        setForm({ cantidad: 0, nombre: '', precioUnitario: 0, id: '' });
    };

    const handleRowClick = (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        setEditForm({ id: item.id, cantidad: item.cantidad, nombre: item.nombre, precioUnitario: item.precioUnitario });
        setEditOpen(true);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditForm({
            ...editForm,
            [name]: name === 'nombre' ? value : parseFloat(value)
        });
    };

    const handleUpdate = () => {
        const precioTotal = editForm.cantidad * editForm.precioUnitario;
        updateItem(editForm.id, { ...editForm, precioTotal });
        setEditOpen(false);
    };

    const handleDelete = (id: string) => {
        deleteItem(id);
    };

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
                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        label="Nombre"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                    />
                </Grid>
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
                        {items.map(item => (
                            <TableRow key={item.id} hover>
                                <TableCell>{item.cantidad}</TableCell>
                                <TableCell>{item.nombre}</TableCell>
                                <TableCell>{item.precioUnitario}</TableCell>
                                <TableCell>{item.precioTotal}</TableCell>
                                <TableCell>
                                    <Button onClick={() => handleRowClick(item.id)}>Editar</Button>
                                    <Button color="error" onClick={() => handleDelete(item.id)}>Eliminar</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
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
                    <Button onClick={() => setEditOpen(false)}>Cancelar</Button>
                    <Button onClick={handleUpdate} variant="contained">Actualizar</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};
