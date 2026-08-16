import type { Priority } from '../types';

export default function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`badge badge-priority-${priority}`}>{priority}</span>;
}
