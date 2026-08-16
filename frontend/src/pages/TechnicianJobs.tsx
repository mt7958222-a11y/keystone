import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWorkOrders } from '../api/client';
import type { WorkOrderSummary } from '../types';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import SlaChip from '../components/SlaChip';

export default function TechnicianJobs() {
  const [jobs, setJobs] = useState<WorkOrderSummary[]>([]);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkOrders().then((p) => setJobs(p.content));
  }, []);

  const visible = filter === 'active' ? jobs.filter((j) => !['CLOSED', 'CANCELLED'].includes(j.status)) : jobs;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Field view</div>
          <h1>My Jobs</h1>
          <p>Everything assigned to you. Tap a job to update it from site.</p>
        </div>
      </div>

      <div className="pill-row">
        <button className={`pill ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>
          Active
        </button>
        <button className={`pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All
        </button>
      </div>

      {visible.length === 0 ? (
        <div className="empty-state">Nothing here right now.</div>
      ) : (
        <div className="job-list">
          {visible.map((j) => (
            <div key={j.id} className="card card-pad" style={{ cursor: 'pointer' }} onClick={() => navigate(`/work-orders/${j.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="code" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-400)' }}>
                    {j.code}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, margin: '4px 0' }}>{j.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-600)' }}>
                    {j.customerName} · {j.siteName}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <StatusBadge status={j.status} />
                  <PriorityBadge priority={j.priority} />
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <SlaChip dueAt={j.slaDueAt} breached={j.slaBreached} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
