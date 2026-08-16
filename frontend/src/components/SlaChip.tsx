export default function SlaChip({ dueAt, breached }: { dueAt: string; breached: boolean }) {
  const due = new Date(dueAt);
  const label = breached
    ? `Overdue since ${due.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
    : `Due ${due.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
  return <span className={`sla-chip ${breached ? 'breach' : 'ok'}`}>{label}</span>;
}
