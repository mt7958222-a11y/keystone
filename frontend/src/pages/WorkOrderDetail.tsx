import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  assignWorkOrder,
  changeStatus,
  fetchParts,
  fetchTechnicians,
  fetchWorkOrder,
  logParts,
  logTime,
} from '../api/client';
import type { Part, Technician, WorkOrder, WorkOrderStatus } from '../types';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SlaChip from '../components/SlaChip';
import { useAuth } from '../context/AuthContext';

const NEXT_ACTIONS: Record<WorkOrderStatus, { to: WorkOrderStatus; label: string }[]> = {
  NEW: [{ to: 'CANCELLED', label: 'Cancel' }],
  ASSIGNED: [
    { to: 'IN_PROGRESS', label: 'Start work' },
    { to: 'CANCELLED', label: 'Cancel' },
  ],
  IN_PROGRESS: [
    { to: 'ON_HOLD', label: 'Put on hold' },
    { to: 'COMPLETED', label: 'Mark complete' },
  ],
  ON_HOLD: [{ to: 'IN_PROGRESS', label: 'Resume' }],
  COMPLETED: [
    { to: 'CLOSED', label: 'Close job' },
    { to: 'IN_PROGRESS', label: 'Reopen' },
  ],
  CLOSED: [],
  CANCELLED: [],
};

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [selectedTech, setSelectedTech] = useState<number | ''>('');
  const [selectedPart, setSelectedPart] = useState<number | ''>('');
  const [partQty, setPartQty] = useState(1);
  const [minutes, setMinutes] = useState(30);
  const [timeNote, setTimeNote] = useState('');

  async function load() {
    if (!id) return;
    const data = await fetchWorkOrder(Number(id));
    setWo(data);
  }

  useEffect(() => {
    load();
    if (user?.role === 'DISPATCHER' || user?.role === 'MANAGER') {
      fetchTechnicians().then(setTechnicians);
    }
    fetchParts().then(setParts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!wo) return <div className="empty-state">Loading work order…</div>;

  const canDispatch = user?.role === 'DISPATCHER' || user?.role === 'MANAGER';
  const isAssignedTech = user?.role === 'TECHNICIAN' && wo.assignedToId === user.userId;
  const canLogField = isAssignedTech;

  async function runAction(fn: () => Promise<WorkOrder>) {
    setError(null);
    setBusy(true);
    try {
      const updated = await fn();
      setWo(updated);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'That action was not allowed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="page-header">
        <div>
          <div className="eyebrow">{wo.code}</div>
          <h1>{wo.title}</h1>
          <p>
            {wo.customerName} · {wo.siteName}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <PriorityBadge priority={wo.priority} />
          <StatusBadge status={wo.status} />
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div>
          <div className="card card-pad" style={{ marginBottom: 18 }}>
            <div className="section-title" style={{ marginTop: 0 }}>
              Details
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-900)', lineHeight: 1.5 }}>
              {wo.description || 'No description provided.'}
            </p>
            <div style={{ display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap' }}>
              <div>
                <div className="field-label-like">Assigned to</div>
                <strong>{wo.assignedToName ?? 'Unassigned'}</strong>
              </div>
              <div>
                <div className="field-label-like">SLA</div>
                <SlaChip dueAt={wo.slaDueAt} breached={wo.slaBreached} />
              </div>
              <div>
                <div className="field-label-like">Parts cost</div>
                <strong>${wo.partsCost.toFixed(2)}</strong>
              </div>
              <div>
                <div className="field-label-like">Time logged</div>
                <strong>{wo.totalMinutesLogged} min</strong>
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <div className="section-title" style={{ marginTop: 0 }}>
              Status history
            </div>
            {wo.history.map((h, idx) => (
              <div className="timeline-item" key={idx}>
                <div className="dot" />
                <div>
                  <div>
                    <strong>{h.toStatus}</strong>
                    {h.fromStatus && h.fromStatus !== h.toStatus ? ` (from ${h.fromStatus})` : ''} — {h.changedByName}
                  </div>
                  {h.note && <div style={{ color: 'var(--text-600)' }}>{h.note}</div>}
                  <div className="when">{new Date(h.changedAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {canDispatch && (
            <div className="card card-pad" style={{ marginBottom: 16 }}>
              <div className="section-title" style={{ marginTop: 0 }}>
                Dispatch
              </div>
              <div className="field">
                <label>Assign to technician</label>
                <select value={selectedTech} onChange={(e) => setSelectedTech(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Select…</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary btn-sm"
                disabled={!selectedTech || busy}
                onClick={() => runAction(() => assignWorkOrder(wo.id, Number(selectedTech)))}
              >
                Assign
              </button>
            </div>
          )}

          <div className="card card-pad" style={{ marginBottom: 16 }}>
            <div className="section-title" style={{ marginTop: 0 }}>
              Lifecycle
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {NEXT_ACTIONS[wo.status].length === 0 && (
                <span style={{ fontSize: 13, color: 'var(--text-400)' }}>Terminal state — no further action.</span>
              )}
              {NEXT_ACTIONS[wo.status].map((action) => {
                const managerOnly = action.to === 'CLOSED' || (action.to === 'IN_PROGRESS' && wo.status === 'COMPLETED');
                const dispatcherOnly = action.to === 'CANCELLED';
                const techOnly = ['IN_PROGRESS', 'ON_HOLD', 'COMPLETED'].includes(action.to) && !managerOnly;

                const allowed =
                  (managerOnly && user?.role === 'MANAGER') ||
                  (dispatcherOnly && canDispatch) ||
                  (techOnly && (isAssignedTech || user?.role === 'MANAGER'));

                return (
                  <button
                    key={action.to}
                    className={`btn btn-sm ${action.to === 'CANCELLED' ? 'btn-danger' : 'btn-ghost'}`}
                    disabled={!allowed || busy}
                    onClick={() => runAction(() => changeStatus(wo.id, action.to))}
                    title={!allowed ? 'Not permitted for your role' : ''}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>

          {canLogField && (
            <>
              <div className="card card-pad" style={{ marginBottom: 16 }}>
                <div className="section-title" style={{ marginTop: 0 }}>
                  Log parts used
                </div>
                <div className="field">
                  <label>Part</label>
                  <select value={selectedPart} onChange={(e) => setSelectedPart(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">Select…</option>
                    {parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.stockQty} in stock)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Quantity</label>
                  <input type="number" min={1} value={partQty} onChange={(e) => setPartQty(Number(e.target.value))} />
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={!selectedPart || busy}
                  onClick={() => runAction(() => logParts(wo.id, Number(selectedPart), partQty))}
                >
                  Log part usage
                </button>
              </div>

              <div className="card card-pad">
                <div className="section-title" style={{ marginTop: 0 }}>
                  Log time
                </div>
                <div className="field">
                  <label>Minutes</label>
                  <input type="number" min={1} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
                </div>
                <div className="field">
                  <label>Note (optional)</label>
                  <input value={timeNote} onChange={(e) => setTimeNote(e.target.value)} placeholder="What did you do?" />
                </div>
                <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => runAction(() => logTime(wo.id, minutes, timeNote))}>
                  Log time
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
