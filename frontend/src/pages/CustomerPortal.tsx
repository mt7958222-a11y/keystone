import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWorkOrders } from '../api/client';
import type { WorkOrderSummary } from '../types';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { useAuth } from '../context/AuthContext';
import NewWorkOrderDrawer from '../components/NewWorkOrderDrawer';

export default function CustomerPortal() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<WorkOrderSummary[]>([]);
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();

  async function load() {
    const page = await fetchWorkOrders();
    setOrders(page.content);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Self-service</div>
          <h1>My Requests</h1>
          <p>Raise a request and track it through to close-out — no phone calls needed.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          + Raise a request
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">You haven't raised any requests yet.</div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Title</th>
                <th>Site</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="clickable" onClick={() => navigate(`/work-orders/${o.id}`)}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{o.code}</td>
                  <td>{o.title}</td>
                  <td>{o.siteName}</td>
                  <td>
                    <PriorityBadge priority={o.priority} />
                  </td>
                  <td>
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && user?.customerId && (
        <NewWorkOrderDrawer
          fixedCustomerId={user.customerId}
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
