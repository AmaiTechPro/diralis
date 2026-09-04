import React, { useEffect, useState } from "react";
import { 
  Layers, 
  RefreshCw, 
  Plus, 
  Store, 
  CreditCard, 
  Webhook, 
  FileSpreadsheet, 
  X, 
  AlertCircle,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Copy,
  Check
} from "lucide-react";
import type { ConnectionFreshness } from "../services/integrationService";
import { 
  listIntegrationsFreshness, 
  getShopifyConnectUrl, 
  createIntegrationConnection, 
  triggerManualSync, 
  disconnectIntegration,
  provisionUniversalIngress
} from "../services/integrationService";
import { FreshnessBadge } from "../components/integrations/FreshnessBadge";

type ModalStep = "SELECT_TYPE" | "CONNECT_SHOPIFY" | "CONNECT_SQUARE" | "UNIVERSAL_SETUP" | "UNIVERSAL_SUCCESS";

export default function Integrations() {
  const [connections, setConnections] = useState<ConnectionFreshness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>("SELECT_TYPE");
  const [connectLoading, setConnectLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form State
  const [shopDomain, setShopDomain] = useState("");
  const [squareAccessToken, setSquareAccessToken] = useState("");
  const [squareLocationId, setSquareLocationId] = useState("");
  const [squareEnvironment, setSquareEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [universalName, setUniversalName] = useState("");

  // Universal Ingress Provisioned State
  const [provisionedData, setProvisionedData] = useState<{
    apiKey: string;
    ingressUrl: string;
    name: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Syncing & Disconnecting per-card action state
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);

  const fetchConnections = async () => {
    try {
      setError(null);
      const conns = await listIntegrationsFreshness();
      setConnections(conns || []);
    } catch (err: any) {
      setError(err.message || "Failed to load active connections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const openModal = () => {
    setModalStep("SELECT_TYPE");
    setModalError(null);
    setShopDomain("");
    setSquareAccessToken("");
    setSquareLocationId("");
    setUniversalName("");
    setProvisionedData(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalStep("SELECT_TYPE");
    setModalError(null);
    setProvisionedData(null);
  };

  const handleConnectShopify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopDomain.trim()) return;
    setConnectLoading(true);
    setModalError(null);
    try {
      const { authorizationUrl } = await getShopifyConnectUrl(shopDomain.trim());
      window.location.href = authorizationUrl;
    } catch (err: any) {
      setModalError(err.message || "Failed to start Shopify authorization.");
      setConnectLoading(false);
    }
  };

  const handleConnectSquare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!squareAccessToken.trim()) {
      setModalError("Square Access Token is required.");
      return;
    }
    setConnectLoading(true);
    setModalError(null);
    try {
      await createIntegrationConnection({
        providerId: "square",
        name: `Square POS (${squareEnvironment})`,
        config: {
          accessToken: squareAccessToken.trim(),
          locationId: squareLocationId.trim() || undefined,
          environment: squareEnvironment,
        },
        syncFrequency: "DAILY",
      });
      closeModal();
      fetchConnections();
    } catch (err: any) {
      setModalError(err.message || "Failed to connect Square POS.");
    } finally {
      setConnectLoading(false);
    }
  };

  const handleProvisionUniversal = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectLoading(true);
    setModalError(null);
    try {
      const res = await provisionUniversalIngress({
        name: universalName.trim() || "Custom POS Ingress",
      });
      const apiOrigin = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/api\/?$/, "");
      const fullUrl = `${apiOrigin}${res.ingressUrl}`;
      setProvisionedData({
        apiKey: res.apiKey,
        ingressUrl: fullUrl,
        name: universalName.trim() || "Custom POS Ingress",
      });
      setModalStep("UNIVERSAL_SUCCESS");
      fetchConnections();
    } catch (err: any) {
      setModalError(err.message || "Failed to provision custom ingress webhook.");
    } finally {
      setConnectLoading(false);
    }
  };

  const handleManualSync = async (connectionId: string) => {
    setSyncingId(connectionId);
    setActionError(null);
    try {
      const res = await triggerManualSync(connectionId, "transactions");
      if (!res.success) {
        setActionError({ id: connectionId, message: res.result?.error || "Sync did not complete cleanly." });
      }
      fetchConnections();
    } catch (err: any) {
      setActionError({ id: connectionId, message: err.message || "Failed to trigger sync." });
    } finally {
      setSyncingId(null);
    }
  };

  const handleDisconnect = async (connection: ConnectionFreshness) => {
    if (!window.confirm(`Disconnect ${connection.name}? Automatic syncing will cease.`)) return;
    setDisconnectingId(connection.connectionId);
    setActionError(null);
    try {
      await disconnectIntegration(connection.connectionId);
      fetchConnections();
    } catch (err: any) {
      setActionError({ id: connection.connectionId, message: err.message || "Failed to disconnect." });
    } finally {
      setDisconnectingId(null);
    }
  };

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

  const getProviderIcon = (provider: string) => {
    const p = provider.toLowerCase();
    if (p.includes("shopify")) return <Store size={20} className="text-emerald-400" />;
    if (p.includes("square")) return <CreditCard size={20} className="text-cyan-400" />;
    return <Webhook size={20} className="text-purple-400" />;
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <Layers className="text-cyan-400" />
            Connected Business Systems
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage live POS registers, e-commerce stores, and custom ingress streams powering Diralis AI analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchConnections}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-cyan-400" : ""} />
            Refresh
          </button>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-lg shadow-cyan-900/30 cursor-pointer"
          >
            <Plus size={16} />
            Connect System
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Connections List / Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
            <RefreshCw size={24} className="animate-spin text-cyan-400 mx-auto mb-3" />
            Loading active connections...
          </div>
        ) : connections.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">
            <div className="mx-auto w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-4">
              <Layers size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-200">No active business connections</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1 mb-6">
              Connect your point of sale, retail store, or direct webhook ingress to begin streaming transactions into Diralis AI.
            </p>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Add First Connection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.map((conn) => {
              const isSyncing = syncingId === conn.connectionId || conn.syncInProgress;
              const isDisconnecting = disconnectingId === conn.connectionId;
              const err = actionError?.id === conn.connectionId ? actionError.message : conn.errorDetails;

              return (
                <div
                  key={conn.connectionId}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
                          {getProviderIcon(conn.provider)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-100 leading-tight">{conn.name}</h3>
                          <p className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">{conn.provider}</p>
                        </div>
                      </div>
                      <FreshnessBadge freshness={conn.freshness} />
                    </div>

                    {/* Stats Grid */}
                    <div className="mt-5 grid grid-cols-2 gap-3 text-xs bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
                      <div>
                        <span className="text-slate-500 block">Last Synced</span>
                        <span className="font-medium text-slate-200 mt-0.5 block">
                          {formatRelativeTime(conn.lastSuccessfulSyncAt)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Records Processed</span>
                        <span className="font-medium text-slate-200 mt-0.5 block">
                          {(conn.recordsLastSynced || 0).toLocaleString()} records
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Next Scheduled</span>
                        <span className="font-medium text-slate-200 mt-0.5 block">
                          {conn.nextSyncAt
                            ? new Date(conn.nextSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "Real-time / Push"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Status</span>
                        <span className="font-medium text-emerald-400 mt-0.5 block">
                          {conn.status}
                        </span>
                      </div>
                    </div>

                    {err && (
                      <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                        <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-400" />
                        <span>{err}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleManualSync(conn.connectionId)}
                      disabled={isSyncing || conn.provider === "universal"}
                      className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
                      title={conn.provider === "universal" ? "Receives live push events" : "Trigger sync"}
                    >
                      <RefreshCw size={13} className={isSyncing ? "animate-spin text-cyan-400" : ""} />
                      {conn.provider === "universal" ? "Live Push" : isSyncing ? "Syncing..." : "Sync Now"}
                    </button>

                    <button
                      onClick={() => handleDisconnect(conn)}
                      disabled={isDisconnecting}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Disconnect integration"
                    >
                      <Trash2 size={13} />
                      <span>{isDisconnecting ? "Disconnecting..." : "Disconnect"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fallback Reference to Datasets */}
      <div className="mt-12 p-6 rounded-xl border border-slate-800/80 bg-slate-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h4 className="font-medium text-slate-200">Have offline registers or CSV exports?</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              You can manually upload Excel or CSV exports for one-off analytical profiling and AI insights.
            </p>
          </div>
        </div>
        <a
          href="/datasets"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors whitespace-nowrap"
        >
          Manage Datasets <ArrowRight size={13} />
        </a>
      </div>

      {/* Unified Connect Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X size={18} />
            </button>

            {modalStep === "SELECT_TYPE" && (
              <div>
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Plus className="text-cyan-400" size={20} />
                  Connect Business System
                </h3>
                <p className="text-xs text-slate-400 mt-1 mb-5">
                  Select your system type to synchronize transactions with Diralis AI.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => setModalStep("CONNECT_SHOPIFY")}
                    className="w-full p-4 rounded-xl border border-slate-800 hover:border-emerald-500/50 bg-slate-950/40 hover:bg-slate-950/80 transition-all text-left flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Store size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                          Shopify Store / POS
                        </div>
                        <div className="text-xs text-slate-400">OAuth 2.0 automated sync for orders & catalog</div>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </button>

                  <button
                    onClick={() => setModalStep("CONNECT_SQUARE")}
                    className="w-full p-4 rounded-xl border border-slate-800 hover:border-cyan-500/50 bg-slate-950/40 hover:bg-slate-950/80 transition-all text-left flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">
                          Square POS
                        </div>
                        <div className="text-xs text-slate-400">Direct API integration for payments & inventory</div>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </button>

                  <button
                    onClick={() => setModalStep("UNIVERSAL_SETUP")}
                    className="w-full p-4 rounded-xl border border-slate-800 hover:border-purple-500/50 bg-slate-950/40 hover:bg-slate-950/80 transition-all text-left flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Webhook size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-100 group-hover:text-purple-400 transition-colors">
                          Universal POS Ingress (Webhook / Push API)
                        </div>
                        <div className="text-xs text-slate-400">Connect any POS, ERP, or custom billing system via webhook</div>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-slate-500 group-hover:text-purple-400 transition-colors" />
                  </button>
                </div>
              </div>
            )}

            {modalStep === "CONNECT_SHOPIFY" && (
              <div>
                <button
                  onClick={() => setModalStep("SELECT_TYPE")}
                  className="text-xs text-slate-400 hover:text-slate-200 mb-3 block cursor-pointer"
                >
                  ← Back to options
                </button>
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Store className="text-emerald-400" size={20} />
                  Connect Shopify Store
                </h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Enter your store handle to begin secure OAuth handshake.
                </p>

                {modalError && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="text-rose-400 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <form onSubmit={handleConnectShopify} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Shop Domain / Handle
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="my-store.myshopify.com"
                      value={shopDomain}
                      onChange={(e) => setShopDomain(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-hidden focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={connectLoading}
                      className="px-4 py-2 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {connectLoading ? "Connecting..." : "Proceed to Shopify"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {modalStep === "CONNECT_SQUARE" && (
              <div>
                <button
                  onClick={() => setModalStep("SELECT_TYPE")}
                  className="text-xs text-slate-400 hover:text-slate-200 mb-3 block cursor-pointer"
                >
                  ← Back to options
                </button>
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <CreditCard className="text-cyan-400" size={20} />
                  Connect Square POS
                </h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Enter your Square API credentials for direct synchronization.
                </p>

                {modalError && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="text-rose-400 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <form onSubmit={handleConnectSquare} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Environment
                    </label>
                    <select
                      value={squareEnvironment}
                      onChange={(e) => setSquareEnvironment(e.target.value as "sandbox" | "production")}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-hidden focus:border-cyan-500"
                    >
                      <option value="sandbox">Sandbox (Development / Testing)</option>
                      <option value="production">Production (Live Store)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Square Access Token
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="EAAA..."
                      value={squareAccessToken}
                      onChange={(e) => setSquareAccessToken(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-hidden focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Location ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="LP3EEGBWK5GB3"
                      value={squareLocationId}
                      onChange={(e) => setSquareLocationId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-hidden focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={connectLoading}
                      className="px-4 py-2 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {connectLoading ? "Connecting..." : "Connect Square"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {modalStep === "UNIVERSAL_SETUP" && (
              <div>
                <button
                  onClick={() => setModalStep("SELECT_TYPE")}
                  className="text-xs text-slate-400 hover:text-slate-200 mb-3 block cursor-pointer"
                >
                  ← Back to options
                </button>
                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                  <Webhook className="text-purple-400" size={20} />
                  Provision Universal Ingress
                </h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Name your connection to generate a dedicated secure webhook endpoint and API key.
                </p>

                {modalError && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="text-rose-400 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <form onSubmit={handleProvisionUniversal} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Connection Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Odoo POS, Loyverse Register, Custom Cash System"
                      value={universalName}
                      onChange={(e) => setUniversalName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-hidden focus:border-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={connectLoading}
                      className="px-4 py-2 text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {connectLoading ? "Provisioning..." : "Generate Webhook & Key"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {modalStep === "UNIVERSAL_SUCCESS" && provisionedData && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">Ingress Ready: {provisionedData.name}</h3>
                    <p className="text-xs text-slate-400">Push transactions to stream into Diralis Canonical AI.</p>
                  </div>
                </div>

                <div className="space-y-3 mt-4 text-xs">
                  {/* Endpoint */}
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">Ingestion Endpoint (POST)</span>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <code className="text-purple-300 text-[11px] truncate flex-1 font-mono">
                        {provisionedData.ingressUrl}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(provisionedData.ingressUrl);
                          setCopiedUrl(true);
                          setTimeout(() => setCopiedUrl(false), 2000);
                        }}
                        className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                        title="Copy URL"
                      >
                        {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Header Key */}
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">Header: x-diralis-key</span>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <code className="text-cyan-300 text-[11px] truncate flex-1 font-mono">
                        {provisionedData.apiKey}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(provisionedData.apiKey);
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                        className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                        title="Copy Key"
                      >
                        {copiedKey ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Example Payload */}
                  <div className="mt-3 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400">
                    <span className="text-slate-300 font-medium block mb-1">JSON Payload Format:</span>
                    <pre className="text-[10px] text-slate-300 font-mono whitespace-pre overflow-x-auto">
{`{
  "externalId": "order_1001",
  "totalAmount": 149.50,
  "transactionDate": "2026-09-04T10:30:00Z",
  "status": "COMPLETED"
}`}
                    </pre>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
