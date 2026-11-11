interface Props {
  onClose: () => void;
}

const GROUPS = [
  {
    title: 'Búsqueda',
    keys: [
      { combo: 'F2', desc: 'Buscar producto' },
      { combo: '/', desc: 'Buscar producto' },
      { combo: 'F4', desc: 'Buscar cliente' },
    ],
  },
  {
    title: 'Carrito',
    keys: [
      { combo: '↑ ↓', desc: 'Navegar líneas' },
      { combo: 'Home', desc: 'Ir al inicio' },
      { combo: 'End', desc: 'Ir al final' },
      { combo: '+', desc: 'Aumentar cantidad' },
      { combo: '-', desc: 'Disminuir cantidad' },
      { combo: 'Supr', desc: 'Eliminar línea' },
      { combo: 'Ctrl+D', desc: 'Disminuir cantidad' },
      { combo: 'Ctrl+X', desc: 'Eliminar línea' },
    ],
  },
  {
    title: 'Cobro',
    keys: [
      { combo: 'F8', desc: 'Abrir cobro' },
      { combo: 'Enter', desc: 'Confirmar pago' },
      { combo: 'ESC', desc: 'Cancelar / Cerrar panel' },
    ],
  },
  {
    title: 'General',
    keys: [
      { combo: '?', desc: 'Mostrar ayuda' },
      { combo: 'Ctrl+N', desc: 'Nueva venta' },
      { combo: 'Ctrl+P', desc: 'Imprimir ticket' },
    ],
  },
];

export function KeyboardHelpOverlay({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      tabIndex={-1}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-surface p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Atajos de teclado</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-secondary"
          >
            ✕
          </button>
        </div>
        {GROUPS.map((group) => (
          <div key={group.title} className="mb-4 last:mb-0">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.keys.map((k) => (
                <div key={k.combo} className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-surface-hover">
                  <span className="text-sm text-text-secondary">{k.desc}</span>
                  <kbd className="rounded border border-border bg-surface-hover px-2 py-0.5 font-mono text-xs text-text-primary">
                    {k.combo}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
