import React, { useState } from 'react';
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

export const CotizacionesList: React.FC = () => {
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
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
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {cotizaciones.map((c) => (
                            <TableRow key={c.id}>
                                <TableCell>{c.nombre}</TableCell>
                                <TableCell>{c.total.toFixed(2)}</TableCell>
                                <TableCell>{c.manoDeObra.toFixed(2)}</TableCell>
                                <TableCell>{c.precioVenta.toFixed(2)}</TableCell>
                                <TableCell>{c.precioVentaConIva.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};
