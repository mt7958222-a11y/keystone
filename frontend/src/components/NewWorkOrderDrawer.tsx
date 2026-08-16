import { useEffect, useState } from 'react';
import { createWorkOrder, fetchCustomers, fetchSites } from '../api/client';
import type { Customer, Priority, Site } from '../types';
import { useAuth } from '../context/AuthContext';

export default function NewWorkOrderDrawer({
  onClose,
  onCreated,
  fixedCustomerId,
}: {
  onClose: () => void;
  onCreated: () => void;
  fixedCustomerId?: number;
}) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [customerId, setCustomerId] = useState<number | ''>(fixedCustomerId ?? '');
  const [siteId, setSiteId] = useState<number | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!fixedCustomerId && user?.role !== 'CUSTOMER') {
      fetchCustomers().then((p) => setCustomers(p.content));
    }
  }, [fixedCustomerId, user]);

  useEffect(() => {
    if (typeof customerId === 'number') {
      fetchSites(customerId).then(setSites);
    } else {
      setSites([]);
    }
  }, [customerId]);

  async function handleSubmit() {
    setError(null);
    if (!title || !customerId || !siteId) {
      setError('Title, customer, and site are all required.');
      return;
    }
    setSaving(true);
    try {
      await createWorkOrder({
        title,
        description,
        priority,
        customerId: Number(customerId),
        siteId: Number(siteId),
      });
      onCreated();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Could not create the work order.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20,16,43,0.45)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ width: 420, height: '100%', borderRadius: 0, padding: 26, overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginBottom: 4 }}>New work order</h2>
        <p style={{ color: 'var(--text-600)', fontSize: 13, marginBottom: 18 }}>
          Raise a request. It enters the pipeline as NEW until a dispatcher assigns it.
        </p>

        {error && <div className="error-banner">{error}</div>}

        {!fixedCustomerId && user?.role !== 'CUSTOMER' && (
          <div className="field">
            <label>Customer</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label>Site</label>
          <select value={siteId} onChange={(e) => setSiteId(e.target.value ? Number(e.target.value) : '')} disabled={!customerId}>
            <option value="">Select a site…</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AC unit not cooling" />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's happening, and where" />
        </div>

        <div className="field">
          <label>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating…' : 'Create work order'}
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
