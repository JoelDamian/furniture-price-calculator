import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Navigate } from 'react-router-dom';
import { Finanza } from '../models/Interfaces';
import { FINANZAS_ORG, canAccessFinanzas } from '../constants/finanzasAccess';
import { useAuthStore } from '../store/authStore';
import { fetchFinanzasByOrg, finalizeFinanzaInFirestore } from '../services/finanzasService';
import { CrearFinanzaModal } from './finanzas/CrearFinanzaModal';
import { DetalleFinanzaModal } from './finanzas/DetalleFinanzaModal';
import { EditarFinanzaModal } from './finanzas/EditarFinanzaModal';

interface FinanzaRowProps {
  finanza: Finanza;
  onEdit: (finanza: Finanza) => void;
  onViewDetail: (finanza: Finanza) => void;
  onFinalize: (finanza: Finanza) => void;
}

const FinanzaRow = memo(({ finanza, onEdit, onViewDetail, onFinalize }: FinanzaRowProps) => (
  <TableRow hover>
    <TableCell>{finanza.name}</TableCell>
    <TableCell>{finanza.onAccount.toFixed(2)}</TableCell>
    <TableCell>{finanza.costoFinal.toFixed(2)}</TableCell>
    <TableCell>{finanza.saldo.toFixed(2)}</TableCell>
    <TableCell>{finanza.gastoTotal.toFixed(2)}</TableCell>
    <TableCell>{finanza.ganancia.toFixed(2)}</TableCell>
    <TableCell>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Button size="small" onClick={() => onEdit(finanza)}>Editar</Button>
        <Button size="small" variant="outlined" onClick={() => onViewDetail(finanza)}>Detalle</Button>
        {!finanza.finishedAt && (
          <Button size="small" color="success" onClick={() => onFinalize(finanza)}>
            Finalizar proyecto
          </Button>
        )}
      </Box>
    </TableCell>
  </TableRow>
));

FinanzaRow.displayName = 'FinanzaRow';

const isFinanzaInDateRange = (
  createdAt: string,
  startDate: string,
  endDate: string
): boolean => {
  if (!startDate && !endDate) return true;
  if (!createdAt) return false;

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return false;

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00`);
    if (created < start) return false;
  }

  if (endDate) {
    const end = new Date(`${endDate}T23:59:59.999`);
    if (created > end) return false;
  }

  return true;
};

interface FinanzasTableProps {
  idOrg: number;
  title: string;
}

const FinanzasTable: React.FC<FinanzasTableProps> = ({ idOrg, title }) => {
  const [finanzas, setFinanzas] = useState<Finanza[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedFinanza, setSelectedFinanza] = useState<Finanza | null>(null);
  const [detailFinanza, setDetailFinanza] = useState<Finanza | null>(null);
  const [nameSearch, setNameSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadFinanzas = useCallback(async () => {
    const data = await fetchFinanzasByOrg(idOrg);
    setFinanzas(data);
  }, [idOrg]);

  useEffect(() => {
    loadFinanzas();
  }, [loadFinanzas]);

  const handleFinanzaCreated = useCallback((finanza: Finanza) => {
    setFinanzas((prev) => [...prev, finanza]);
  }, []);

  const handleOpenEdit = useCallback((finanza: Finanza) => {
    setSelectedFinanza(finanza);
    setEditOpen(true);
  }, []);

  const handleFinanzaUpdated = useCallback((finanza: Finanza) => {
    setFinanzas((prev) =>
      prev.map((item) => (item.id === finanza.id ? finanza : item))
    );
    setEditOpen(false);
    setSelectedFinanza(null);
  }, []);

  const handleViewDetail = useCallback((finanza: Finanza) => {
    setDetailFinanza(finanza);
    setDetailOpen(true);
  }, []);

  const handleFinalize = useCallback(async (finanza: Finanza) => {
    const finishedAt = new Date().toISOString();
    await finalizeFinanzaInFirestore(finanza.id, finishedAt);
    setFinanzas((prev) =>
      prev.map((item) => (item.id === finanza.id ? { ...item, finishedAt } : item))
    );
  }, []);

  const handleClearFilters = useCallback(() => {
    setNameSearch('');
    setStartDate('');
    setEndDate('');
  }, []);

  const filteredFinanzas = useMemo(() => {
    const search = nameSearch.trim().toLowerCase();

    return finanzas.filter((finanza) => {
      const matchesName = !search || finanza.name.toLowerCase().includes(search);
      const matchesDate = isFinanzaInDateRange(finanza.createdAt, startDate, endDate);
      return matchesName && matchesDate;
    });
  }, [finanzas, nameSearch, startDate, endDate]);

  const tableRows = useMemo(
    () =>
      filteredFinanzas.map((finanza) => (
        <FinanzaRow
          key={finanza.id}
          finanza={finanza}
          onEdit={handleOpenEdit}
          onViewDetail={handleViewDetail}
          onFinalize={handleFinalize}
        />
      )),
    [filteredFinanzas, handleOpenEdit, handleViewDetail, handleFinalize]
  );

  const hasFilters = Boolean(nameSearch.trim() || startDate || endDate);
  const emptyMessage = hasFilters ? 'No se encontraron resultados' : 'No hay registros';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">{title}</Typography>
        <Button variant="contained" onClick={() => setCreateOpen(true)}>
          Crear
        </Button>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            fullWidth
            label="Buscar por nombre"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label="Fecha inicio desde"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            label="Fecha inicio hasta"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button onClick={handleClearFilters} disabled={!hasFilters}>
          Limpiar filtros
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>A cuenta</TableCell>
              <TableCell>Costo final</TableCell>
              <TableCell>Saldo</TableCell>
              <TableCell>Gasto total</TableCell>
              <TableCell>Ganancia</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows.length ? tableRows : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CrearFinanzaModal
        open={createOpen}
        title={title}
        idOrg={idOrg}
        onClose={() => setCreateOpen(false)}
        onCreated={handleFinanzaCreated}
      />

      <EditarFinanzaModal
        open={editOpen}
        finanza={selectedFinanza}
        onClose={() => {
          setEditOpen(false);
          setSelectedFinanza(null);
        }}
        onUpdated={handleFinanzaUpdated}
      />

      <DetalleFinanzaModal
        open={detailOpen}
        finanza={detailFinanza}
        onClose={() => {
          setDetailOpen(false);
          setDetailFinanza(null);
        }}
      />
    </Box>
  );
};

export const FinanzasPage: React.FC = () => {
  const userEmail = useAuthStore((state) => state.userEmail);
  const [tab, setTab] = useState(0);

  if (!canAccessFinanzas(userEmail)) {
    return <Navigate to="/material" replace />;
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Finanzas
      </Typography>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 3 }}>
        <Tab label="Carpintería" />
        <Tab label="Studio" />
      </Tabs>

      {tab === 0 && (
        <FinanzasTable idOrg={FINANZAS_ORG.CARPINTERIA} title="Carpintería" />
      )}
      {tab === 1 && (
        <FinanzasTable idOrg={FINANZAS_ORG.STUDIO} title="Studio" />
      )}
    </Container>
  );
};
