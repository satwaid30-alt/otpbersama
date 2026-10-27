"use client";

import React from "react";
import { GoogleAuthLogo, IconSearch, IconClose, IconPlus } from "./Icons";
import { ThemeMode } from "../lib/types";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAddModal: () => void;
  onOpenBackup: () => void;
  onShareTeam: () => void;
}

export function AppHeader({
  searchQuery,
  onSearchChange,
  theme,
  onToggleTheme,
  soundEnabled,
  onToggleSound,
  onOpenAddModal,
  onOpenBackup,
  onShareTeam,
}: HeaderProps) {
  return (
    <header className="app-header-responsive">
      <div className="header-container">
        {/* Brand Logo & Title */}
        <div className="brand-group">
          <GoogleAuthLogo size={36} />
          <div>
            <div className="brand-name-row">
              <span className="brand-main-title">Authenticator Hub</span>
              <span className="brand-badge-pill">2FA MULTI-USER</span>
            </div>
            <div className="brand-sub-title">Pusat Kode Otentikasi Tim</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="header-search-bar">
          <IconSearch size={18} />
          <input
            type="text"
            className="header-search-input"
            placeholder="Cari akun atau layanan..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => onSearchChange("")}
              title="Hapus pencarian"
            >
              <IconClose size={16} />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="header-actions">
          {/* Add Account Button */}
          <button
            className="btn-header-primary"
            onClick={onOpenAddModal}
            title="Tambah akun 2FA baru"
          >
            <IconPlus size={18} />
            <span>Tambah Akun</span>
          </button>

          {/* Share Team Button */}
          <button
            className="btn-header-share"
            onClick={onShareTeam}
            title="Salin tautan untuk diakses bersama rekan tim di jaringan yang sama"
          >
            <span>👥 Bagikan Link Tim</span>
          </button>

          {/* Theme Toggle */}
          <button
            className="btn-header-icon"
            onClick={onToggleTheme}
            title={theme === "dark" ? "Ganti ke Tema Terang" : "Ganti ke Tema Gelap"}
          >
            <span>{theme === "dark" ? "🌙" : "☀️"}</span>
          </button>

          {/* Sound Toggle */}
          <button
            className={`btn-header-icon ${soundEnabled ? "active" : ""}`}
            onClick={onToggleSound}
            title={soundEnabled ? "Suara Aktif" : "Suara Bisu"}
          >
            <span>{soundEnabled ? "🔔" : "🔕"}</span>
          </button>

          {/* Backup */}
          <button
            className="btn-header-icon"
            onClick={onOpenBackup}
            title="Cadangkan / Pulihkan Akun (JSON)"
          >
            <span>💾</span>
          </button>
        </div>
      </div>
    </header>
  );
}
