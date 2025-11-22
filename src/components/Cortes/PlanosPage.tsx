import React, { useRef } from "react";
import { useLocation } from "react-router-dom";
import { PlanosDeCortePorMaterial } from "./PlanosCorte";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@mui/material";

export const PlanosPage: React.FC = () => {
  const location = useLocation();
  const planos = location.state?.planos ?? [];

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

      {/* Lo que se convierte en PDF */}
      <div ref={pdfRef}>
        <PlanosDeCortePorMaterial planos={planos} />
      </div>
    </div>
  );
};
