import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Clock, Terminal } from 'lucide-react';

interface AuditLog {
  id?: string;
  admin_id: string;
  admin_email: string;
  action_type: string;
  target_entity: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface AuditLogViewerProps {
  token: string;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ token }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/audit-logs?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const filteredLogs = logs.filter(
    (l) =>
      l.action_type.toLowerCase().includes(search.toLowerCase()) ||
      l.admin_email.toLowerCase().includes(search.toLowerCase()) ||
      l.target_entity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-medium text-white tracking-tight">Immutable Audit Log Ledger</h1>
            <span className="text-[10px] font-mono uppercase bg-iris/20 text-iris border border-iris/30 px-2 py-0.5 rounded-md">
              Rule 3.1 Enforced
            </span>
          </div>
          <p className="text-xs sm:text-sm text-silver/50 font-light mt-1">
            Tamper-proof chronological trail of all administrative mutations, key generations, and plan updates.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-silver/50 hover:text-white transition-colors"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-silver/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter logs by admin email, action type, or target entity..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090916] border border-white/[0.08] text-xs text-white placeholder-silver/30 focus:outline-none focus:border-iris"
        />
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl bg-[#090916] border border-white/[0.08] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[10px] font-mono uppercase text-silver/40 tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Admin User</th>
                <th className="px-5 py-3.5">Action Type</th>
                <th className="px-5 py-3.5">Target Entity</th>
                <th className="px-5 py-3.5">IP Address</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-silver/40">
                    No audit records match your query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-white/[0.015] transition-colors">
                    <td className="px-5 py-4 font-mono text-[11px] text-silver/60">
                      <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-silver/40" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-white truncate max-w-[180px]">
                      {log.admin_email}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[10px] font-mono uppercase bg-white/[0.04] text-iris border border-iris/20 px-2 py-0.5 rounded-md">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-white/90">
                      {log.target_entity}
                    </td>
                    <td className="px-5 py-4 font-mono text-silver/50 text-[11px]">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-iris hover:underline font-mono text-[11px]"
                      >
                        Inspect Payload
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#0a0a16] border border-white/[0.12] shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-iris" />
                <h3 className="text-sm font-medium text-white">Audit Event Payload</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-silver/40 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-silver/60">
                <span className="text-silver/40">Action:</span> <strong className="text-white">{selectedLog.action_type}</strong>
              </div>
              <div className="text-silver/60">
                <span className="text-silver/40">Target:</span> <code className="text-iris">{selectedLog.target_entity}</code>
              </div>
              <div className="text-silver/60">
                <span className="text-silver/40">Admin:</span> {selectedLog.admin_email}
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-mono uppercase text-silver/40 mb-1">JSON Payload Metadata:</span>
              <pre className="p-3 rounded-xl bg-black/60 border border-white/[0.06] font-mono text-[11px] text-silver/90 overflow-x-auto max-h-48">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
