import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Cotizacion } from '../models/Interfaces';
import { fetchCotizaciones } from '../services/cotizacionService';
import { useCotizacionStore } from '../store/cotizacionStore';
import { useAccessoryStore } from '../store/accessoryStore';
import { useCotizacionGlobalStore } from '../store/finalCotizacion';
import { useNavigate } from 'react-router-dom';

export const CotizacionesList: React.FC = () => {
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[] | undefined>([]);
    const { addListItem } = useCotizacionStore();
    const { addListAccessories } = useAccessoryStore();
    const { setCotizacion } = useCotizacionGlobalStore();
    const navigate = useNavigate();

    useEffect(() => {
        const loadCotizaciones = async () => {
            const datos = await fetchCotizaciones();
            setCotizaciones(datos);
        };

        loadCotizaciones();
    }, []);

    const handleRowClick = (cotizacion: Cotizacion) => {
        addListItem(cotizacion.piezas);
        addListAccessories(cotizacion.accesorios);
        setCotizacion(cotizacion);
        console.log("Cotizacion seleccionada:", cotizacion.id);
        navigate('/cotizacion', { state: { isEdit: true } });
    }

    return (
        <Container sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>Lista de Cotizaciones</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Mano de Obra</TableCell>
                            <TableCell>Precio Venta</TableCell>
                            <TableCell>Precio Venta + IVA</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {cotizaciones && cotizaciones.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell>{c.nombre}</TableCell>
                                <TableCell>{c.total.toFixed(2)}</TableCell>
                                <TableCell>{c.manoDeObra.toFixed(2)}</TableCell>
                                <TableCell>{c.precioVenta.toFixed(2)}</TableCell>
                                <TableCell>{c.precioVentaConIva.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Button onClick={() => handleRowClick(c)}>Editar</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};
