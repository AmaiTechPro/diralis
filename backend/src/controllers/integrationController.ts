import { Request, Response } from "express";
import { ShopifyOAuthService } from "../services/integration/providers/shopify/shopifyOAuthService";
import { ConnectionService } from "../services/integration/connectionService";
import { SyncOrchestratorService } from "../services/integration/syncOrchestratorService";
import { DataFreshnessService } from "../services/integration/dataFreshnessService";
import { EntitlementService } from "../services/entitlementService";

export async function connectShopify(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { shop } = req.query;
    if (!shop || typeof shop !== "string") {
      res.status(400).json({ error: "MISSING_PARAM: 'shop' query parameter is required." });
      return;
    }

    const { url, state } = ShopifyOAuthService.buildAuthorizationUrl({ userId, shop });
    res.json({ authorizationUrl: url, state });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to initiate Shopify connection." });
  }
}

export async function shopifyCallback(req: Request, res: Response): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || "https://www.diralishq.com";

  try {
    const { code, shop, state } = req.query;

    if (!code || !shop || !state || typeof code !== "string" || typeof shop !== "string" || typeof state !== "string") {
      res.redirect(`${frontendUrl}/integrations?status=error&message=Missing+required+Shopify+parameters`);
      return;
    }

    await ShopifyOAuthService.handleCallback({
      code,
      shop,
      state,
      currentUserId: (req as any).user?.userId,
    });

    res.redirect(`${frontendUrl}/integrations?status=success&provider=shopify`);
  } catch (err: any) {
    const message = encodeURIComponent(err.message || "Shopify callback failed.");
    res.redirect(`${frontendUrl}/integrations?status=error&message=${message}`);
  }
}

export async function triggerManualSync(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const connectionId = Array.isArray(req.params.connectionId)
      ? req.params.connectionId[0]
      : req.params.connectionId;

    if (!connectionId) {
      res.status(400).json({ error: "MISSING_PARAM: connectionId is required." });
      return;
    }

    const { entityName } = req.body;

    const result = await SyncOrchestratorService.orchestrateSync({
      connectionId,
      userId,
      entityName: entityName || "transactions",
    });

    res.json({
      success: result.status === "COMPLETED",
      result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to trigger sync." });
  }
}

export async function listConnections(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const connections = await ConnectionService.listConnections(userId);
    res.json({ connections });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list connections." });
  }
}

export async function deleteConnection(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const connectionId = Array.isArray(req.params.connectionId)
      ? req.params.connectionId[0]
      : req.params.connectionId;

    if (!connectionId) {
      res.status(400).json({ error: "MISSING_PARAM: connectionId is required." });
      return;
    }

    await ConnectionService.deleteConnection(userId, connectionId);
    res.json({ success: true, message: "Connection disconnected." });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to delete connection." });
  }
}

export async function listConnectionsFreshness(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Entitlement verification
    const entitlement = await EntitlementService.evaluateConnectorAccess(userId);
    if (!entitlement.allowed) {
      res.status(403).json({ error: entitlement.message || "PLAN_NOT_ENTITLED" });
      return;
    }

    const connections = await DataFreshnessService.listUserConnectionsFreshness(userId);
    res.json({ connections });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list connection freshness." });
  }
}

export async function getConnectionFreshness(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const connectionId = Array.isArray(req.params.connectionId)
      ? req.params.connectionId[0]
      : req.params.connectionId;

    if (!connectionId) {
      res.status(400).json({ error: "MISSING_PARAM: connectionId is required." });
      return;
    }

    // Entitlement verification
    const entitlement = await EntitlementService.evaluateConnectorAccess(userId);
    if (!entitlement.allowed) {
      res.status(403).json({ error: entitlement.message || "PLAN_NOT_ENTITLED" });
      return;
    }

    const freshness = await DataFreshnessService.getConnectionFreshness(userId, connectionId, true);
    if (!freshness) {
      res.status(404).json({ error: "CONNECTION_NOT_FOUND" });
      return;
    }

    res.json({ freshness });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get connection freshness." });
  }
}



export async function createConnection(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const entitlement = await EntitlementService.evaluateConnectorAccess(userId);
    if (!entitlement.allowed) {
      res.status(403).json({ error: entitlement.message || "PLAN_NOT_ENTITLED" });
      return;
    }

    const { providerId, name, config, syncFrequency } = req.body;
    if (!providerId || !config) {
      res.status(400).json({ error: "MISSING_PARAMS: 'providerId' and 'config' are required." });
      return;
    }

    const connection = await ConnectionService.createConnection({
      userId,
      providerId,
      name: name || `${providerId.toUpperCase()} Connection`,
      config,
      syncFrequency: syncFrequency || "DAILY",
    });

    res.status(201).json({ success: true, connection });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Failed to create connection." });
  }
}
