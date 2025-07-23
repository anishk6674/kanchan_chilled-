import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import { CreditCard } from 'lucide-react'
import html2canvas from 'html2canvas';
import Button from '../components/ui/Button';


const DownloadPdfDynamic = () => {
  const contentRef = useRef(null); // Ref to the HTML element you want to convert to PDF

  const generatePdf = async () => {
    if (!contentRef.current) {
      console.error("Content ref is not attached to an element.");
      return;
    }

    const input = contentRef.current;

    // Use html2canvas to render the HTML content to a canvas
    const canvas = await html2canvas(input, {
      scale: 2, // Increase scale for better resolution
      useCORS: true, // If you have images from other domains
    });

    // Create a new jsPDF instance
    const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for A4 size

    // Calculate dimensions to fit the canvas onto the PDF page
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add the image to the PDF
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // If the content is longer than one page, add new pages
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF
    pdf.save('dynamic-content.pdf');
  };

  return (
    <div>
    
    <Button
          variant="primary"
          icon={<CreditCard size={16} />}
          className="mt-3 sm:mt-0"
          onClick={generatePdf}
        >
          Generate Bills
        </Button>
      
      <div
        ref={contentRef}
        style={{
          padding: '20px',
          border: '1px solid #ccc',
          marginTop: '20px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h3>Content to be included in the PDF</h3>
        <p>This is some example text that will be converted into a PDF.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
        <p>
          You can put any HTML content here. Images and complex layouts might require
          more fine-tuning with `html2canvas` and `jsPDF` options.
        </p>
        <img
          src="https://via.placeholder.com/150" // Example image (ensure it's accessible)
          alt="Placeholder"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </div>
  );
};

export default DownloadPdfDynamic;