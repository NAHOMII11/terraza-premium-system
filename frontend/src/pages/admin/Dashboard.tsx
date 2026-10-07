import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';
import { roleLabel } from '../../types';

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

type Tab = 'users' | 'branches' | 'products' | 'suppliers' | 'types';

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

  const [userModal, setUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState(emptyUser);

  const [branchModal, setBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState(emptyBranch);

  const [productModal, setProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [askLogout, setAskLogout] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);

  const [supplierModal, setSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState(emptySupplier);

  const [typeModal, setTypeModal] = useState(false);
  const [typeForm, setTypeForm] = useState({ nombre: '', descripcion: '' });

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
        setBranches(Array.isArray(rB.data) ? rB.data : []);
        setProducts(Array.isArray(rP.data) ? rP.data : []);
        setTypes(Array.isArray(rT.data) ? rT.data : []);
        setSuppliers(Array.isArray(rS.data) ? rS.data : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const logout = async () => {
    setAskLogout(false);
    try {
      await api.post('/api/auth/logout');
    } catch {}
    localStorage.clear();
    navigate('/login');
  };

  const openNewUser = () => {
    setEditingUser(null);
    setUserForm({
      ...emptyUser,
      sedeId: branches[0]?.id || 1,
    });
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

  const saveType = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.post('/api/product-types', typeForm);
      setMessage('Product type created');
      setTypeModal(false);
      setTypeForm({ nombre: '', descripcion: '' });
      load();
    } catch (err) {
      setError(apiMessage(err, 'Could not save product type'));
    } finally {
      setSaving(false);
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
    });
    setBranchModal(true);
    setError('');
  };

  const saveBranch = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const body = {
        nombre: branchForm.nombre,
        direccion: branchForm.direccion,
        ciudad: branchForm.ciudad,
        telefono: branchForm.telefono,
      };
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
      if (editingProduct) {
        await api.put(`/api/products/${editingProduct.id}`, body);
        setMessage('Product updated');
      } else {
        await api.post('/api/products', body);
        setMessage('Product created. Add it to inventory from the Inventory screen.');
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

  return (
    <div className="min-h-screen" style={{ background: 'var(--bar-cream)' }}>
      <header
        className="sticky top-0 z-40 border-b"
        style={{ background: 'var(--bar-dark)', borderColor: 'rgba(212,162,76,0.15)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                 stroke="var(--bar-gold)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M5 3h14l-7 8v10M8 21h8M3 3l6 6M21 3l-6 6" />
            </svg>
            <div>
              <p className="font-display text-white text-lg leading-none">Terraza Premium</p>
              <p className="text-[10px] uppercase tracking-widest mt-0.5"
                 style={{ letterSpacing: '0.25em', color: 'var(--bar-gold)' }}>
                Admin
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
              <p className="text-white/70 text-xs">{localStorage.getItem('email')}</p>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--bar-gold)' }}>
                Administrator
              </p>
            </div>
            <button
              onClick={() => setAskLogout(true)}
              className="text-white/60 hover:text-white text-sm transition-colors border rounded-md px-3 py-1.5"
              style={{ borderColor: 'rgba(212,162,76,0.3)' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-2"
             style={{ letterSpacing: '0.15em' }}>
            Admin panel
          </p>
          <h1 className="font-display text-4xl" style={{ color: 'var(--bar-dark)' }}>
            Welcome, Administrator
          </h1>
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => navigate('/mesera/mesas')}
              className="px-4 py-2 rounded-lg text-white text-sm"
              style={{ background: 'var(--bar-dark)' }}
            >
              Work as waiter
            </button>
            <button
              onClick={() => navigate('/cajero/dashboard')}
              className="px-4 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--bar-dark)', color: 'var(--bar-dark)' }}
            >
              Work as cashier
            </button>
            <button
              onClick={() => navigate('/mesera/inventario')}
              className="px-4 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--bar-dark)', color: 'var(--bar-dark)' }}
            >
              Inventory
            </button>
          </div>
        </header>

        {message && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm border-l-4"
               style={{ background: '#f0fdf4', borderColor: '#16a34a', color: '#166534' }}>
            {message}
          </div>
        )}
        {error && !userModal && !branchModal && !productModal && !supplierModal && !typeModal && (
          <div className="mb-6 px-4 py-3 rounded-lg text-sm"
               style={{ background: '#fef2f2', color: '#991b1b' }}>
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex gap-2">
            {([
              { key: 'users', label: `Users (${users.length})` },
              { key: 'branches', label: `Branches (${branches.length})` },
              { key: 'products', label: `Products (${products.length})` },
              { key: 'suppliers', label: `Suppliers (${suppliers.length})` },
              { key: 'types', label: `Types (${types.length})` },
            ] as { key: Tab; label: string }[]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="px-4 py-2 rounded-lg border text-sm transition-all"
                style={{
                  background: tab === t.key ? 'var(--bar-dark)' : 'white',
                  color: tab === t.key ? 'var(--bar-gold)' : '#555',
                  borderColor: tab === t.key ? 'var(--bar-dark)' : 'rgba(0,0,0,0.1)',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          {tab === 'users' && (
            <button type="button" onClick={openNewUser}
              className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: 'var(--bar-dark)' }}>
              Add user
            </button>
          )}
          {tab === 'branches' && (
            <button type="button" onClick={openNewBranch}
              className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: 'var(--bar-dark)' }}>
              Add branch
            </button>
          )}
          {tab === 'products' && (
            <button type="button" onClick={openNewProduct}
              className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: 'var(--bar-dark)' }}>
              Add product
            </button>
          )}
          {tab === 'suppliers' && (
            <button type="button" onClick={openNewSupplier}
              className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: 'var(--bar-dark)' }}>
              Add supplier
            </button>
          )}
          {tab === 'types' && (
            <button type="button" onClick={() => { setTypeForm({ nombre: '', descripcion: '' }); setTypeModal(true); setError(''); }}
              className="px-4 py-2 rounded-lg text-white text-sm" style={{ background: 'var(--bar-dark)' }}>
              Add type
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-400">Loading data...</p>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden"
               style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            {tab === 'users' && (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Name</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Email</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Role</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Branch</th>
                    <th className="text-right px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <td className="px-6 py-4 font-medium">{u.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium"
                              style={{ background: 'rgba(212,162,76,0.15)', color: 'var(--bar-amber)' }}>
                          {roleLabel(u.rol)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{u.sede}</td>
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
              <table className="w-full">
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
                      <td className="px-6 py-4 font-medium">{b.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{b.direccion}</td>
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
                <table className="w-full">
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
                          ${(p.precio || p.valorVenta || 0).toLocaleString()}
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
              <table className="w-full">
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
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Name</th>
                    <th className="text-left px-6 py-3 text-xs uppercase tracking-widest text-gray-500">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((t) => (
                    <tr key={t.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                      <td className="px-6 py-4 font-medium">{t.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.descripcion || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {userModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-display text-2xl mb-4" style={{ color: 'var(--bar-dark)' }}>
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
                Password {editingUser ? '(leave empty to keep)' : ''}
              </span>
              <input className={field} type="password" value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
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
                  <option key={b.id} value={b.id}>{b.nombre}</option>
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
            <h3 className="font-display text-2xl mb-4" style={{ color: 'var(--bar-dark)' }}>
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
            <label className="block mb-4">
              <span className="text-xs uppercase tracking-widest text-gray-600">Phone</span>
              <input className={field} value={branchForm.telefono}
                onChange={(e) => setBranchForm({ ...branchForm, telefono: e.target.value })} />
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
            <h3 className="font-display text-2xl mb-4" style={{ color: 'var(--bar-dark)' }}>
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
            <h3 className="font-display text-2xl mb-4" style={{ color: 'var(--bar-dark)' }}>
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
            <h3 className="font-display text-2xl mb-4" style={{ color: 'var(--bar-dark)' }}>
              Add product type
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
        open={askLogout}
        title="Sign out"
        message="Close this session?"
        confirmLabel="Sign out"
        onConfirm={logout}
        onCancel={() => setAskLogout(false)}
      />
      <ConfirmDialog
        open={!!pendingUser}
        title={pendingUser && pendingUser.activo === false ? 'Activate user' : 'Deactivate user'}
        message={pendingUser ? `${pendingUser.activo === false ? 'Activate' : 'Deactivate'} ${pendingUser.nombre}?` : ''}
        onConfirm={toggleUser}
        onCancel={() => setPendingUser(null)}
      />
    </div>
  );
}
