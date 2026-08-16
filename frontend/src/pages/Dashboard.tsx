import { useEffect, useState } from 'react';
import { fetchReportSummary } from '../api/client';
import type { ReportSummary } from '../types';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In progress',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};

export default function Dashboard() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  useEffect(() => {
    fetchReportSummary().then(setSummary);
  }, []);

  if (!summary) return <div className="empty-state">Loading dashboard…</div>;

  const maxCount = Math.max(1, ...Object.values(summary.countsByStatus));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Operations</div>
          <h1>Dashboard</h1>
          <p>What's overdue, who's overloaded, and whether the team is hitting its SLAs.</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className={`stat-card ${summary.overdueCount > 0 ? 'alert' : 'good'}`}>
          <div className="label">Overdue / at risk</div>
          <div className="value">{summary.overdueCount}</div>
        </div>
        <div className={`stat-card ${summary.slaComplianceRate >= 90 ? 'good' : ''}`}>
          <div className="label">SLA compliance</div>
          <div className="value">{summary.slaComplianceRate}%</div>
        </div>
        <div className="stat-card">
          <div className="label">Open work orders</div>
          <div className="value">
            {(summary.countsByStatus.NEW ?? 0) +
              (summary.countsByStatus.ASSIGNED ?? 0) +
              (summary.countsByStatus.IN_PROGRESS ?? 0) +
              (summary.countsByStatus.ON_HOLD ?? 0)}
          </div>
        </div>
        <div className="stat-card">
          <div className="label">Technicians active</div>
          <div className="value">{summary.byTechnician.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
        <div className="card card-pad">
          <div className="section-title" style={{ marginTop: 0 }}>
            Work orders by status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(summary.countsByStatus).map(([status, count]) => (
              <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 100, fontSize: 12.5, color: 'var(--text-600)' }}>{STATUS_LABELS[status] ?? status}</div>
                <div style={{ flex: 1, background: 'var(--slate-100)', borderRadius: 6, height: 18, position: 'relative' }}>
                  <div
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      background: 'var(--violet-500)',
                      height: '100%',
                      borderRadius: 6,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <div style={{ width: 26, textAlign: 'right', fontSize: 12.5, fontWeight: 700 }}>{count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-pad">
          <div className="section-title" style={{ marginTop: 0 }}>
            Load by technician
          </div>
          {summary.byTechnician.length === 0 && <div className="empty-state">No technicians yet.</div>}
          {summary.byTechnician.map((t) => (
            <div key={t.technicianId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{t.technicianName}</span>
              <span style={{ fontSize: 12.5, color: t.overdueCount > 0 ? 'var(--red-600)' : 'var(--text-600)' }}>
                {t.openCount} open{t.overdueCount > 0 ? ` · ${t.overdueCount} overdue` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
