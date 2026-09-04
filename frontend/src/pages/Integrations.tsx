import React, { useEffect, useState } from "react";
import { Store, RefreshCw, Database, Layers, AlertCircle, CreditCard, X } from "lucide-react";
import type { ConnectionFreshness } from "../services/integrationService";
import {
  listIntegrationsFreshness,
  getShopifyConnectUrl,
  createIntegrationConnection,
} from "../services/integrationService";
import { IntegrationCard } from "../components/integrations/IntegrationCard";
import type { ConnectorMeta } from "../components/integrations/IntegrationCard";

const AVAILABLE_CONNECTORS: ConnectorMeta[] = [
  {
    id: "shopify",
    name: "Shopify POS",
    category: "Point of Sale & Retail Orders",
    description: "Synchronize retail POS orders, product items, and store inventory directly into Diralis's canonical engine.",
    icon: Store,
    connectButtonLabel: "Connect Shopify Store",
  },
  {
    id: "square",
    name: "Square POS",
    category: "Point of Sale & Payments",
    description: "Synchronize Square payment orders, catalog items, and retail locations directly into Diralis's canonical engine.",
    icon: CreditCard,
    connectButtonLabel: "Connect Square POS",
  },
];

export default function Integrations() {
  const [connections, setConnections] = useState<ConnectionFreshness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active modal state
  const [activeModal, setActiveModal] = useState<"shopify" | "square" | null>(null);

  // Shopify form state
  const [shopDomain, setShopDomain] = useState("");

  // Square form state
  const [squareAccessToken, setSquareAccessToken] = useState("");
  const [squareLocationId, setSquareLocationId] = useState("");
  const [squareEnvironment, setSquareEnvironment] = useState<"sandbox" | "production">("sandbox");

  const [connectLoading, setConnectLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchConnections = async () => {
    try {
      setError(null);
      const conns = await listIntegrationsFreshness();
      setConnections(conns || []);
    } catch (err: any) {
      setError(err.message || "Failed to load integrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleConnectShopify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopDomain.trim()) return;

    setConnectLoading(true);
    setModalError(null);

    try {
      const { authorizationUrl } = await getShopifyConnectUrl(shopDomain.trim());
      window.location.href = authorizationUrl;
    } catch (err: any) {
      setModalError(err.message || "Failed to start Shopify connection.");
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

      setActiveModal(null);
      setSquareAccessToken("");
      setSquareLocationId("");
      fetchConnections();
    } catch (err: any) {
      setModalError(err.message || "Failed to connect Square POS.");
    } finally {
      setConnectLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <Layers className="text-cyan-400" />
            Integrations & Business Data
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect live business platforms for continuous synchronization into Diralis Canonical Analytics.
          </p>
        </div>

        <button
          onClick={fetchConnections}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors self-start md:self-auto cursor-pointer"
        >
          <RefreshCw size={15} className={loading ? "animate-spin text-cyan-400" : ""} />
          Refresh Freshness
        </button>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dynamic Grid of Available & Active Integrations */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AVAILABLE_CONNECTORS.map((connector) => {
          const connection = connections.find(
            (c) => c.provider.toLowerCase() === connector.id.toLowerCase()
          );

          return (
            <IntegrationCard
              key={connector.id}
              connector={connector}
              connection={connection}
              onRefresh={fetchConnections}
              onConnectClick={() => {
                setModalError(null);
                setActiveModal(connector.id as "shopify" | "square");
              }}
            />
          );
        })}

        {/* CSV File Upload Card (Standard Ingestion) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Database size={22} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">CSV & Excel Datasets</h3>
                  <p className="text-xs text-slate-400">File Ingestion</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active Source
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Upload spreadsheets and custom exports for one-off analytical profiling, AI insights, and scenario modeling.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <a
              href="/datasets"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Manage Datasets
            </a>
          </div>
        </div>
      </div>

      {/* Connect Shopify Modal */}
      {activeModal === "shopify" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Store className="text-emerald-400" size={20} />
              Connect Shopify Store
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter your Shopify store domain to initiate secure OAuth 2.0 authorization.
            </p>

            {modalError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="text-rose-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleConnectShopify} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Shop Domain or Handle
                </label>
                <input
                  type="text"
                  required
                  placeholder="my-store.myshopify.com"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-600 focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connectLoading}
                  className="px-4 py-2 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {connectLoading ? "Connecting..." : "Proceed to Shopify"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect Square Modal */}
      {activeModal === "square" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <CreditCard className="text-cyan-400" size={20} />
              Connect Square POS
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter your Square API credentials to synchronize payments and inventory.
            </p>

            {modalError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="text-rose-400 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleConnectSquare} className="mt-4 space-y-4">
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
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connectLoading}
                  className="px-4 py-2 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {connectLoading ? "Connecting..." : "Connect Square"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
