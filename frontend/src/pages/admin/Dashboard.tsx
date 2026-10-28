import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import PageShell from '../../components/PageShell';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import { roleLabel } from '../../types';
import { branchLabel, formatDateTime, formatMoney, paymentMethodLabel } from '../../lib/format';
import { downloadCsv, downloadExcel } from '../../lib/export';
import AppLayout from '../../components/AppLayout';
import InvoiceView, { type Invoice } from '../../components/InvoiceView';
import ReportsPanel from '../../components/ReportsPanel';

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  rolId?: number;
  sede: string;
  sedeId?: number;
  activo?: boolean;
}

interface Branch {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono?: string;
}

interface Product {
  id: number;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  valorCompra?: number;
  valorVenta: number;
  precio: number;
  tipoProductoId?: number;
  proveedorId?: number;
}

interface ProductType {
  id: number;
  nombre: string;
  descripcion?: string;
}

interface Supplier {
  id: number;
  nombre: string;
  nit?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

type Tab = 'users' | 'branches' | 'products' | 'suppliers' | 'types' | 'reports';

function apiMessage(err: unknown, fallback: string) {
  const e = err as { response?: { data?: { message?: string; error?: string } } };
  return e.response?.data?.message || e.response?.data?.error || fallback;
}

const emptyUser = {
  nombre: '',
  email: '',
  password: '',
  rolId: 3,
  sedeId: 1,
};

const emptyBranch = {
  nombre: '',
  direccion: '',
  ciudad: 'Bogotá',
  telefono: '',
  mesas: '10',
};

const emptyProduct = {
  codigo: '',
  nombre: '',
  descripcion: '',
  valorCompra: '',
  valorVenta: '',
  tipoProductoId: '',
  proveedorId: '',
};

const emptySupplier = {
  nombre: '',
  nit: '',
  contacto: '',
  telefono: '',
  email: '',
  direccion: '',
};

export default function Dashboard() {
  useInactivityLogout();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [types, setTypes] = useState<ProductType[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(''), 10000);
    return () => window.clearTimeout(t);
  }, [message]);

  const goTab = (key: Tab) => {
    setMessage('');
    setError('');
    setTab(key);
  };

  const [userModal, setUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState(emptyUser);
  const [showUserPassword, setShowUserPassword] = useState(false);

  const [branchModal, setBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState(emptyBranch);

  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const [supplierModal, setSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState(emptySupplier);

  const [typeModal, setTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<ProductType | null>(null);
  const [typeForm, setTypeForm] = useState({ nombre: '', descripcion: '' });
  const [pendingType, setPendingType] = useState<ProductType | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [inventory, setInventory] = useState<{ id: number; productoNombre?: string; cantidad?: number; stock?: number }[]>([]);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/users').catch(() => ({ data: [] })),
      api.get('/api/branches').catch(() => ({ data: [] })),
      api.get('/api/products').catch(() => ({ data: [] })),
      api.get('/api/product-types').catch(() => ({ data: [] })),
      api.get('/api/suppliers').catch(() => ({ data: [] })),
    ])
      .then(([rU, rB, rP, rT, rS]) => {
        setUsers(Array.isArray(rU.data) ? rU.data : []);
        setBranches((Array.isArray(rB.data) ? rB.data : []).filter((b: Branch) => !/cantina/i.test(b.nombre || '')));
        setProducts(
          (Array.isArray(rP.data) ? rP.data : []).slice().sort((a: Product, b: Product) =>
            String(a.codigo || a.nombre).localeCompare(String(b.codigo || b.nombre), 'en', { numeric: true })
          )
        );
        setTypes(Array.isArray(rT.data) ? rT.data : []);
        setSuppliers(Array.isArray(rS.data) ? rS.data : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (tab !== 'reports') return;
    const sedeId = localStorage.getItem('sedeId') || '1';
    Promise.all([
      api.get(`/api/invoices?sedeId=${sedeId}`).catch(() => ({ data: [] })),
      api.get(`/api/inventory?sedeId=${sedeId}`).catch(() => ({ data: [] })),
    ]).then(([rInv, rStock]) => {
      setInvoices(Array.isArray(rInv.data) ? rInv.data : []);
      setInventory(Array.isArray(rStock.data) ? rStock.data : []);
    });
  }, [tab]);

  const openNewUser = () => {
    setEditingUser(null);
    setUserForm({
      ...emptyUser,
      sedeId: branches[0]?.id || 1,
    });
    setShowUserPassword(false);
    setUserModal(true);
    setError('');
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({
      nombre: u.nombre,
      email: u.email,
      password: '',
      rolId: u.rolId || (u.rol === 'ADMIN' ? 1 : u.rol === 'CAJERO' ? 2 : 3),
      sedeId: u.sedeId || 1,
    });
    setShowUserPassword(false);
    setUserModal(true);
    setError('');
  };

  const saveUser = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (editingUser) {
        const body: Record<string, unknown> = {
          nombre: userForm.nombre,
          email: userForm.email,
          rolId: Number(userForm.rolId),
          sedeId: Number(userForm.sedeId),
        };
        if (userForm.password.trim()) body.password = userForm.password;
        await api.put(`/api/users/${editingUser.id}`, body);
        setMessage('User updated');
      } else {
        await api.post('/api/users', {
          nombre: userForm.nombre,
          email: userForm.email,
          password: userForm.password,
          rolId: Number(userForm.rolId),
          sedeId: Number(userForm.sedeId),
        });
        setMessage('User created');
      }
      setUserModal(false);
      load();
    } catch (err) {
      setError(apiMessage(err, 'Could not save user'));
    } finally {
      setSaving(false);
    }
  };

  const toggleUser = async () => {
    if (!pendingUser) return;
    const u = pendingUser;
    const next = !(u.activo !== false);
    setPendingUser(null);
    setError('');
    try {
      await api.patch(`/api/users/${u.id}/active`, { activo: next });
      setMessage('User status updated');
      load();
    } catch (err) {
      setError(apiMessage(err, 'Could not change user status'));
    }
  };

  const openNewSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm(emptySupplier);
    setSupplierModal(true);
    setError('');
  };

  const openEditSupplier = (s: Supplier) => {
    setEditingSupplier(s);
    setSupplierForm({
      nombre: s.nombre || '',
      nit: s.nit || '',
      contacto: s.contacto || '',
      telefono: s.telefono || '',
      email: s.email || '',
      direccion: s.direccion || '',
    });
    setSupplierModal(true);
    setError('');
  };

  const saveSupplier = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const body = { ...supplierForm };
      if (editingSupplier) {
        await api.put(`/api/suppliers/${editingSupplier.id}`, body);
        setMessage('Supplier updated');
      } else {
        await api.post('/api/suppliers', body);
        setMessage('Supplier created');
      }
      setSupplierModal(false);
      load();
    } catch (err) {
      setError(apiMessage(err, 'Could not save supplier'));
    } finally {
      setSaving(false);
    }
  };

  const openEditType = (t: ProductType) => {
    setEditingType(t);
    setTypeForm({ nombre: t.nombre, descripcion: t.descripcion || '' });
    setTypeModal(true);
    setError('');
  };

  const saveType = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (editingType) {
        await api.put(`/api/product-types/${editingType.id}`, typeForm);
        setMessage('Product type updated');
      } else {
        await api.post('/api/product-types', typeForm);
        setMessage('Product type created');
      }
      setTypeModal(false);
      setEditingType(null);
      setTypeForm({ nombre: '', descripcion: '' });
      load();
    } catch (err) {
      setError(apiMessage(err, 'Could not save product type'));
    } finally {
      setSaving(false);
    }
  };

  const deleteType = async () => {
    if (!pendingType) return;
    setError('');
    setMessage('');
    try {
      await api.delete(`/api/product-types/${pendingType.id}`);
      setMessage('Product type deleted');
      setPendingType(null);
      load();
    } catch (err) {
      setPendingType(null);
      setError(apiMessage(err, 'Could not delete product type'));
    }
  };

  const openNewBranch = () => {
    setEditingBranch(null);
    setBranchForm(emptyBranch);
    setBranchModal(true);
    setError('');
  };

  const openEditBranch = (b: Branch) => {
    setEditingBranch(b);
    setBranchForm({
      nombre: b.nombre || '',
      direccion: b.direccion || '',
      ciudad: b.ciudad || 'Bogotá',
      telefono: b.telefono || '',
      mesas: '',
    });
    setBranchModal(true);
    setError('');
  };

  const saveBranch = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const mesas = Number(branchForm.mesas);
      if (!editingBranch || branchForm.mesas) {
        if (!Number.isInteger(mesas) || mesas < 1 || mesas > 40) {
          setError('Enter a number of tables from 1 to 40');
          setSaving(false);
          return;
        }
      }
      const body: Record<string, unknown> = {
        nombre: branchForm.nombre,
        direccion: branchForm.direccion,
        ciudad: branchForm.ciudad,
        telefono: branchForm.telefono,
      };
      if (!editingBranch || branchForm.mesas) body.mesas = mesas;
      if (editingBranch) {
        await api.put(`/api/branches/${editingBranch.id}`, body);
        setMessage('Branch updated');
      } else {
        await api.post('/api/branches', body);
        setMessage('Branch created');
      }
      setBranchModal(false);
      load();
    } catch (err) {
      setError(apiMessage(err, 'Could not save branch'));
    } finally {
      setSaving(false);
    }
  };

  const openNewProduct = () => {
    setEditingProduct(null);
    setProductForm({
      ...emptyProduct,
      tipoProductoId: types[0] ? String(types[0].id) : '',
    });
    setProductModal(true);
    setError('');
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      codigo: p.codigo || '',
      nombre: p.nombre || '',
      descripcion: p.descripcion || '',
      valorCompra: String(p.valorCompra ?? ''),
      valorVenta: String(p.valorVenta ?? p.precio ?? ''),
      tipoProductoId: p.tipoProductoId ? String(p.tipoProductoId) : '',
      proveedorId: p.proveedorId ? String(p.proveedorId) : '',
    });
    setProductModal(true);
    setError('');
  };

  const saveProduct = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const body: Record<string, unknown> = {
        codigo: productForm.codigo,
        nombre: productForm.nombre,
        descripcion: productForm.descripcion || undefined,
        valorCompra: Number(productForm.valorCompra),
        valorVenta: Number(productForm.valorVenta),
        tipoProductoId: Number(productForm.tipoProductoId),
      };
      if (productForm.proveedorId) body.proveedorId = Number(productForm.proveedorId);
      if (Number(productForm.valorVenta) < Number(productForm.valorCompra)) {
        setError('Sale price cannot be lower than purchase price');
        setSaving(false);
        return;
      }
      if (editingProduct) {
        await api.put(`/api/products/${editingProduct.id}`, body);
        setMessage('Product updated');
      } else {
        await api.post('/api/products', body);
        setMessage('Product created. Set stock in Inventory.');
      }
      setProductModal(false);
      load();
    } catch (err) {
      setError(apiMessage(err, 'Could not save product'));
    } finally {
      setSaving(false);
    }
  };

  const field =
    'mt-1 w-full px-3 py-2 rounded-lg border bg-white text-sm';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'users', label: `Users (${users.length})` },
    { key: 'branches', label: `Branches (${branches.length})` },
    { key: 'products', label: `Products (${products.length})` },
    { key: 'suppliers', label: `Suppliers (${suppliers.length})` },
    { key: 'types', label: `Types (${types.length})` },
    { key: 'reports', label: 'Reports' },
  ];

  return (
    <PageShell>
    <AppLayout
      eyebrow="Welcome to Terraza Premium"
      title="Administration"
      extraNav={
        <>
          <p className="app-side-role">Management</p>
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => goTab(t.key)} className={`app-nav-btn${tab === t.key ? ' is-active' : ''}`}>
              {t.label}
            </button>
          ))}
        </>
      }
      metrics={[
        { label: 'Users', value: users.length },
        { label: 'Branches', value: branches.length },
        { label: 'Products', value: products.length },
        { label: 'Suppliers', value: suppliers.length },
      ]}
    >
        {message && (
          <div className="mb-6 px-4 py-3 rounded-lg text-base font-medium border-l-4"
               style={{ background: '#dcfce7', borderColor: '#15803d', color: '#14532d' }}>
            {message}
          </div>
        )}
        {error && !userModal && !branchModal && !productModal && !supplierModal && !typeModal && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm"
               style={{ background: 'rgba(120,32,32,0.28)', color: '#f3d0c8' }}>
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex gap-2 lg:hidden overflow-x-auto">
            {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => goTab(t.key)}
                className="px-4 py-2 rounded-lg border text-sm transition-all whitespace-nowrap"
              style={{
                  background: tab === t.key ? 'var(--bar-gold)' : '#10243d',
                  color: tab === t.key ? '#07121c' : '#f7f2e9',
                  borderColor: 'rgba(146, 98, 8,0.35)',
              }}
            >
              {t.label}
            </button>
          ))}
          </div>
          {tab === 'users' && (
            <button type="button" onClick={openNewUser}
              className="gold-btn">
              Add user
            </button>
          )}
          {tab === 'branches' && (
            <button type="button" onClick={openNewBranch}
              className="gold-btn">
              Add branch
            </button>
          )}
          {tab === 'products' && (
            <button type="button" onClick={openNewProduct}
              className="gold-btn">
              Add product
            </button>
          )}
          {tab === 'suppliers' && (
            <button type="button" onClick={openNewSupplier}
              className="gold-btn">
              Add supplier
            </button>
          )}
          {tab === 'types' && (
            <button type="button" onClick={() => { setEditingType(null); setTypeForm({ nombre: '', descripcion: '' }); setTypeModal(true); setError(''); }}
              className="gold-btn">
              Add type
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-400">Loading data...</p>
        ) : (
          <div className="panel-card rounded-xl overflow-hidden">
            {tab === 'users' && (
              <table className="premium-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Name</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Email</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Role</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Branch</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Status</th>
                    <th className="text-right px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)', opacity: u.activo === false ? 0.7 : 1 }}>
                      <td className="px-6 py-4 font-medium">{u.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{ background: 'rgba(146, 98, 8,0.15)', color: 'var(--bar-gold)' }}>
                          {roleLabel(u.rol)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{branchLabel(u.sede)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                background: u.activo === false ? 'rgba(139,44,44,0.28)' : 'rgba(34,120,70,0.28)',
                                color: u.activo === false ? '#f3d0c8' : '#b7e4c7',
                              }}>
                          {u.activo === false ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button type="button" onClick={() => openEditUser(u)}
                          className="text-sm px-3 py-1.5 rounded-lg border">Edit</button>
                        <button type="button" onClick={() => setPendingUser(u)}
                          className="text-sm px-3 py-1.5 rounded-lg border">
                          {u.activo === false ? 'Activate' : 'Deactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'branches' && (
              <table className="premium-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Name</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Address</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">City</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Phone</th>
                    <th className="text-right px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {branches.map((b) => (
                    <tr key={b.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <td className="px-6 py-4 font-medium">{branchLabel(b.nombre)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{branchLabel(b.direccion)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{b.ciudad}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{b.telefono || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <button type="button" onClick={() => openEditBranch(b)}
                          className="text-sm px-3 py-1.5 rounded-lg border">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'products' && (
              <div className="max-h-96 overflow-y-auto">
                <table className="premium-table">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Code</th>
                      <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Name</th>
                      <th className="text-right px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Price</th>
                      <th className="text-right px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                        <td className="px-6 py-3 text-sm text-gray-500">{p.codigo || `#${p.id}`}</td>
                        <td className="px-6 py-3">{p.nombre}</td>
                        <td className="px-6 py-3 text-right font-display"
                            style={{ color: 'var(--bar-amber)' }}>
                          {formatMoney(p.precio || p.valorVenta || 0)}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button type="button" onClick={() => openEditProduct(p)}
                            className="text-sm px-3 py-1.5 rounded-lg border">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'suppliers' && (
              <table className="premium-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Name</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">NIT</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Contact</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Phone</th>
                    <th className="text-right px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <td className="px-6 py-4 font-medium">{s.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.nit || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.contacto || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{s.telefono || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <button type="button" onClick={() => openEditSupplier(s)}
                          className="text-sm px-3 py-1.5 rounded-lg border">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'types' && (
              <table className="premium-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Name</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Description</th>
                    <th className="text-right px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((t) => (
                    <tr key={t.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <td className="px-6 py-4 font-medium">{t.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.descripcion || '—'}</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                        <button type="button" onClick={() => openEditType(t)}
                          className="text-sm px-3 py-1.5 rounded-lg border">Edit</button>
                        <button type="button" onClick={() => setPendingType(t)}
                          className="text-sm px-3 py-1.5 rounded-lg border">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'reports' && (
              <div className="p-6 space-y-6">
                <ReportsPanel sedeId={localStorage.getItem('sedeId') || '1'} allowAllBranches />
                <h3 className="font-display text-xl" style={{ color: '#f7f2e9' }}>Closed invoices</h3>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="px-3 py-1.5 rounded-lg border text-sm" onClick={() => {
                    const headers = [
                      'Invoice number',
                      'Table',
                      'Branch',
                      'Waiter',
                      'Cashier',
                      'Payment method',
                      'Total (COP)',
                      'Closed at',
                    ];
                    const rows = invoices.map((row) => [
                      row.pedidoId,
                      row.mesaNumero ?? '',
                      row.sedeNombre || '',
                      row.meseroNombre || '',
                      row.cajeroNombre || row.pago?.cajeroNombre || '',
                      paymentMethodLabel(row.metodoPago || row.pago?.metodoPago),
                      Math.round(Number(row.total) || 0),
                      formatDateTime(row.fechaCierre),
                    ]);
                    downloadCsv('invoices', headers, rows);
                  }}>Invoices CSV</button>
                  <button type="button" className="px-3 py-1.5 rounded-lg border text-sm" onClick={() => {
                    const headers = [
                      'Invoice number',
                      'Table',
                      'Branch',
                      'Waiter',
                      'Cashier',
                      'Payment method',
                      'Total (COP)',
                      'Closed at',
                    ];
                    const rows = invoices.map((row) => [
                      row.pedidoId,
                      row.mesaNumero ?? '',
                      row.sedeNombre || '',
                      row.meseroNombre || '',
                      row.cajeroNombre || row.pago?.cajeroNombre || '',
                      paymentMethodLabel(row.metodoPago || row.pago?.metodoPago),
                      Math.round(Number(row.total) || 0),
                      formatDateTime(row.fechaCierre),
                    ]);
                    downloadExcel('invoices', headers, rows, 'Invoices');
                  }}>Invoices Excel</button>
                </div>
                {invoices.length === 0 ? (
                  <p className="text-gray-400 text-sm">No invoices yet.</p>
                ) : (
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Table</th>
                        <th>Waiter</th>
                        <th>Cashier</th>
                        <th>Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((row) => (
                        <tr key={row.pedidoId}>
                          <td>#{row.pedidoId}</td>
                          <td>{row.mesaNumero ?? '—'}</td>
                          <td>{row.meseroNombre || '—'}</td>
                          <td>{row.cajeroNombre || row.pago?.cajeroNombre || '—'}</td>
                          <td className="text-right">{formatMoney(row.total)}</td>
                          <td>
                            <button type="button" className="text-sm px-3 py-1.5 rounded-lg border" onClick={async () => {
                              const { data } = await api.get(`/api/invoices/${row.pedidoId}`);
                              setInvoice(data);
                            }}>View</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

      {userModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-2xl mb-4" style={{ color: '#f7f2e9' }}>
              {editingUser ? 'Edit user' : 'Add user'}
            </h3>
            {error && (
              <div className="mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
                {error}
              </div>
            )}
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">Name</span>
              <input className={field} value={userForm.nombre}
                onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })} />
            </label>
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">Email</span>
              <input className={field} type="email" value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
            </label>
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">
                Password
              </span>
              <div className="relative">
                <input
                  className={`${field} pr-12`}
                  type={showUserPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowUserPassword((visible) => !visible)}
                  aria-label={showUserPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 z-20 -translate-y-1/2 p-1"
                  style={{ color: '#c9a227' }}
                >
                  {showUserPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c5 0 9.3 3.1 11 7-0.6 1.4-1.5 2.7-2.6 3.8" />
                      <path d="M6.1 6.1C4.2 7.4 2.8 9.1 2 12c1.7 3.9 6 7 10 7 1.3 0 2.5-.2 3.6-.7" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </label>
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">Role</span>
              <select className={field} value={userForm.rolId}
                onChange={(e) => setUserForm({ ...userForm, rolId: Number(e.target.value) })}>
                <option value={1}>Administrator</option>
                <option value={2}>Cashier</option>
                <option value={3}>Waiter</option>
              </select>
            </label>
            <label className="block mb-4">
              <span className="text-xs uppercase tracking-widest text-gray-600">Branch</span>
              <select className={field} value={userForm.sedeId}
                onChange={(e) => setUserForm({ ...userForm, sedeId: Number(e.target.value) })}>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{branchLabel(b.nombre)}</option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setUserModal(false)} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
              <button type="button" disabled={saving} onClick={saveUser}
                className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: 'var(--bar-dark)' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {branchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-display text-2xl mb-4" style={{ color: '#f7f2e9' }}>
              {editingBranch ? 'Edit branch' : 'Add branch'}
            </h3>
            {error && (
              <div className="mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
                {error}
              </div>
            )}
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">Name</span>
              <input className={field} value={branchForm.nombre}
                onChange={(e) => setBranchForm({ ...branchForm, nombre: e.target.value })} />
            </label>
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">Address</span>
              <input className={field} value={branchForm.direccion}
                onChange={(e) => setBranchForm({ ...branchForm, direccion: e.target.value })} />
            </label>
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">City</span>
              <input className={field} value={branchForm.ciudad}
                onChange={(e) => setBranchForm({ ...branchForm, ciudad: e.target.value })} />
            </label>
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">Phone</span>
              <input className={field} value={branchForm.telefono}
                onChange={(e) => setBranchForm({ ...branchForm, telefono: e.target.value })} />
            </label>
            <label className="block mb-4">
              <span className="text-xs uppercase tracking-widest text-gray-600">Tables</span>
              <input className={field} type="number" min={1} max={40} value={branchForm.mesas}
                placeholder={editingBranch ? 'Add tables up to this number' : ''}
                onChange={(e) => setBranchForm({ ...branchForm, mesas: e.target.value })} />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setBranchModal(false)} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
              <button type="button" disabled={saving} onClick={saveBranch}
                className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: 'var(--bar-dark)' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {productModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-2xl mb-4" style={{ color: '#f7f2e9' }}>
              {editingProduct ? 'Edit product' : 'Add product'}
            </h3>
            {error && (
              <div className="mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
                {error}
              </div>
            )}
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">Code</span>
              <input className={field} value={productForm.codigo}
                onChange={(e) => setProductForm({ ...productForm, codigo: e.target.value })} />
            </label>
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">Name</span>
              <input className={field} value={productForm.nombre}
                onChange={(e) => setProductForm({ ...productForm, nombre: e.target.value })} />
            </label>
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">Description</span>
              <input className={field} value={productForm.descripcion}
                onChange={(e) => setProductForm({ ...productForm, descripcion: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <label>
                <span className="text-xs uppercase tracking-widest text-gray-600">Purchase</span>
                <input className={field} type="number" min={0} value={productForm.valorCompra}
                  onChange={(e) => setProductForm({ ...productForm, valorCompra: e.target.value })} />
              </label>
              <label>
                <span className="text-xs uppercase tracking-widest text-gray-600">Sale</span>
                <input className={field} type="number" min={0} value={productForm.valorVenta}
                  onChange={(e) => setProductForm({ ...productForm, valorVenta: e.target.value })} />
              </label>
            </div>
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">Type</span>
              <select className={field} value={productForm.tipoProductoId}
                onChange={(e) => setProductForm({ ...productForm, tipoProductoId: e.target.value })}>
                <option value="">Select...</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </label>
            <label className="block mb-4">
              <span className="text-xs uppercase tracking-widest text-gray-600">Supplier (optional)</span>
              <select className={field} value={productForm.proveedorId}
                onChange={(e) => setProductForm({ ...productForm, proveedorId: e.target.value })}>
                <option value="">None</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setProductModal(false)} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
              <button type="button" disabled={saving} onClick={saveProduct}
                className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: 'var(--bar-dark)' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {supplierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-2xl mb-4" style={{ color: '#f7f2e9' }}>
              {editingSupplier ? 'Edit supplier' : 'Add supplier'}
            </h3>
            {error && (
              <div className="mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
                {error}
              </div>
            )}
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">Name</span>
              <input className={field} value={supplierForm.nombre}
                onChange={(e) => setSupplierForm({ ...supplierForm, nombre: e.target.value })} />
            </label>
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">NIT</span>
              <input className={field} value={supplierForm.nit}
                onChange={(e) => setSupplierForm({ ...supplierForm, nit: e.target.value })} />
            </label>
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">Contact</span>
              <input className={field} value={supplierForm.contacto}
                onChange={(e) => setSupplierForm({ ...supplierForm, contacto: e.target.value })} />
            </label>
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">Phone</span>
              <input className={field} value={supplierForm.telefono}
                onChange={(e) => setSupplierForm({ ...supplierForm, telefono: e.target.value })} />
            </label>
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">Email</span>
              <input className={field} type="email" value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} />
            </label>
            <label className="block mb-4">
              <span className="text-xs uppercase tracking-widest text-gray-600">Address</span>
              <input className={field} value={supplierForm.direccion}
                onChange={(e) => setSupplierForm({ ...supplierForm, direccion: e.target.value })} />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setSupplierModal(false)} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
              <button type="button" disabled={saving} onClick={saveSupplier}
                className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: 'var(--bar-dark)' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {typeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-display text-2xl mb-4" style={{ color: '#f7f2e9' }}>
              {editingType ? 'Edit product type' : 'Add product type'}
            </h3>
            {error && (
              <div className="mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#991b1b' }}>
                {error}
              </div>
            )}
            <label className="block mb-3">
              <span className="text-xs uppercase tracking-widest text-gray-600">Name</span>
              <input className={field} value={typeForm.nombre}
                onChange={(e) => setTypeForm({ ...typeForm, nombre: e.target.value })} />
            </label>
            <label className="block mb-4">
              <span className="text-xs uppercase tracking-widest text-gray-600">Description</span>
              <input className={field} value={typeForm.descripcion}
                onChange={(e) => setTypeForm({ ...typeForm, descripcion: e.target.value })} />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setTypeModal(false)} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
              <button type="button" disabled={saving} onClick={saveType}
                className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: 'var(--bar-dark)' }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
    </div>
      )}

      <ConfirmDialog
        open={!!pendingUser}
        title={pendingUser && pendingUser.activo === false ? 'Activate user' : 'Deactivate user'}
        message={pendingUser ? `${pendingUser.activo === false ? 'Activate' : 'Deactivate'} ${pendingUser.nombre}?` : ''}
        onConfirm={toggleUser}
        onCancel={() => setPendingUser(null)}
      />
      <ConfirmDialog
        open={!!pendingType}
        title="Delete product type"
        message={pendingType ? `Delete ${pendingType.nombre}?` : ''}
        confirmLabel="Delete"
        onConfirm={deleteType}
        onCancel={() => setPendingType(null)}
      />
      {invoice && <InvoiceView invoice={invoice} onClose={() => setInvoice(null)} />}
    </AppLayout>
    </PageShell>
  );
}
