import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  InputBase,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import { useCotizacionStore } from '../store/cotizacionStore';
import { useAccessoryStore } from '../store/accessoryStore';
import { useCotizacionGlobalStore } from '../store/finalCotizacion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { EstanteItem, Accessory } from '../models/Interfaces';
import { ImageUploadDropzone } from './ImageUploadDropzone';
import { SectionHeader } from './cotizacion/SectionHeader';
import { resolveImageForPdf } from '../utils/pdfImageUtils';

interface CotizacionPreviewProps {
  isEdit?: boolean;
}

const tablePaperSx = {
  borderRadius: 2,
  boxShadow: 'none',
  border: 1,
  borderColor: 'grey.100',
  mb: 3,
  overflow: 'hidden',
};

const tableHeadSx = {
  bgcolor: 'grey.50',
  '& .MuiTableCell-head': {
    fontWeight: 700,
    color: 'text.secondary',
    fontSize: '0.8rem',
    borderBottom: 1,
    borderColor: 'grey.100',
  },
};

interface PiezaRowProps {
  item: EstanteItem;
}

const PiezaRow = memo(({ item }: PiezaRowProps) => (
  <TableRow sx={{ '&:last-child td': { border: 0 } }}>
    <TableCell>{item.cantidad}</TableCell>
    <TableCell sx={{ fontWeight: 600 }}>{item.pieza}</TableCell>
    <TableCell>{item.material}</TableCell>
    <TableCell>{item.ancho}</TableCell>
    <TableCell>{item.largo}</TableCell>
    <TableCell>${item.precioM2}</TableCell>
    <TableCell>${item.precioUnitario.toFixed(2)}</TableCell>
    <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>${item.precioTotal.toFixed(2)}</TableCell>
  </TableRow>
));

PiezaRow.displayName = 'PiezaRow';

interface AccesorioRowProps {
  item: Accessory;
}

const AccesorioRow = memo(({ item }: AccesorioRowProps) => (
  <TableRow sx={{ '&:last-child td': { border: 0 } }}>
    <TableCell>{item.cantidad}</TableCell>
    <TableCell sx={{ fontWeight: 600 }}>{item.nombre}</TableCell>
    <TableCell>${item.precioUnitario.toFixed(2)}</TableCell>
    <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>${item.precioTotal.toFixed(2)}</TableCell>
  </TableRow>
));

AccesorioRow.displayName = 'AccesorioRow';

