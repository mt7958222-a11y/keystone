import { useEffect, useState } from 'react';
import { createCustomer, createSite, fetchCustomers, fetchSites } from '../api/client';
import type { Customer, Site } from '../types';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [sites, setSites] = useState<Site[]>([]);

  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const [showNewSite, setShowNewSite] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');

  async function loadCustomers() {
    const page = await fetchCustomers();
    setCustomers(page.content);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selected) fetchSites(selected.id).then(setSites);
  }, [selected]);

  async function handleAddCustomer() {
    if (!newName) return;
    await createCustomer({ name: newName, contactEmail: newEmail });
    setNewName('');
    setNewEmail('');
    setShowNewCustomer(false);
    loadCustomers();
  }

  async function handleAddSite() {
    if (!selected || !siteName || !siteAddress) return;
    await createSite(selected.id, { name: siteName, address: siteAddress });
    setSiteName('');
    setSiteAddress('');
    setShowNewSite(false);
    fetchSites(selected.id).then(setSites);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Accounts</div>
          <h1>Customers & Sites</h1>
          <p>Every organisation Meridian serves, and the buildings where the work happens.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewCustomer(!showNewCustomer)}>
          + New customer
        </button>
      </div>

      {showNewCustomer && (
        <div className="card card-pad" style={{ marginBottom: 18, maxWidth: 420 }}>
          <div className="field">
            <label>Customer name</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div className="field">
            <label>Contact email</label>
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleAddCustomer}>
            Save customer
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 20 }}>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => setSelected(c)}>
                  <td style={{ fontWeight: selected?.id === c.id ? 700 : 500 }}>{c.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card card-pad">
          {!selected ? (
            <div className="empty-state">Select a customer to see their sites.</div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div className="section-title" style={{ margin: 0 }}>
                  Sites — {selected.name}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowNewSite(!showNewSite)}>
                  + Add site
                </button>
              </div>

              {showNewSite && (
                <div style={{ marginBottom: 16, padding: 12, background: 'var(--slate-100)', borderRadius: 8 }}>
                  <div className="field">
                    <label>Site name</label>
                    <input value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Address</label>
                    <input value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} />
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={handleAddSite}>
                    Save site
                  </button>
                </div>
              )}

              {sites.length === 0 ? (
                <div className="empty-state">No sites yet for this customer.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Site</th>
                      <th>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sites.map((s) => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
