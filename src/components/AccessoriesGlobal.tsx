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

import { useAccessoryGlobalStore } from '../store/accessoryGlobalStore';
import { AccessoryGlobal } from '../models/Interfaces';
import { saveAccesorio, updateAccesorioInFirestore, deleteAccessorioInFirestore } from '../services/accessoriesService';

export const AccessorysGlobalPage: React.FC = () => {

    const [form, setForm] = useState<Omit<AccessoryGlobal, 'precioTotal'>>({
        id: '',
        nombre: '',
        precioUnitario: 0
    });

    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState<Omit<AccessoryGlobal, 'precioTotal'>>({
        id: '',
        nombre: '',
        precioUnitario: 0
    });

    // --- NEW: Delete confirmation modal ---
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const { items, addItem, updateItem, deleteItem } = useAccessoryGlobalStore();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: name === 'nombre' ? value : parseFloat(value)
        });
    };

    const handleSubmit = async () => {
        const nuevo: AccessoryGlobal = { ...form };
        
        addItem(nuevo);
        await saveAccesorio(nuevo);

        setForm({ nombre: '', precioUnitario: 0, id: crypto.randomUUID() });
    };

    const handleRowClick = (id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        setEditForm({
            id: item.id,
            nombre: item.nombre,
            precioUnitario: item.precioUnitario
        });
        setEditOpen(true);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditForm({
            ...editForm,
            [name]: name === 'nombre' ? value : parseFloat(value)
        });
    };

    const handleUpdate = async () => {

        updateItem(editForm.id, { ...editForm });

        await updateAccesorioInFirestore(editForm.id, { ...editForm });

        setEditOpen(false);
    };

    // ---------------------------------------
    // NEW: SHOW DELETE CONFIRMATION DIALOG
    // ---------------------------------------
    const openDeleteDialog = (id: string) => {
        setItemToDelete(id);
        setDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            deleteItem(itemToDelete);
            await deleteAccessorioInFirestore(itemToDelete);
        }
        setDeleteOpen(false);
        setItemToDelete(null);
    };

    const cancelDelete = () => {
        setDeleteOpen(false);
        setItemToDelete(null);
    };

    return (
        <Container sx={{ py: 4 }}>

            {/* FORM */}
            <Typography variant="h4" gutterBottom>
                Crear Accesorio
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
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

            {/* TABLE */}
            <Typography variant="h5" gutterBottom>
                Lista de Accessorios
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Precio Unitario</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {items.map(item => (
                            <TableRow key={item.id} hover>
                                <TableCell>{item.nombre}</TableCell>
                                <TableCell>{item.precioUnitario}</TableCell>
                                <TableCell>
                                    <Button onClick={() => handleRowClick(item.id)}>Editar</Button>
                                    <Button color="error" onClick={() => openDeleteDialog(item.id)}>Eliminar</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>

                </Table>
            </TableContainer>

            {/* EDIT MODAL */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
                <DialogTitle>Editar Ítem</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>

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
                    <Button variant="contained" onClick={handleUpdate}>Actualizar</Button>
                </DialogActions>
            </Dialog>

            {/* DELETE CONFIRMATION MODAL */}
            <Dialog open={deleteOpen} onClose={cancelDelete}>
                <DialogTitle>Confirmación</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Está seguro de borrar este accesorio?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete}>No</Button>
                    <Button color="error" variant="contained" onClick={confirmDelete}>
                        Sí
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
};
