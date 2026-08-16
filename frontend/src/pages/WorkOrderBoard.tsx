import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWorkOrders } from '../api/client';
import type { WorkOrderStatus, WorkOrderSummary } from '../types';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SlaChip from '../components/SlaChip';
import NewWorkOrderDrawer from '../components/NewWorkOrderDrawer';

const COLUMNS: WorkOrderStatus[] = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED'];

export default function WorkOrderBoard() {
  const [orders, setOrders] = useState<WorkOrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    const page = await fetchWorkOrders();
    setOrders(page.content);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const byColumn = (status: WorkOrderStatus) => orders.filter((o) => o.status === status);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Dispatch</div>
          <h1>Work Order Board</h1>
          <p>Every open job, at a glance. Click a card for the full lifecycle and history.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          + New work order
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading board…</div>
      ) : (
        <div className="board">
          {COLUMNS.map((status) => (
            <div className="board-column" key={status}>
              <h3>
                <span>{status.replace('_', ' ')}</span>
                <span>{byColumn(status).length}</span>
              </h3>
              {byColumn(status).length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-400)', padding: '6px 2px' }}>Nothing here</div>
              )}
              {byColumn(status).map((wo) => (
                <div className="board-card" key={wo.id} onClick={() => navigate(`/work-orders/${wo.id}`)}>
                  <div className="code">{wo.code}</div>
                  <div className="title">{wo.title}</div>
                  <div className="meta">
                    <PriorityBadge priority={wo.priority} />
                    <SlaChip dueAt={wo.slaDueAt} breached={wo.slaBreached} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-600)' }}>
                    {wo.siteName} · {wo.assignedToName ?? 'Unassigned'}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <NewWorkOrderDrawer
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            load();
          }}
        />
      )}
    </div>
  );
}
