import React, { useRef } from "react";
import { useLocation } from "react-router-dom";
import { PlanosDeCortePorMaterial } from "./PlanosCorte";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button, Paper, Typography, Box, Divider } from "@mui/material";

interface TubeResult {
  material: string;
  totalLargo: number;
  tubeLength: number;
  tubosNecesarios: number;
  piezas: { pieza: string; largo: number; cantidad: number }[];
}

export const PlanosPage: React.FC = () => {
  const location = useLocation();
  const planos = location.state?.planos ?? [];
  const tubos: TubeResult[] = location.state?.tubos ?? [];

  const pdfRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    const pdf = new jsPDF("portrait", "pt", "a4");

    const pages = document.querySelectorAll(".pdf-hoja");

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i] as HTMLElement;

      const canvas = await html2canvas(page, {
        scale: 3,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    }

    pdf.save("planos_corte.pdf");
  };

  return (
    <div style={{ padding: "24px" }}>
      <Button
        variant="contained"
        color="primary"
        onClick={handleDownloadPDF}
        sx={{ mb: 2 }}
      >
        Descargar PDF
      </Button>

      {/* Tube materials summary */}
      {tubos.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: "#f5f5f5" }}>
          <Typography variant="h5" gutterBottom sx={{ color: "#1976d2", fontWeight: "bold" }}>
            📏 Resumen de Tubos
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {tubos.map((tubo, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
                {tubo.material}
              </Typography>
              
              <Box sx={{ pl: 2, mt: 1 }}>
                {/* Prominent tube count display */}
                <Box sx={{ 
                  display: "inline-block",
                  backgroundColor: "#d32f2f", 
                  color: "white", 
                  px: 3, 
                  py: 1.5, 
                  borderRadius: 2,
                  mb: 2
                }}>
                  <Typography variant="h4" sx={{ fontWeight: "bold", textAlign: "center" }}>
                    🔧 {tubo.tubosNecesarios} {tubo.tubosNecesarios === 1 ? "TUBO" : "TUBOS"}
                  </Typography>
                </Box>

                <Typography variant="body1">
                  <strong>Largo del tubo:</strong> {tubo.tubeLength} m
                </Typography>
                <Typography variant="body1">
                  <strong>Total largo requerido:</strong> {tubo.totalLargo.toFixed(2)} m
                </Typography>
                
                <Box sx={{ mt: 1.5, pl: 1, borderLeft: "3px solid #1976d2" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 0.5 }}>
                    Piezas:
                  </Typography>
                  {tubo.piezas.map((pieza, pIdx) => (
                    <Typography key={pIdx} variant="body2" sx={{ color: "#666" }}>
                      • {pieza.pieza}: {pieza.largo} m × {pieza.cantidad} = {(pieza.largo * pieza.cantidad).toFixed(2)} m
                    </Typography>
                  ))}
                </Box>
              </Box>
              
              {index < tubos.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </Paper>
      )}

      {/* Lo que se convierte en PDF */}
      <div ref={pdfRef}>
        <PlanosDeCortePorMaterial planos={planos} />
      </div>
    </div>
  );
};
