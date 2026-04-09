const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active:      { label: 'アクティブ', className: 'bg-green-100 text-green-800' },
  pending:     { label: '対応中',     className: 'bg-yellow-100 text-yellow-800' },
  negotiating: { label: '商談中',     className: 'bg-blue-100 text-blue-800' },
  closed_win:  { label: '受注',       className: 'bg-emerald-100 text-emerald-800' },
  closed_lose: { label: '失注',       className: 'bg-red-100 text-red-700' },
  inactive:    { label: '非アクティブ', className: 'bg-gray-100 text-gray-600' },
}

export default function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-gray-300 text-xs">—</span>
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}
