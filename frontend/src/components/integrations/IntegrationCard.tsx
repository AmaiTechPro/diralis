import React, { useState } from "react";
import { RefreshCw, Store, ExternalLink, AlertCircle, Trash2 } from "lucide-react";
import type { ConnectionFreshness } from "../../services/integrationService";
import { triggerManualSync, disconnectIntegration } from "../../services/integrationService";
import { FreshnessBadge } from "./FreshnessBadge";

interface IntegrationCardProps {
  connection?: ConnectionFreshness;
  providerType?: "shopify";
  onRefresh: () => void;
  onConnectClick?: () => void;
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  connection,
  onRefresh,
  onConnectClick,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const formatRelativeTime = (isoString: string | null): string => {
    if (!isoString) return "Never";
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const handleSyncNow = async () => {
    if (!connection || syncing) return;
    setSyncing(true);
    setActionError(null);
    try {
      const res = await triggerManualSync(connection.connectionId, "transactions");
      if (!res.success) {
        setActionError(res.result?.error || "Sync could not be completed.");
      }
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to trigger sync.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection || disconnecting) return;
    if (!window.confirm(`Disconnect ${connection.name}? Live syncing will be discontinued.`)) return;
    setDisconnecting(true);
    setActionError(null);
    try {
      await disconnectIntegration(connection.connectionId);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || "Failed to disconnect integration.");
    } finally {
      setDisconnecting(false);
    }
  };

  // 1. Disconnected state
  if (!connection) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Store size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">Shopify POS</h3>
                <p className="text-xs text-slate-400">Point of Sale & Retail Orders</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Not Connected
            </span>
          </div>
          <p className="mt-4 text-sm text-slate-400 leading-relaxed">
            Synchronize retail POS orders, product items, and store inventory directly into Diralis's canonical engine.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={onConnectClick}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
          >
            <ExternalLink size={16} />
            Connect Shopify Store
          </button>
        </div>
      </div>
    );
  }

  // 2. Connected state
  const isSyncInProgress = connection.syncInProgress || syncing;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Store size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100">{connection.name}</h3>
              <p className="text-xs text-slate-400">Provider: {connection.provider}</p>
            </div>
          </div>
          <FreshnessBadge freshness={connection.freshness} />
        </div>

        {/* Sync metadata summary */}
        <div className="mt-5 grid grid-cols-2 gap-3 text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
          <div>
            <span className="text-slate-500 block">Last Synced</span>
            <span className="font-medium text-slate-200 mt-0.5 block">
              {formatRelativeTime(connection.lastSuccessfulSyncAt)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Records Ingested</span>
            <span className="font-medium text-slate-200 mt-0.5 block">
              {connection.recordsLastSynced.toLocaleString()} records
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Next Scheduled</span>
            <span className="font-medium text-slate-200 mt-0.5 block">
              {connection.nextSyncAt ? new Date(connection.nextSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Automatic"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Status</span>
            <span className="font-medium text-slate-200 mt-0.5 block">
              {connection.status}
            </span>
          </div>
        </div>

        {/* User-facing error message */}
        {(actionError || connection.errorDetails) && (
          <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
            <span>{actionError || connection.errorDetails}</span>
          </div>
        )}
      </div>

      {/* Action footer */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
        {connection.freshness === "NEEDS_REAUTH" ? (
          <button
            onClick={onConnectClick}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
            Reconnect Store
          </button>
        ) : (
          <button
            onClick={handleSyncNow}
            disabled={isSyncInProgress}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={isSyncInProgress ? "animate-spin text-cyan-400" : ""} />
            {isSyncInProgress ? "Syncing..." : "Sync Now"}
          </button>
        )}

        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          title="Disconnect integration"
        >
          <Trash2 size={14} />
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );
};


