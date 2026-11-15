import { useEffect, useState } from 'react';
import api from '../api/api';

interface OwaspItem {
  id: string;
  title: string;
  status: string;
  evidence: string;
}

interface AlgorithmItem {
  name: string;
  type: string;
  usedIn: string;
}

interface HanoiMove {
  step: number;
  disk: number;
  from: string;
  aux: string;
  to: string;
}

interface QaStatus {
  phaseIv: string;
  phaseV: string;
  supportStart: string;
  supportEnd: string;
  supportDaysRemaining: number;
  supportActive: boolean;
  owasp: OwaspItem[];
  algorithms: AlgorithmItem[];
  concurrencyNotes: string[];
}

export default function QualityPanel() {
  const [data, setData] = useState<QaStatus | null>(null);
  const [error, setError] = useState('');
  const [crates, setCrates] = useState(3);
  const [moves, setMoves] = useState<HanoiMove[]>([]);
  const [hanoiInfo, setHanoiInfo] = useState('');

  useEffect(() => {
    api.get('/api/qa/status')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load quality status'));
  }, []);

  const runHanoi = async () => {
    try {
      const { data: plan } = await api.get(`/api/qa/hanoi?crates=${crates}`);
      setMoves(plan.moves || []);
      setHanoiInfo(`${plan.minimumMoves} moves · ${plan.from} → ${plan.to} using ${plan.aux}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setHanoiInfo(e.response?.data?.message || 'Could not build transfer plan');
    }
  };

  if (error) {
    return <p className="p-6 text-sm" style={{ color: '#f3d0c8' }}>{error}</p>;
  }
  if (!data) {
    return <p className="p-6 text-sm text-gray-400">Loading quality status...</p>;
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h3 className="font-display text-xl mb-1" style={{ color: '#f7f2e9' }}>Phase IV — Quality control</h3>
        <p className="text-sm text-gray-400">{data.phaseIv}</p>
      </div>

      <div>
        <h4 className="text-sm uppercase tracking-widest text-gray-500 mb-3">OWASP Top 10 audit</h4>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-gray-500">Item</th>
              <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-gray-500">Status</th>
              <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-gray-500">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {data.owasp.map((row) => (
              <tr key={row.id} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                <td className="px-4 py-2 text-sm">{row.id} — {row.title}</td>
                <td className="px-4 py-2 text-sm">{row.status}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{row.evidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h4 className="text-sm uppercase tracking-widest text-gray-500 mb-3">Concurrency and response time</h4>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
          {data.concurrencyNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-sm uppercase tracking-widest text-gray-500 mb-3">Towers of Hanoi (3 branches)</h4>
        <div className="flex flex-wrap gap-2 items-end mb-3">
          <label className="text-sm">
            <span className="block text-xs uppercase tracking-widest text-gray-500">Crates</span>
            <input
              type="number"
              min={1}
              max={8}
              value={crates}
              onChange={(e) => setCrates(Number(e.target.value))}
              className="mt-1 w-24 px-3 py-2 rounded-lg border bg-white text-sm"
            />
          </label>
          <button
            type="button"
            onClick={runHanoi}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ background: '#10243d', color: '#f7f2e9', border: '1px solid rgba(146, 98, 8,0.35)' }}
          >
            Show transfer plan
          </button>
        </div>
        {hanoiInfo && <p className="text-sm mb-2" style={{ color: '#f7f2e9' }}>{hanoiInfo}</p>}
        {moves.length > 0 && (
          <ol className="text-sm space-y-1 max-h-48 overflow-y-auto" style={{ color: '#a7afbc' }}>
            {moves.map((move) => (
              <li key={move.step}>
                {move.step}. Crate {move.disk}: {move.from} → {move.to}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div>
        <h4 className="text-sm uppercase tracking-widest text-gray-500 mb-3">Algorithms (5)</h4>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-gray-500">Algorithm</th>
              <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-gray-500">Type</th>
              <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-gray-500">Used in</th>
            </tr>
          </thead>
          <tbody>
            {data.algorithms.map((row) => (
              <tr key={row.name} className="border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                <td className="px-4 py-2 text-sm">{row.name}</td>
                <td className="px-4 py-2 text-sm">{row.type}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{row.usedIn}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="font-display text-xl mb-1" style={{ color: '#f7f2e9' }}>Phase V — Technical warranty</h3>
        <p className="text-sm text-gray-400 mb-3">{data.phaseV}</p>
        <div className="p-4 rounded-lg" style={{ background: '#071525', border: '1px solid rgba(146, 98, 8,0.35)' }}>
          <p className="text-sm" style={{ color: '#f7f2e9' }}>
            Specialized support from {data.supportStart} to {data.supportEnd}.
          </p>
          <p className="text-sm mt-1" style={{ color: data.supportActive ? '#dcfce7' : '#f3d0c8' }}>
            {data.supportActive
              ? `${data.supportDaysRemaining} day(s) remaining`
              : 'Warranty period has ended'}
          </p>
        </div>
      </div>
    </div>
  );
}
