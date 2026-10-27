"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AuthenticatorAccount, ThemeMode } from "../lib/types";
import { DEFAULT_ACCOUNTS } from "../lib/defaultAccounts";
import { AppHeader } from "../components/Header";
import { OtpCard } from "../components/OtpCard";
import { AddAccountModal } from "../components/AddAccountModal";
import { SecretDetailModal } from "../components/SecretDetailModal";
import { BackupModal } from "../components/BackupModal";
import { Toast } from "../components/Toast";
import { soundService } from "../lib/sound";

const STORAGE_KEY = "google_auth_accounts_v2"; // Clean version key without dummy data
const THEME_KEY = "google_auth_theme_v1";

// List of dummy IDs to cleanse
const DUMMY_IDS = new Set([
  "belajar-id-02",
  "google-workspace-03",
  "simpkb-04",
  "github-05",
  "cloudflare-06",
  "datadik-sso-01",
]);

export default function AuthenticatorApp() {
  const [accounts, setAccounts] = useState<AuthenticatorAccount[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("" );
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Time tracking state synced with real clock (initialized inside useEffect to prevent prerender warnings)
  const [timestamp, setTimestamp] = useState<number>(0);
  const [currentSecond, setCurrentSecond] = useState<number>(0);

  // Modals & Popups
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [detailAccount, setDetailAccount] = useState<AuthenticatorAccount | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hostUrl, setHostUrl] = useState<string>("http://10.10.10.138:3000");

  // Load saved accounts & theme, and purge any old dummy data
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const origin = window.location.origin;
        setHostUrl(origin.includes("localhost") ? "http://10.10.10.138:3000" : origin);
      }

      // Check current v2 storage or migrate from v1 by stripping dummy accounts
      let rawData = localStorage.getItem(STORAGE_KEY);
      if (!rawData) {
        rawData = localStorage.getItem("google_auth_accounts_v1");
      }

      if (rawData) {
        const parsed: AuthenticatorAccount[] = JSON.parse(rawData);
        // Clean out any old dummy data
        const cleanAccounts = parsed.filter((a) => !DUMMY_IDS.has(a.id));

        // Ensure the real Dapodik account is always present
        const hasDapodik = cleanAccounts.some(
          (a) =>
            a.secret === "MY2DMNBRHAZWKLJWGFSDSLJUGFQWILJYMI2TELJQGQ3DMOLCMUZTQOJZMI" ||
            a.account === "stafgetekajabar@gmail.com"
        );

        if (!hasDapodik) {
          cleanAccounts.unshift(DEFAULT_ACCOUNTS[0]);
        }

        setAccounts(cleanAccounts);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanAccounts));
        // Remove old dummy key
        localStorage.removeItem("google_auth_accounts_v1");
      } else {
        setAccounts(DEFAULT_ACCOUNTS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      }

      const savedTheme = localStorage.getItem(THEME_KEY) as ThemeMode;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch {
      setAccounts(DEFAULT_ACCOUNTS);
    }
    setIsLoaded(true);
  }, []);

  // Sync theme attribute to <html> tag
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Sync sound service
  useEffect(() => {
    soundService.enabled = soundEnabled;
  }, [soundEnabled]);

  // Persist accounts to localStorage
  const saveAccounts = (newAccounts: AuthenticatorAccount[]) => {
    setAccounts(newAccounts);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAccounts));
    } catch {
      // Ignore quota errors
    }
  };

  // High precision clock updater for 30s TOTP countdown
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const nowMs = now.getTime();
      setTimestamp(nowMs);
      setCurrentSecond(Math.floor(nowMs / 1000) % 30);
    };

    updateTime();
    const timer = setInterval(updateTime, 500);
    return () => clearInterval(timer);
  }, []);

  // Filtered accounts based on search
  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter(
      (a) =>
        a.issuer.toLowerCase().includes(q) ||
        a.account.toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const handleAddAccount = (newAcc: AuthenticatorAccount) => {
    const updated = [newAcc, ...accounts];
    saveAccounts(updated);
  };

  const handleDeleteAccount = (id: string, name: string) => {
    if (confirm(`Hapus akun 2FA "${name}"?`)) {
      const updated = accounts.filter((a) => a.id !== id);
      saveAccounts(updated);
      showToast(`Akun "${name}" dihapus.`);
    }
  };

  const handleRestoreAccounts = (restored: AuthenticatorAccount[]) => {
    saveAccounts(restored);
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  const handleShareTeam = () => {
    const shareUrl = hostUrl || (typeof window !== "undefined" ? window.location.origin : "");
    navigator.clipboard.writeText(shareUrl);
    soundService.playCopyChime();
    showToast(`Tautan tim disalin (${shareUrl})! Bagikan ke staf/rekan tim Anda.`);
  };

  return (
    <div>
      {/* Full Width Enterprise Header */}
      <AppHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onShareTeam={handleShareTeam}
      />

      {/* Main Responsive Dashboard View */}
      <main className="main-dashboard-container">
        {/* Multi-User Banner */}
        <section className="team-share-banner">
          <div className="banner-left">
            <span className="banner-badge">🌐 MULTI-USER AKTIF</span>
            <div>
              <div className="banner-text-main">
                Pusat Kode Otentikasi 2FA Siap Digunakan Bersama Rekan Tim
              </div>
              <div className="banner-text-sub">
                Rekan tim di jaringan Wi-Fi/LAN yang sama dapat membuka{" "}
                <code style={{ color: "var(--google-blue-dark)", fontWeight: 700 }}>
                  {hostUrl}
                </code>{" "}
                untuk melihat kode OTP verifikasi secara serentak dari laptop/ponsel masing-masing.
              </div>
            </div>
          </div>

          <div className="banner-actions">
            <button className="btn-banner-action" onClick={handleShareTeam}>
              📋 Salin Link Tim
            </button>
          </div>
        </section>

        {/* Accounts Grid */}
        <section>
          {isLoaded && filteredAccounts.length === 0 ? (
            <div
              style={{
                padding: "80px 20px",
                textAlign: "center",
                color: "var(--text-secondary)",
                background: "var(--bg-card)",
                borderRadius: "20px",
                border: "1px solid var(--border-light)",
              }}
            >
              <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                Tidak ada akun ditemukan
              </p>
              <p style={{ fontSize: "0.85rem", marginTop: 6 }}>
                Coba sesuaikan kata kunci pencarian atau klik tombol Tambah Akun di atas.
              </p>
            </div>
          ) : (
            <div className="accounts-grid">
              {filteredAccounts.map((account) => (
                <OtpCard
                  key={account.id}
                  account={account}
                  currentSecond={currentSecond}
                  timestamp={timestamp}
                  onCopy={(code, label) => showToast(`Kode ${code} disalin untuk ${label}`)}
                  onViewDetails={(acc) => setDetailAccount(acc)}
                  onDelete={handleDeleteAccount}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddAccount={handleAddAccount}
        onToast={showToast}
      />

      {/* Secret & QR Code Detail Modal */}
      <SecretDetailModal
        account={detailAccount}
        onClose={() => setDetailAccount(null)}
        onToast={showToast}
      />

      {/* Backup & Restore Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        accounts={accounts}
        onClose={() => setIsBackupModalOpen(false)}
        onRestore={handleRestoreAccounts}
        onToast={showToast}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
}
