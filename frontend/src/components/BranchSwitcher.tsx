import { useEffect, useRef, useState } from 'react';
import api from '../api/api';
import { branchLabel, currentBranch } from '../lib/format';
import './app-layout.css';

interface Branch {
  id: number;
  nombre: string;
}

export default function BranchSwitcher() {
  const rol = localStorage.getItem('rol');
  const canSwitch = rol === 'ADMIN';
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sedeId, setSedeId] = useState(localStorage.getItem('sedeId') || '1');
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (rol === 'CAJERO') {
      api
        .get('/api/branches')
        .then((r) => {
          const assigned = (Array.isArray(r.data) ? r.data : [])[0] as Branch | undefined;
          if (!assigned) return;
          const prev = localStorage.getItem('sedeId');
          localStorage.setItem('sedeId', String(assigned.id));
          localStorage.setItem('sedeNombre', assigned.nombre);
          setSedeId(String(assigned.id));
          if (prev !== String(assigned.id)) window.location.reload();
        })
        .catch(() => {});
      return;
    }
    if (!canSwitch) return;
    api
      .get('/api/branches')
      .then((r) => {
        const list = (Array.isArray(r.data) ? r.data : []).filter(
          (b: Branch) => !/cantina/i.test(b.nombre || '')
        );
        setBranches(list);
        const currentName = localStorage.getItem('sedeNombre') || '';
        if (/cantina/i.test(currentName) && list[0]) {
          localStorage.setItem('sedeId', String(list[0].id));
          localStorage.setItem('sedeNombre', list[0].nombre);
          setSedeId(String(list[0].id));
        }
      })
      .catch(() => {});
  }, [canSwitch, rol]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!canSwitch) {
    return (
      <span className="branch-switch-btn" style={{ cursor: 'default' }}>
        {currentBranch()}
      </span>
    );
  }

  const selected = branchLabel(branches.find((b) => String(b.id) === sedeId)?.nombre) || currentBranch();

  const applyBranch = (id: string) => {
    const branch = branches.find((b) => String(b.id) === id);
    localStorage.setItem('sedeId', id);
    if (branch?.nombre) localStorage.setItem('sedeNombre', branch.nombre);
    setSedeId(id);
    setOpen(false);
    window.location.reload();
  };

  return (
    <div className="branch-switch flex items-center" ref={box}>
      <span className="branch-switch-label hidden sm:inline">Branch</span>
      <button type="button" className="branch-switch-btn" onClick={() => setOpen((v) => !v)}>
        {selected}
      </button>
      {open && (
        <div className="branch-switch-menu">
          {branches.map((b) => (
            <button
              key={b.id}
              type="button"
              className={String(b.id) === sedeId ? 'is-active' : ''}
              onClick={() => applyBranch(String(b.id))}
            >
              {branchLabel(b.nombre)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
