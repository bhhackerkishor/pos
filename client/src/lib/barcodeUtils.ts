import JsBarcode from 'jsbarcode';

export function generateBarcode(element: SVGElement | HTMLCanvasElement | string, value: string, options: any = {}) {
    try {
        JsBarcode(element, value, {
            format: "CODE128",
            lineColor: "#000",
            width: 2,
            height: 40,
            displayValue: true,
            fontSize: 14,
            ...options
        });
    } catch (error) {
        console.error('Barcode generation failed:', error);
    }
}

/**
 * For a product, we usually want to print:
 * - Shop Name
 * - Product Name
 * - MRP / Selling Price
 * - Barcode
 */
export const barcodePrintStyles = `
    @media print {
        .barcode-label {
            width: 50mm;
            height: 25mm;
            padding: 2mm;
            border: 1px solid #eee;
            margin: 0 auto;
            text-align: center;
            font-family: Arial, sans-serif;
            page-break-inside: avoid;
        }
        .shop-name { font-size: 10px; font-weight: bold; margin-bottom: 2px; }
        .product-name { font-size: 8px; margin-bottom: 2px; }
        .price-section { font-size: 12px; font-weight: bold; margin-bottom: 2px; }
        .barcode-svg { width: 100%; height: auto; }
    }
`;
