"use client";

import React, { useState } from "react";
import { AuthenticatorAccount } from "../lib/types";
import { IconClose } from "./Icons";
import { soundService } from "../lib/sound";

interface BackupModalProps {
  isOpen: boolean;
  accounts: AuthenticatorAccount[];
  onClose: () => void;
  onRestore: (accounts: AuthenticatorAccount[]) => void;
  onToast: (msg: string) => void;
}

export function BackupModal({
  isOpen,
  accounts,
  onClose,
  onRestore,
  onToast,
}: BackupModalProps) {
  const [importJson, setImportJson] = useState<string>("");

  if (!isOpen) return null;

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(accounts, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `google_authenticator_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    soundService.playCopyChime();
    onToast("Cadangan akun berhasil diunduh (JSON)!");
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) {
        alert("Format JSON tidak valid: Harus berupa daftar array akun.");
        return;
      }
      onRestore(parsed);
      soundService.playCopyChime();
      onToast(`Berhasil memulihkan ${parsed.length} akun!`);
      onClose();
    } catch {
      alert("Gagal membaca JSON. Pastikan format teks JSON benar.");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span>💾 Cadangan & Pemulihan Akun</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <IconClose size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Ekspor Akun (Backup)</label>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Unduh semua kunci akun 2FA Anda dalam format JSON terenkripsi/aman untuk disimpan sebagai cadangan.
            </p>
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: 8, width: "fit-content" }}
              onClick={handleExportJson}
            >
              📥 Unduh Cadangan JSON ({accounts.length} Akun)
            </button>
          </div>

          <hr style={{ borderColor: "var(--border-light)" }} />

          <div className="form-group">
            <label className="form-label">Impor dari File Cadangan (Restore)</label>
            <textarea
              rows={4}
              className="form-input"
              style={{ fontFamily: "var(--font-code)", fontSize: "0.8rem", resize: "none" }}
              placeholder="Tempelkan isi file JSON cadangan di sini..."
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
            />
            <button
              type="button"
              className="btn-secondary"
              style={{ marginTop: 8, width: "fit-content" }}
              onClick={handleImportJson}
            >
              📤 Pulihkan Akun dari JSON
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
