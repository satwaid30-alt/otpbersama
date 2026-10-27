"use client";

import React, { useState, useEffect } from "react";
import { AuthenticatorAccount } from "../lib/types";
import { generateRandomSecret, parseOtpAuthUri, generateTOTP } from "../lib/totp";
import { IconClose, IconKey, IconQr, IconSchool, GoogleGLogo } from "./Icons";
import { soundService } from "../lib/sound";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (account: AuthenticatorAccount) => void;
  onToast: (msg: string) => void;
}

export function AddAccountModal({
  isOpen,
  onClose,
  onAddAccount,
  onToast,
}: AddAccountModalProps) {
  const [tab, setTab] = useState<"manual" | "uri" | "scanner">("manual");
  
  // Manual form state
  const [issuer, setIssuer] = useState<string>("Dapodik");
  const [account, setAccount] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [color, setColor] = useState<string>("#0288D1");
  const [previewCode, setPreviewCode] = useState<string>("------");

  // URI paste state
  const [uriInput, setUriInput] = useState<string>("");

  // Generate initial random secret when modal opens
  useEffect(() => {
    if (isOpen && !secret) {
      setSecret(generateRandomSecret(16));
    }
  }, [isOpen, secret]);

  // Update live preview code
  useEffect(() => {
    if (secret && secret.trim().length >= 8) {
      generateTOTP(secret.trim()).then((code) => {
        setPreviewCode(code);
      });
    } else {
      setPreviewCode("------");
    }
  }, [secret]);

  if (!isOpen) return null;

  const handleGenerateSecret = () => {
    const newSecret = generateRandomSecret(16);
    setSecret(newSecret);
    soundService.playTick();
  };

  const applyPreset = (presetIssuer: string, presetColor: string, defaultName: string) => {
    setIssuer(presetIssuer);
    setColor(presetColor);
    setAccount(defaultName);
    soundService.playTick();
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSecret = secret.replace(/[\s-]/g, "").toUpperCase();
    if (!cleanSecret || cleanSecret.length < 8) {
      alert("Masukkan kunci rahasia Base32 yang valid (minimal 8 karakter).");
      return;
    }
    if (!account.trim()) {
      alert("Masukkan nama akun / email.");
      return;
    }

    const newAcc: AuthenticatorAccount = {
      id: "acc-" + Date.now(),
      issuer: issuer.trim() || "Google",
      account: account.trim(),
      secret: cleanSecret,
      digits: 6,
      period: 30,
      color: color || "#1a73e8",
      createdAt: Date.now(),
    };

    onAddAccount(newAcc);
    soundService.playCopyChime();
    onToast(`Akun ${newAcc.issuer} berhasil ditambahkan!`);
    onClose();
  };

  const handleImportUri = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseOtpAuthUri(uriInput.trim());
    if (!parsed || !parsed.secret) {
      alert("Format URI tidak valid. Format harus: otpauth://totp/... ?secret=...&issuer=...");
      return;
    }

    const newAcc: AuthenticatorAccount = {
      id: "acc-" + Date.now(),
      issuer: parsed.issuer || "Google",
      account: parsed.account || "Akun Baru",
      secret: parsed.secret,
      digits: parsed.digits || 6,
      period: parsed.period || 30,
      color: "#1a73e8",
      createdAt: Date.now(),
    };

    onAddAccount(newAcc);
    soundService.playCopyChime();
    onToast(`Akun ${newAcc.issuer} berhasil diimpor dari URI!`);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span style={{ color: "var(--google-blue)" }}>
              <IconKey size={22} />
            </span>
            <span>Tambah Akun Baru</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <IconClose size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border-light)",
            padding: "0 24px",
            background: "var(--bg-surface)",
          }}
        >
          <button
            style={{
              flex: 1,
              padding: "12px 8px",
              fontSize: "0.84rem",
              fontWeight: 600,
              color: tab === "manual" ? "var(--google-blue-dark)" : "var(--text-secondary)",
              borderBottom: tab === "manual" ? "2px solid var(--google-blue)" : "2px solid transparent",
              transition: "all 0.2s ease",
            }}
            onClick={() => setTab("manual")}
          >
            Kunci Penyiapan (Manual)
          </button>
          <button
            style={{
              flex: 1,
              padding: "12px 8px",
              fontSize: "0.84rem",
              fontWeight: 600,
              color: tab === "uri" ? "var(--google-blue-dark)" : "var(--text-secondary)",
              borderBottom: tab === "uri" ? "2px solid var(--google-blue)" : "2px solid transparent",
              transition: "all 0.2s ease",
            }}
            onClick={() => setTab("uri")}
          >
            Impor URI otpauth
          </button>
          <button
            style={{
              flex: 1,
              padding: "12px 8px",
              fontSize: "0.84rem",
              fontWeight: 600,
              color: tab === "scanner" ? "var(--google-blue-dark)" : "var(--text-secondary)",
              borderBottom: tab === "scanner" ? "2px solid var(--google-blue)" : "2px solid transparent",
              transition: "all 0.2s ease",
            }}
            onClick={() => setTab("scanner")}
          >
            Pindai QR
          </button>
        </div>

        {tab === "manual" && (
          <form onSubmit={handleSubmitManual}>
            <div className="modal-body">
              {/* Presets */}
              <div className="form-group">
                <label className="form-label">Template Preset Cepat</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="studio-btn"
                    onClick={() =>
                      applyPreset(
                        "Dapodik",
                        "#0288D1",
                        "stafgetekajabar@gmail.com"
                      )
                    }
                  >
                    <IconSchool size={16} />
                    <span>Dapodik</span>
                  </button>
                  <button
                    type="button"
                    className="studio-btn"
                    onClick={() =>
                      applyPreset(
                        "Google",
                        "#4285F4",
                        "user@gmail.com"
                      )
                    }
                  >
                    <GoogleGLogo size={14} />
                    <span>Google</span>
                  </button>
                  <button
                    type="button"
                    className="studio-btn"
                    onClick={() =>
                      applyPreset(
                        "Layanan Lain",
                        "#6b7280",
                        "user@domain.com"
                      )
                    }
                  >
                    <span>Lainnya</span>
                  </button>
                </div>
              </div>

              {/* Issuer Name */}
              <div className="form-group">
                <label className="form-label">Layanan / Penyedia (Issuer)</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Contoh: Datadik, Google, GitHub"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                />
              </div>

              {/* Account Label / Email */}
              <div className="form-group">
                <label className="form-label">Nama Akun / Email</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="nama@domain.sch.id"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                />
              </div>

              {/* Secret Key with Random Generator */}
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <label className="form-label">Kunci Rahasia (Base32)</label>
                  <button
                    type="button"
                    onClick={handleGenerateSecret}
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--google-blue-dark)",
                      fontWeight: 600,
                    }}
                  >
                    🎲 Buat Acak
                  </button>
                </div>
                <input
                  type="text"
                  required
                  className="form-input"
                  style={{ fontFamily: "var(--font-code)", letterSpacing: "0.08em" }}
                  placeholder="Contoh: JBSWY3DPEHPK3PXP"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                />
              </div>

              {/* Live Preview Box */}
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "14px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                    Pratinjau Kode TOTP Langsung
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-code)",
                      fontSize: "1.4rem",
                      fontWeight: 700,
                      color: "var(--google-blue-dark)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {previewCode.length === 6
                      ? `${previewCode.slice(0, 3)} ${previewCode.slice(3, 6)}`
                      : previewCode}
                  </div>
                </div>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  {issuer.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Batal
              </button>
              <button type="submit" className="btn-primary">
                Simpan Akun
              </button>
            </div>
          </form>
        )}

        {tab === "uri" && (
          <form onSubmit={handleImportUri}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Tempel URI otpauth://</label>
                <textarea
                  required
                  rows={4}
                  className="form-input"
                  style={{ fontFamily: "var(--font-code)", fontSize: "0.8rem", resize: "none" }}
                  placeholder="otpauth://totp/Layanan:user@domain.com?secret=JBSWY3DPEHPK3PXP&issuer=Layanan"
                  value={uriInput}
                  onChange={(e) => setUriInput(e.target.value)}
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 4 }}>
                  URI standar format otpauth:// dari sistem autentikasi 2 langkah (2FA) Anda.
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Batal
              </button>
              <button type="submit" className="btn-primary">
                Impor Akun
              </button>
            </div>
          </form>
        )}

        {tab === "scanner" && (
          <div className="modal-body" style={{ alignItems: "center", textAlign: "center" }}>
            {/* High Tech Animated Viewfinder */}
            <div
              style={{
                width: 240,
                height: 240,
                borderRadius: 20,
                background: "#0a0a0c",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "2px solid rgba(255, 255, 255, 0.15)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            >
              {/* Laser scanning beam */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: 3,
                  background: "linear-gradient(90deg, transparent, #8ab4f8, transparent)",
                  boxShadow: "0 0 10px #8ab4f8",
                  animation: "scanBeam 2.5s infinite linear",
                }}
              />
              <IconQr size={64} />
            </div>

            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 12 }}>
              Arahkan kamera ke kode QR autentikasi 2 langkah pada layar monitor Anda.
            </p>

            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: 8 }}
              onClick={() => {
                const newAcc: AuthenticatorAccount = {
                  id: "acc-" + Date.now(),
                  issuer: "Akun 2FA (Scan)",
                  account: "user@domain.com",
                  secret: "JBSWY3DPEHPK3PXP",
                  digits: 6,
                  period: 30,
                  color: "#0288D1",
                  createdAt: Date.now(),
                };
                onAddAccount(newAcc);
                soundService.playCopyChime();
                onToast("Kode QR berhasil dipindai dan akun ditambahkan!");
                onClose();
              }}
            >
              Simulasi Pindai Berhasil
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scanBeam {
          0% {
            top: 5%;
          }
          50% {
            top: 90%;
          }
          100% {
            top: 5%;
          }
        }
      `}</style>
    </div>
  );
}
