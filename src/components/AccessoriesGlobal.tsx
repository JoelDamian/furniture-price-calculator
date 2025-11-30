// AccessorysGlobalPage.tsx
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
    DialogActions
} from '@mui/material';

import { useAccessoryGlobalStore } from '../store/accessoryGlobalStore';
import { AccessoryGlobal } from '../models/Interfaces';
import { saveAccesorio, updateAccesorioInFirestore, deleteAccessorioInFirestore } from '../services/accessoriesService';

// Initial form state
const initialFormState: Omit<AccessoryGlobal, 'precioTotal'> = {
    id: '',
    nombre: '',
    precioUnitario: 0
};

// Memoized Table Row Component
interface AccessoryGlobalRowProps {
    item: AccessoryGlobal;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

const AccessoryGlobalRow = memo(({ item, onEdit, onDelete }: AccessoryGlobalRowProps) => (
    <TableRow hover>
        <TableCell>{item.nombre}</TableCell>
        <TableCell>{item.precioUnitario}</TableCell>
        <TableCell>
            <Button onClick={() => onEdit(item.id)}>Editar</Button>
            <Button color="error" onClick={() => onDelete(item.id)}>Eliminar</Button>
        </TableCell>
    </TableRow>
));

AccessoryGlobalRow.displayName = 'AccessoryGlobalRow';

export const AccessorysGlobalPage: React.FC = () => {
    const [form, setForm] = useState(initialFormState);
    const [editOpen, setEditOpen] = useState(false);
    const [editForm, setEditForm] = useState(initialFormState);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    // Store selectors
    const items = useAccessoryGlobalStore((state) => state.items);
    const addItem = useAccessoryGlobalStore((state) => state.addItem);
    const updateItem = useAccessoryGlobalStore((state) => state.updateItem);
    const deleteItem = useAccessoryGlobalStore((state) => state.deleteItem);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === 'nombre' ? value : parseFloat(value)
        }));
    }, []);

    const handleSubmit = useCallback(async () => {
        const nuevo: AccessoryGlobal = { ...form, id: crypto.randomUUID() };
        addItem(nuevo);
        await saveAccesorio(nuevo);
        setForm({ ...initialFormState, id: crypto.randomUUID() });
    }, [form, addItem]);

    const handleRowClick = useCallback((id: string) => {
        const item = items.find(i => i.id === id);
        if (!item) return;
        setEditForm({
            id: item.id,
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

    const handleUpdate = useCallback(async () => {
        updateItem(editForm.id, { ...editForm });
        await updateAccesorioInFirestore(editForm.id, { ...editForm });
        setEditOpen(false);
    }, [editForm, updateItem]);

    const openDeleteDialog = useCallback((id: string) => {
        setItemToDelete(id);
        setDeleteOpen(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (itemToDelete) {
            deleteItem(itemToDelete);
            await deleteAccessorioInFirestore(itemToDelete);
        }
        setDeleteOpen(false);
        setItemToDelete(null);
    }, [itemToDelete, deleteItem]);

    const cancelDelete = useCallback(() => {
        setDeleteOpen(false);
        setItemToDelete(null);
    }, []);

    const handleCloseEditDialog = useCallback(() => {
        setEditOpen(false);
    }, []);

    // Memoized table rows
    const tableRows = useMemo(() =>
        items.map((item) => (
            <AccessoryGlobalRow
                key={item.id}
                item={item}
                onEdit={handleRowClick}
                onDelete={openDeleteDialog}
            />
        ))
    , [items, handleRowClick, openDeleteDialog]);

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
                        {tableRows}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* EDIT MODAL */}
            <Dialog open={editOpen} onClose={handleCloseEditDialog}>
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
                    <Button onClick={handleCloseEditDialog}>Cancelar</Button>
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
