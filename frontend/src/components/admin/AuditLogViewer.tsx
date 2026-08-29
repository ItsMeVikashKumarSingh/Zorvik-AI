import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Search,
} from 'lucide-react';

interface AuditLog {
  id: string;
  admin_id?: string;
  admin_email: string;
  action_type: string;
  target_entity: string;
  details?: any;
  ip_address?: string;
  created_at: string;
}

interface AuditLogViewerProps {
  token: string;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ token }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/audit-logs?limit=50', {
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

  const filteredLogs = logs.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      l.action_type.toLowerCase().includes(q) ||
      l.admin_email.toLowerCase().includes(q) ||
      l.target_entity.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-['IBM_Plex_Sans',sans-serif] text-[#141310]">
      {/* Header Banner */}
      <div className="p-6 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-1">
            IMMUTABLE SECURITY AUDIT TRAIL
          </div>
          <h2 className="text-base font-semibold text-[#141310] tracking-tight">
            Security & Administration Audit Records
          </h2>
          <p className="text-xs text-[rgba(20,19,16,0.62)] mt-1">
            Every administrative operation, provider rotation, circuit state change, and tenant provisioning event.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] hover:bg-[#faf8f3] text-xs font-medium text-[#141310] transition-colors"
        >
          <RotateCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[rgba(20,19,16,0.42)]" />
        <input
          type="text"
          placeholder="Filter by Action, Email, or Target..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] rounded pl-8 pr-3 py-1.5 text-xs text-[#141310] placeholder-[rgba(20,19,16,0.42)] outline-none focus:border-[#141310] transition-colors"
        />
      </div>

      {/* Logs Table */}
      <div className="rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] overflow-hidden">
        <div className="overflow-x-auto min-w-[700px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[rgba(20,19,16,0.14)] bg-[#f4f1ea]/60">
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace]">
                  TIMESTAMP
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                  ACTION TYPE
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                  ADMIN EMAIL
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                  TARGET ENTITY
                </th>
                <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace] text-right">
                  METADATA
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(20,19,16,0.14)]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[rgba(20,19,16,0.42)] text-xs font-['IBM_Plex_Mono',monospace]">
                    No audit logs matching current query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isCircuit = log.action_type.includes('CIRCUIT') || log.action_type.includes('FAIL');
                  return (
                    <tr key={log.id} className="hover:bg-[rgba(20,19,16,0.02)] transition-colors h-[44px]">
                      {/* Timestamp */}
                      <td className="py-2 px-4 whitespace-nowrap text-[rgba(20,19,16,0.62)] font-['IBM_Plex_Mono',monospace] text-[11px]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      {/* Action */}
                      <td className="py-2 px-4 whitespace-nowrap">
                        <span
                          className={`font-['IBM_Plex_Mono',monospace] text-[10.5px] font-semibold px-2 py-0.5 rounded border ${
                            isCircuit
                              ? 'border-[#c8321e]/30 bg-[#c8321e]/10 text-[#c8321e]'
                              : 'border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] text-[#141310]'
                          }`}
                        >
                          {log.action_type}
                        </span>
                      </td>

                      {/* Email */}
                      <td className="py-2 px-4 whitespace-nowrap text-[#141310] font-medium">
                        {log.admin_email}
                      </td>

                      {/* Target */}
                      <td className="py-2 px-4 whitespace-nowrap font-['IBM_Plex_Mono',monospace] text-[11.5px] text-[rgba(20,19,16,0.75)]">
                        {log.target_entity}
                      </td>

                      {/* IP */}
                      <td className="py-2 px-4 whitespace-nowrap text-right font-['IBM_Plex_Mono',monospace] text-[10.5px] text-[rgba(20,19,16,0.42)]">
                        {log.ip_address || 'internal'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
