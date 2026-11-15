import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/shared/hooks/useTranslation';
import { printableBarcode } from '@/shared/validation/product';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

interface ProductBarcodeLabelProps {
  name: string;
  price: number;
  sku: string;
  barcode: string;
  currency?: string;
}

export function ProductBarcodeLabel({ name, price, sku, barcode, currency }: ProductBarcodeLabelProps) {
  const { t, locale } = useTranslation();
  const barcodeRef = useRef<SVGSVGElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    if (!barcode || !printableBarcode.test(barcode)) {
      setFailed(true);
      return;
    }
    if (barcodeRef.current) {
      const options = { displayValue: true, margin: 0, marginLeft: 17, marginRight: 11, height: 48, width: 1.5 };
      try {
        try {
          JsBarcode(barcodeRef.current, barcode, { ...options, format: /^\d{13}$/.test(barcode) ? 'EAN13' : 'CODE128' });
        } catch {
          JsBarcode(barcodeRef.current, barcode, { ...options, format: 'CODE128' });
        }
      } catch {
        setFailed(true);
      }
    }
    if (qrRef.current) {
      void QRCode.toCanvas(qrRef.current, barcode, { width: 88, margin: 1 }).catch(() => {
        if (active) setFailed(true);
      });
    }
    return () => { active = false; };
  }, [barcode]);

  return (
    <div className="print-label flex w-[360px] items-center gap-3 rounded border border-border bg-white p-3 text-black">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{name}</p>
        <p className="text-xs">SKU: {sku}</p>
        <svg ref={barcodeRef} className="mt-2 max-w-full" aria-label={`${t('inventory.product.barcode')} ${barcode}`} />
        {failed && <p role="alert" className="text-xs">{t('inventory.product.labelError')}</p>}
        <p className="mt-1 text-lg font-bold">{new Intl.NumberFormat(locale, currency ? { style: 'currency', currency } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)}</p>
      </div>
      <canvas ref={qrRef} aria-label={`Código QR ${barcode}`} />
    </div>
  );
}
