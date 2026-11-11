import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface ProductBarcodeLabelProps {
  name: string;
  price: number;
  sku: string;
  barcode: string;
}

export function ProductBarcodeLabel({ name, price, sku, barcode }: ProductBarcodeLabelProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (barcodeRef.current) {
      JsBarcode(barcodeRef.current, barcode, {
        format: 'CODE128',
        displayValue: true,
        margin: 0,
        height: 48,
        width: 1.5,
      });
    }
    if (qrRef.current) {
      void QRCode.toCanvas(qrRef.current, barcode, { width: 88, margin: 1 });
    }
  }, [barcode]);

  return (
    <div className="print-label flex w-[360px] items-center gap-3 rounded border border-border bg-white p-3 text-black">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{name}</p>
        <p className="text-xs">SKU: {sku}</p>
        <svg ref={barcodeRef} className="mt-2 max-w-full" aria-label={`Código de barras ${barcode}`} />
        <p className="mt-1 text-lg font-bold">{price.toFixed(2)}</p>
      </div>
      <canvas ref={qrRef} aria-label={`Código QR ${barcode}`} />
    </div>
  );
}
