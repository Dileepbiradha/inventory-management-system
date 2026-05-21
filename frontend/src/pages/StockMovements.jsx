import { useState, useEffect } from 'react';
import axios from 'axios';
import { movementsAPI } from '../api/movements';

// Normalize base URL: strip trailing slash and trailing /api if present
const RAW_API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API = RAW_API.replace(/\/+$/, '').replace(/\/api$/, '');

export default function StockMovements() {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [form, setForm] = useState({
    product_id: '',
    movement_type: 'IN',
    quantity: '',
    reason: '',
    reference: '',
    notes: '',
    unit_cost: '',
  });
  const [msg, setMsg] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const loadData = async () => {
    try {
      const p = await axios.get(`${API}/api/products`, { headers });
      setProducts(p.data);
      const m = await movementsAPI.list();
      setMovements(m.data);
    } catch (e) {
      console.error(e);
      setMsg('Error loading data');
    }
  };

  useEffect(() => { loadData(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const payload = {
        product_id: parseInt(form.product_id, 10),
        movement_type: form.movement_type,
        quantity: parseInt(form.quantity, 10),
        reason: form.reason || null,
        reference: form.reference || null,
        notes: form.notes || null,
        unit_cost: form.unit_cost ? parseFloat(form.unit_cost) : null,
      };

      await movementsAPI.create(payload);

      setMsg('✅ Saved!');
      setForm({
        product_id: '',
        movement_type: 'IN',
        quantity: '',
        reason: '',
        reference: '',
        notes: '',
        unit_cost: '',
      });
      loadData();
    } catch (err) {
      console.error(err);
      const detail =
        err.response?.data?.detail ||
        (Array.isArray(err.response?.data) ? JSON.stringify(err.response.data) : null) ||
        err.message;
      setMsg(`❌ ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Stock Movements</h1>

      <form onSubmit={submit} className="space-y-3 mb-6 max-w-md">
        <select
          className="border p-2 w-full"
          value={form.product_id}
          onChange={(e) => setForm({ ...form, product_id: e.target.value })}
          required
        >
          <option value="">-- Select product --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (stock: {p.quantity})
            </option>
          ))}
        </select>

        <select
          className="border p-2 w-full"
          value={form.movement_type}
          onChange={(e) => setForm({ ...form, movement_type: e.target.value })}
        >
          <option value="IN">IN (add stock)</option>
          <option value="OUT">OUT (remove stock)</option>
          <option value="ADJUSTMENT">ADJUSTMENT (signed +/-)</option>
        </select>

        <input
          type="number"
          className="border p-2 w-full"
          placeholder="Quantity (negative allowed for ADJUSTMENT)"
          value={form.quantity}
          onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          required
        />

        <input
          className="border p-2 w-full"
          placeholder="Reason (optional)"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />

        <input
          className="border p-2 w-full"
          placeholder="Reference / PO number (optional)"
          value={form.reference}
          onChange={(e) => setForm({ ...form, reference: e.target.value })}
        />

        <input
          type="number"
          step="0.01"
          className="border p-2 w-full"
          placeholder="Unit cost (optional)"
          value={form.unit_cost}
          onChange={(e) => setForm({ ...form, unit_cost: e.target.value })}
        />

        <textarea
          className="border p-2 w-full"
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        <button className="bg-blue-600 text-white px-4 py-2 rounded">
          Save Movement
        </button>
      </form>

      {msg && <p className="mb-4">{msg}</p>}

      <h2 className="text-xl font-semibold mb-2">Recent Movements</h2>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Product</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-right">Qty</th>
            <th className="p-2 text-right">Before → After</th>
            <th className="p-2 text-left">User</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => (
            <tr key={m.id} className="border-t">
              <td className="p-2">{new Date(m.created_at).toLocaleString()}</td>
              <td className="p-2">{m.product_name || m.product_id}</td>
              <td className="p-2">{m.movement_type}</td>
              <td className="p-2 text-right">{m.quantity}</td>
              <td className="p-2 text-right">{m.quantity_before} → {m.quantity_after}</td>
              <td className="p-2">{m.user_username || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}