const formatCreatedAt = (createdAt?: string): string => {
  if (!createdAt) return '- -';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '- -';
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const CotizacionPreview: React.FC<CotizacionPreviewProps> = ({ isEdit }) => {
  const piezas = useCotizacionStore((state) => state.items);
  const dimensiones = useCotizacionStore((state) => state.dimensiones);
  const accesorios = useAccessoryStore((state) => state.items);
  const cotizacion = useCotizacionGlobalStore((state) => state.cotizacion);
  const setCotizacion = useCotizacionGlobalStore((state) => state.setCotizacion);

  const [nombre, setNombre] = useState(isEdit ? cotizacion.nombre : '');
  const [imagenUrl, setImagenUrl] = useState<string | undefined>(
    isEdit ? cotizacion.imagenUrl : undefined
  );
  const [imagenThumbnail, setImagenThumbnail] = useState<string | undefined>(
    isEdit ? cotizacion.imagenThumbnail : undefined
  );
  const componentRef = useRef<HTMLDivElement>(null);

  const calculations = useMemo(() => {
    const totalEstantes = piezas.reduce((acc, item) => acc + item.precioTotal, 0);
    const totalAccesorios = accesorios.reduce((acc, item) => acc + item.precioTotal, 0);
    const newTotal = totalEstantes + totalAccesorios;
    const precioConIva = newTotal * 2.5;
    const calculoManoObra = newTotal + (newTotal * 0.05);
    const precioDeVenta = newTotal + calculoManoObra;

    return {
      total: newTotal,
      manoDeObra: calculoManoObra,
      precioVenta: precioDeVenta,
      precioVentaConIva: precioConIva
    };
  }, [piezas, accesorios]);

  useEffect(() => {
    setCotizacion({
      id: isEdit && cotizacion.id ? cotizacion.id : '',
      nombre,
      imagenUrl,
      imagenThumbnail,
      createdAt: isEdit ? cotizacion.createdAt : undefined,
      piezas,
      accesorios,
      manoDeObra: calculations.manoDeObra,
      total: calculations.total,
      precioVenta: calculations.precioVenta,
      precioVentaConIva: calculations.precioVentaConIva,
      dimensiones
    });
  }, [
    nombre,
    imagenUrl,
    imagenThumbnail,
    piezas,
    accesorios,
    calculations,
    dimensiones,
    setCotizacion,
    isEdit,
    cotizacion.id,
    cotizacion.createdAt
  ]);

  const handleNombreChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNombre(e.target.value);
  }, []);

  const handleImagenChange = useCallback((url: string | undefined, thumbnail?: string) => {
    setImagenUrl(url);
    setImagenThumbnail(thumbnail);
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!componentRef.current) return;
    const element = componentRef.current;

    const pdfImageDataUrl = await resolveImageForPdf(imagenUrl, imagenThumbnail);
    const liveImg = element.querySelector('[data-cotizacion-imagen="true"]') as HTMLImageElement | null;
    const originalSrc = liveImg?.src;

    if (liveImg && pdfImageDataUrl) {
      await new Promise<void>((resolve, reject) => {
        const preload = new Image();
        preload.onload = () => {
          liveImg.src = pdfImageDataUrl;
          resolve();
        };
        preload.onerror = reject;
        preload.src = pdfImageDataUrl;
      });
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        onclone: (clonedDoc) => {
          if (!pdfImageDataUrl) return;
          const img = clonedDoc.querySelector('[data-cotizacion-imagen="true"]') as HTMLImageElement | null;
          if (img) img.src = pdfImageDataUrl;
        },
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 40;
      const imgProps = pdf.getImageProperties(imgData);
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      pdf.save(`${nombre || 'cotizacion'}.pdf`);
    } finally {
      if (liveImg && originalSrc) {
        liveImg.src = originalSrc;
      }
    }
  }, [nombre, imagenUrl, imagenThumbnail]);

  const piezaRows = useMemo(
    () => piezas.map((item) => <PiezaRow key={item.id} item={item} />),
    [piezas]
  );

  const accesorioRows = useMemo(
    () => accesorios.map((item) => <AccesorioRow key={item.id} item={item} />),
    [accesorios]
  );

  const totales = [
    { label: 'Total materiales', value: calculations.total },
    { label: 'Mano de obra', value: calculations.manoDeObra },
    { label: 'Precio de venta', value: calculations.precioVenta },
    { label: 'Precio con IVA', value: calculations.precioVentaConIva, highlight: true },
  ];

  return (
    <Box>
      <Button
        variant="contained"
        startIcon={<DownloadIcon />}
        onClick={handleDownloadPdf}
        sx={{
          mb: 3,
          borderRadius: 2,
          px: 3,
          py: 1.25,
          fontWeight: 700,
          letterSpacing: 0.5,
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 12px rgba(233,30,99,0.3)' },
        }}
      >
        Descargar PDF
      </Button>

      <div ref={componentRef}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: 'grey.900' }}>
          Resumen de Cotización
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Revisa los detalles de tu proyecto antes de descargar tu cotización.
        </Typography>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            mb: 4,
            borderRadius: 3,
            border: 1,
            borderColor: 'grey.100',
            bgcolor: 'background.paper',
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                Nombre de la Cotización
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  border: 1,
                  borderColor: 'grey.200',
                  borderRadius: 2,
                  px: 2,
                  py: 1.5,
                  bgcolor: 'grey.50',
                  mb: 2.5,
                }}
              >
                <DescriptionOutlinedIcon sx={{ color: 'primary.main' }} />
                <InputBase
                  fullWidth
                  placeholder="Ej. MAMPARA DUPLEX"
                  value={nombre}
                  onChange={handleNombreChange}
                  sx={{
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: 'grey.900',
                    '& input::placeholder': { fontWeight: 400, opacity: 0.6 },
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  bgcolor: 'primary.50',
                  borderRadius: 2,
                  px: 2,
                  py: 1.5,
                  border: 1,
                  borderColor: 'primary.100',
                }}
              >
                <CalendarTodayOutlinedIcon sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Fecha de creación
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatCreatedAt(cotizacion.createdAt)}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                Imagen de la cotización
              </Typography>
              <ImageUploadDropzone
                value={imagenUrl}
                thumbnail={imagenThumbnail}
                cotizacionNombre={nombre}
                onChange={handleImagenChange}
                variant="hero"
              />
            </Grid>
          </Grid>
        </Paper>

        <SectionHeader icon={<Inventory2OutlinedIcon />} title="Piezas" />
        <TableContainer component={Paper} sx={tablePaperSx}>
          <Table size="small">
            <TableHead sx={tableHeadSx}>
              <TableRow>
                <TableCell>Cant.</TableCell>
                <TableCell>Pieza</TableCell>
                <TableCell>Material</TableCell>
                <TableCell>Ancho</TableCell>
                <TableCell>Largo</TableCell>
                <TableCell>P/M²</TableCell>
                <TableCell>P/Unit.</TableCell>
                <TableCell>P/Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{piezaRows}</TableBody>
          </Table>
        </TableContainer>

        <SectionHeader icon={<BuildOutlinedIcon />} title="Accesorios" />
        <TableContainer component={Paper} sx={tablePaperSx}>
          <Table size="small">
            <TableHead sx={tableHeadSx}>
              <TableRow>
                <TableCell>Cant.</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>P/Unit.</TableCell>
                <TableCell>P/Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{accesorioRows}</TableBody>
          </Table>
        </TableContainer>

        <SectionHeader icon={<PaymentsOutlinedIcon />} title="Totales" />
        <Grid container spacing={2}>
          {totales.map(({ label, value, highlight }) => (
            <Grid item xs={12} sm={6} md={3} key={label}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: 1,
                  borderColor: highlight ? 'primary.main' : 'grey.100',
                  bgcolor: highlight ? 'primary.50' : 'grey.50',
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  {label}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 800, color: highlight ? 'primary.main' : 'text.primary' }}
                >
                  ${value.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </div>
    </Box>
  );
};
