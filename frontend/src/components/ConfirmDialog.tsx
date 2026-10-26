interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
      <div className="rounded-2xl max-w-sm w-full p-6" style={{ background: '#0b1a2a', border: '1px solid rgba(146, 98, 8,0.35)' }}>
        <h3 className="font-display text-2xl mb-2" style={{ color: '#f7f1e6' }}>
          {title}
        </h3>
        <p className="text-sm mb-6" style={{ color: 'rgba(244,239,230,0.78)' }}>{message}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border text-sm"
            style={{ borderColor: 'rgba(146, 98, 8,0.35)', color: '#f7f1e6' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--bar-gold)', color: '#0c2340' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
