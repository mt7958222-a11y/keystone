import type { WorkOrderStatus } from '../types';

export default function StatusBadge({ status }: { status: WorkOrderStatus }) {
  return <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>;
}
