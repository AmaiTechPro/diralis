import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Bell,
  Shield,
  Palette,
  KeyRound,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  X,
  Download,
} from "lucide-react";
import {
  getSettings,
  updateSettings,
  updateProfile,
  changePassword,
  setup2FA,
  verify2FA,
  disable2FA,
} from "../services/settingsService";

export default function Settings() {
  const { user } = useAuth();
  const { setTheme: applyTheme } = useTheme();

  const [theme, setTheme] = useState("dark");
  const [emailNotifications, setEmailNotifications] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 2FA Security State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedBackupCodes, setCopiedBackupCodes] = useState(false);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getSettings();
        setTheme(data.theme ?? "dark");
        setEmailNotifications(data.emailNotifications ?? true);
        setTwoFactorEnabled(Boolean(data.twoFactorEnabled));
        applyTheme(data.theme ?? "dark");
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
    loadSettings();
  }, [applyTheme]);

  async function handleSettingsUpdate(updates: {
    theme?: string;
    emailNotifications?: boolean;
  }) {
    try {
      const updated = await updateSettings({
        theme: updates.theme ?? theme,
        emailNotifications: updates.emailNotifications ?? emailNotifications,
      });

      setTheme(updated.theme);
      setEmailNotifications(updated.emailNotifications);
      applyTheme(updated.theme);
      setMessage({ type: "success", text: "Settings updated." });
    } catch {
      setMessage({ type: "error", text: "Failed to update settings." });
    }
  }

  async function handleProfileSave() {
    try {
      await updateProfile({
        fullName,
        email,
      });
      setMessage({ type: "success", text: "Profile updated." });
    } catch {
      setMessage({ type: "error", text: "Failed to update profile." });
    }
  }

  async function handlePasswordChange() {
    if (!currentPassword || !newPassword) {
      setMessage({ type: "error", text: "Current and new passwords are required." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    try {
      await changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Password updated." });
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || "Failed to change password.";
      setMessage({ type: "error", text: errMsg });
    }
  }

  // 2FA Actions
  async function handleStart2FASetup() {
    try {
      setTwoFactorLoading(true);
      const data = await setup2FA();
      setQrCodeUrl(data.qrCode);
      setSecretKey(data.secret);
      setIsSettingUp2FA(true);
      setMessage(null);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.response?.data?.message || "Failed to initiate 2FA setup.",
      });
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function handleConfirm2FA() {
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setMessage({ type: "error", text: "Enter the 6-digit code from your authenticator app." });
      return;
    }

    try {
      setTwoFactorLoading(true);
      const data = await verify2FA(verificationCode.trim());
      setBackupCodes(data.backupCodes || []);
      setTwoFactorEnabled(true);
      setIsSettingUp2FA(false);
      setVerificationCode("");
      setMessage({
        type: "success",
        text: "Two-factor authentication enabled successfully. Please save your recovery backup codes.",
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.response?.data?.message || "Invalid verification code.",
      });
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function handleConfirmDisable2FA() {
    if (!disablePassword) {
      setMessage({ type: "error", text: "Enter your current password to confirm disabling 2FA." });
      return;
    }

    try {
      setTwoFactorLoading(true);
      await disable2FA(disablePassword);
      setTwoFactorEnabled(false);
      setIsDisabling2FA(false);
      setDisablePassword("");
      setBackupCodes([]);
      setMessage({ type: "success", text: "Two-factor authentication disabled." });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.response?.data?.message || "Failed to disable 2FA. Check your password.",
      });
    } finally {
      setTwoFactorLoading(false);
    }
  }

  function handleDownloadBackupCodes() {
    const content = [
      "DIRALIS ENTERPRISE - RECOVERY BACKUP CODES",
      `Generated: ${new Date().toUTCString()}`,
      `Account: ${email || user?.email || ""}`,
      "",
      "Each code can only be used once if you lose access to your authenticator app:",
      "----------------------------------------------------------------------",
      ...backupCodes.map((code, i) => `${i + 1}. ${code}`),
      "----------------------------------------------------------------------",
      "Keep this file in a secure, encrypted location or password manager.",
    ].join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `diralis-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function handleCopyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedBackupCodes(true);
    setTimeout(() => setCopiedBackupCodes(false), 2500);
  }

  return (
    <div>
      <h1 className="text-4xl font-bold">Settings</h1>
      <p className="mt-3 text-slate-400">Configure your Diralis preferences.</p>

      {message && (
        <div
          className={`mt-6 flex items-center justify-between rounded-lg p-3 ${
            message.type === "success"
              ? "border border-cyan-500 bg-cyan-500/20 text-cyan-300"
              : "border border-rose-500 bg-rose-500/20 text-rose-300"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Backup Codes Alert Card */}
      {backupCodes.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-950/20 p-6 text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-400" size={24} />
            <h3 className="text-lg font-semibold text-amber-300">
              Save Your Recovery Backup Codes
            </h3>
          </div>
          <p className="mt-2 text-sm text-amber-200/80">
            If you lose access to your authenticator app, these one-time codes are the only way to
            regain access to your account. Each code can be used once.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-black/40 p-4 font-mono text-sm tracking-wider sm:grid-cols-4">
            {backupCodes.map((code, idx) => (
              <span
                key={idx}
                className="rounded border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-center text-cyan-300"
              >
                {code}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleCopyBackupCodes}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400"
            >
              {copiedBackupCodes ? <Check size={16} /> : <Copy size={16} />}
              {copiedBackupCodes ? "Copied to Clipboard" : "Copy All Codes"}
            </button>
            <button
              onClick={handleDownloadBackupCodes}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/20"
            >
              <Download size={16} />
              Download (.txt)
            </button>
            <button
              onClick={() => setBackupCodes([])}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
            >
              I Have Saved These Codes
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Account Profile Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <User className="text-cyan-400" size={22} />
            <h2 className="text-xl font-semibold">Account</h2>
          </div>

          <div className="mt-5 space-y-4">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg bg-slate-800 p-3"
              placeholder="Full Name"
            />

            <input
              value={user?.username || ""}
              readOnly
              className="w-full cursor-not-allowed rounded-lg bg-slate-700 p-3 text-slate-400"
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-slate-800 p-3"
              placeholder="Email"
            />

            <button
              onClick={handleProfileSave}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-black hover:bg-cyan-400"
            >
              Save Profile
            </button>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <Bell className="text-cyan-400" size={22} />
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>

          <label className="mt-5 flex items-center justify-between">
            <span>Enable alerts</span>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) =>
                handleSettingsUpdate({
                  emailNotifications: e.target.checked,
                })
              }
            />
          </label>
        </div>

        {/* Security & Password Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <Shield className="text-cyan-400" size={22} />
            <h2 className="text-xl font-semibold">Security</h2>
          </div>

          <div className="mt-5 space-y-3">
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-800 p-3"
            />

            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-800 p-3"
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg bg-slate-800 p-3"
            />

            <button
              onClick={handlePasswordChange}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-black hover:bg-cyan-400"
            >
              Change Password
            </button>
          </div>

          {/* Two-Factor Authentication Section */}
          <div className="mt-8 border-t border-slate-800 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-cyan-400" />
                <h3 className="font-semibold text-slate-200">Two-Factor Authentication</h3>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  twoFactorEnabled
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border border-slate-700 bg-slate-800 text-slate-400"
                }`}
              >
                {twoFactorEnabled && <CheckCircle2 size={12} />}
                {twoFactorEnabled ? "Active" : "Disabled"}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Protect your account using an authenticator app (Google Authenticator, Authy, or 1Password).
            </p>

            <div className="mt-4">
              {!twoFactorEnabled ? (
                <button
                  onClick={handleStart2FASetup}
                  disabled={twoFactorLoading || isSettingUp2FA}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-black hover:bg-cyan-400 disabled:opacity-50"
                >
                  {twoFactorLoading ? "Preparing..." : "Configure 2FA"}
                </button>
              ) : (
                <button
                  onClick={() => setIsDisabling2FA(true)}
                  className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/20"
                >
                  Disable 2FA
                </button>
              )}
            </div>

            {/* 2FA Setup Flow */}
            {isSettingUp2FA && qrCodeUrl && (
              <div className="mt-5 rounded-xl border border-cyan-500/40 bg-slate-950 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-cyan-300">Scan QR Code</h4>
                  <button
                    onClick={() => setIsSettingUp2FA(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Scan this code in your authenticator app, or enter the setup key manually:
                </p>
                <div className="mt-3 flex flex-col items-center gap-2">
                  <img
                    src={qrCodeUrl}
                    alt="2FA QR Code"
                    className="h-40 w-40 rounded-lg bg-white p-2"
                  />
                  {secretKey && (
                    <div className="font-mono text-xs text-slate-400">
                      Key: <span className="select-all text-cyan-300">{secretKey}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit code"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-center font-mono text-lg tracking-widest text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <button
                    onClick={handleConfirm2FA}
                    disabled={twoFactorLoading || verificationCode.length !== 6}
                    className="w-full rounded-lg bg-cyan-500 py-2 text-sm font-medium text-black hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {twoFactorLoading ? "Verifying..." : "Verify and Activate"}
                  </button>
                </div>
              </div>
            )}

            {/* 2FA Disable Prompt */}
            {isDisabling2FA && (
              <div className="mt-5 rounded-xl border border-rose-500/40 bg-slate-950 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-rose-300">Disable 2FA</h4>
                  <button
                    onClick={() => setIsDisabling2FA(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Enter your password to confirm disabling two-factor authentication:
                </p>
                <div className="mt-3 space-y-2">
                  <input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Current Password"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-sm text-white focus:border-rose-500 focus:outline-none"
                  />
                  <button
                    onClick={handleConfirmDisable2FA}
                    disabled={twoFactorLoading || !disablePassword}
                    className="w-full rounded-lg bg-rose-600 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-50"
                  >
                    {twoFactorLoading ? "Disabling..." : "Confirm & Disable"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Appearance Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center gap-3">
            <Palette className="text-cyan-400" size={22} />
            <h2 className="text-xl font-semibold">Appearance</h2>
          </div>

          <select
            value={theme}
            onChange={(e) => {
              setTheme(e.target.value);
              applyTheme(e.target.value);
              handleSettingsUpdate({
                theme: e.target.value,
              });
            }}
            className="mt-5 w-full rounded-lg bg-slate-800 p-3"
          >
            <option value="dark">Dark Mode</option>
            <option value="light">Light Mode</option>
          </select>
        </div>
      </div>
    </div>
  );
}

