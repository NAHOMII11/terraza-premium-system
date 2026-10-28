import { branchLabel } from '../lib/format';

export interface Invoice {
  pedidoId: number;
  sedeNombre?: string;
  mesaNumero?: number;
  meseroNombre?: string;
  cajeroNombre?: string;
  metodoPago?: string;
  estado?: string;
  total: number;
  fechaApertura?: string;
  fechaCierre?: string;
  detalles?: {
    productoNombre: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
  }[];
  pago?: {
    metodoPago?: string;
    monto?: number;
    cambio?: number;
    cajeroNombre?: string;
    fechaPago?: string;
  } | null;
}

function methodLabel(value?: string) {
  if (value === 'EFECTIVO') return 'Cash';
  if (value === 'TARJETA_CREDITO') return 'Credit card';
  if (value === 'TARJETA_DEBITO') return 'Debit card';
  return value || '—';
}

function when(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function money(value: number | string | null | undefined) {
  return Math.round(Number(value) || 0).toLocaleString('en-US');
}

export default function InvoiceView({
  invoice,
  onClose,
}: {
  invoice: Invoice;
  onClose: () => void;
}) {
  const number = `TP-${String(invoice.pedidoId).padStart(4, '0')}`;
  const paid = invoice.estado === 'CERRADO' || !!invoice.pago;

  return (
    <div className="fixed inset-0 bg-black/65 flex items-center justify-center p-4 z-50">
      <div
        className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl"
        style={{
          background: 'linear-gradient(180deg, #0c1c30 0%, #071525 100%)',
          border: '1px solid rgba(146, 98, 8, 0.45)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
        }}
      >
        <div className="px-7 pt-6 pb-4 flex items-start justify-between gap-4" style={{ borderBottom: '1px solid rgba(146, 98, 8, 0.28)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ border: '1px solid rgba(146, 98, 8, 0.55)', color: '#926208' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 3h8l-4 8v10M9.5 21h5M4 3c2.4 2.2 4 4.8 4 8M20 3c-2.4 2.2-4 4.8-4 8" />
              </svg>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.32em]" style={{ color: '#926208' }}>Terraza Premium</p>
              <h3 className="font-display text-[1.7rem] leading-none mt-1" style={{ color: '#f7f2e9' }}>Invoice</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-xl" style={{ color: '#f7f2e9' }}>{number}</p>
            <span
              className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs uppercase tracking-widest"
              style={{
                background: paid ? 'rgba(34,120,70,0.28)' : 'rgba(146, 98, 8,0.2)',
                color: paid ? '#b7e4c7' : '#926208',
              }}
            >
              {paid ? 'Paid' : 'Open'}
            </span>
          </div>
        </div>

        <div className="px-7 py-5 grid grid-cols-2 gap-x-6 gap-y-3 text-base">
          <div>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#926208' }}>Branch</p>
            <p style={{ color: '#f7f2e9' }}>{branchLabel(invoice.sedeNombre) || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#926208' }}>Table</p>
            <p style={{ color: '#f7f2e9' }}>{invoice.mesaNumero ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#926208' }}>Issued</p>
            <p style={{ color: '#f7f2e9' }}>{when(invoice.pago?.fechaPago || invoice.fechaCierre || invoice.fechaApertura)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#926208' }}>Waiter</p>
            <p style={{ color: '#f7f2e9' }}>{invoice.meseroNombre || '—'}</p>
          </div>
        </div>

        <div className="px-7">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(146, 98, 8, 0.28)' }}>
                <th className="text-left py-2 text-xs uppercase tracking-widest" style={{ color: '#926208' }}>Description</th>
                <th className="text-right py-2 text-xs uppercase tracking-widest" style={{ color: '#926208' }}>Qty</th>
                <th className="text-right py-2 text-xs uppercase tracking-widest" style={{ color: '#926208' }}>Unit</th>
                <th className="text-right py-2 text-xs uppercase tracking-widest" style={{ color: '#926208' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.detalles || []).map((line, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(247, 242, 233, 0.08)' }}>
                  <td className="py-2.5 pr-2 text-[15px]" style={{ color: '#f7f2e9' }}>{line.productoNombre}</td>
                  <td className="py-2.5 text-right" style={{ color: '#a7afbc' }}>{line.cantidad}</td>
                  <td className="py-2.5 text-right" style={{ color: '#a7afbc' }}>{money(line.precioUnitario)}</td>
                  <td className="py-2.5 text-right" style={{ color: '#f7f2e9' }}>{money(line.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-7 py-5 flex justify-end">
          <div className="w-56 rounded-xl px-4 py-3" style={{ background: 'rgba(146, 98, 8, 0.12)', border: '1px solid rgba(146, 98, 8, 0.28)' }}>
            <p className="text-xs uppercase tracking-widest" style={{ color: '#926208' }}>Total</p>
            <p className="font-display text-[2.1rem]" style={{ color: '#f7f2e9' }}>{money(invoice.total)}</p>
          </div>
        </div>

        {invoice.pago && (
          <div className="mx-7 mb-5 rounded-xl px-4 py-3 grid grid-cols-2 gap-3" style={{ background: '#10243d', border: '1px solid rgba(146, 98, 8, 0.2)' }}>
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#926208' }}>Payment</p>
              <p className="text-[15px]" style={{ color: '#f7f2e9' }}>{methodLabel(invoice.pago.metodoPago)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#926208' }}>Cashier</p>
              <p className="text-[15px]" style={{ color: '#f7f2e9' }}>{invoice.pago.cajeroNombre || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#926208' }}>Received</p>
              <p className="text-[15px]" style={{ color: '#f7f2e9' }}>{money(invoice.pago.monto)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: '#926208' }}>Change</p>
              <p className="text-[15px]" style={{ color: '#f7f2e9' }}>{money(invoice.pago.cambio)}</p>
            </div>
          </div>
        )}

        <p className="px-7 pb-2 text-center italic text-base" style={{ color: '#926208' }}>
          The best moments are shared here
        </p>
        <p className="px-7 pb-4 text-center text-xs uppercase tracking-widest" style={{ color: '#a7afbc' }}>
          On-screen invoice · Terraza Premium
        </p>

        <div className="px-7 pb-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg border text-sm"
            style={{ borderColor: 'rgba(146, 98, 8,0.4)', color: '#f7f2e9' }}
          >
            Print
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: '#926208', color: '#071525' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
