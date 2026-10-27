"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { AuthenticatorAccount } from "../lib/types";
import { buildOtpAuthUri, generateTOTP } from "../lib/totp";
import { IconClose, IconCopy, IconCheck, IconQr } from "./Icons";
import { soundService } from "../lib/sound";

interface SecretDetailModalProps {
  account: AuthenticatorAccount | null;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export function SecretDetailModal({
  account,
  onClose,
  onToast,
}: SecretDetailModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedUri, setCopiedUri] = useState<boolean>(false);
  
  // Verification Test state
  const [verifyInput, setVerifyInput] = useState<string>("");
  const [verifyResult, setVerifyResult] = useState<"idle" | "valid" | "invalid">("idle");

  const otpauthUri = account
    ? buildOtpAuthUri(
        account.account,
        account.secret,
        account.issuer,
        account.period || 30,
        account.digits || 6
      )
    : "";

  useEffect(() => {
    if (account && otpauthUri) {
      QRCode.toDataURL(otpauthUri, {
        width: 220,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("Error generating QR:", err));
    }
  }, [account, otpauthUri]);

  if (!account) return null;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(account.secret.replace(/\s+/g, ""));
    soundService.playCopyChime();
    setCopiedKey(true);
    onToast("Kunci rahasia (Secret Key) disalin ke clipboard!");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyUri = () => {
    navigator.clipboard.writeText(otpauthUri);
    soundService.playCopyChime();
    setCopiedUri(true);
    onToast("URI otpauth:// disalin ke clipboard!");
    setTimeout(() => setCopiedUri(false), 2000);
  };

  const handleTestVerify = async () => {
    const cleaned = verifyInput.replace(/\s+/g, "");
    if (cleaned.length !== (account.digits || 6)) {
      setVerifyResult("invalid");
      return;
    }

    const currentCode = await generateTOTP(account.secret, Date.now(), account.period || 30);
    // Also check previous window (-30s) in case of time skew
    const prevCode = await generateTOTP(account.secret, Date.now() - 30000, account.period || 30);

    if (cleaned === currentCode || cleaned === prevCode) {
      setVerifyResult("valid");
      soundService.playCopyChime();
      onToast("Kode OTP VALID & Terverifikasi!");
    } else {
      setVerifyResult("invalid");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <span style={{ color: account.color || "var(--google-blue)" }}>
              <IconQr size={22} />
            </span>
            <span>Detail & Kode QR Akun</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <IconClose size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* QR Code Presentation */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              padding: "16px",
              background: "var(--bg-surface)",
              borderRadius: "16px",
              border: "1px solid var(--border-light)",
            }}
          >
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code Authenticator"
                style={{
                  width: 190,
                  height: 190,
                  borderRadius: 12,
                  boxShadow: "var(--shadow-sm)",
                  background: "#ffffff",
                  padding: 8,
                }}
              />
            ) : (
              <div
                style={{
                  width: 190,
                  height: 190,
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 12,
                }}
              >
                Memuat QR...
              </div>
            )}
            <p
              style={{
                fontSize: "0.76rem",
                color: "var(--text-secondary)",
                textAlign: "center",
                maxWidth: 280,
              }}
            >
              Pindai kode QR ini menggunakan aplikasi autentikator di ponsel Anda untuk menambahkan akun.
            </p>
          </div>

          {/* Account & Issuer info */}
          <div className="form-group">
            <label className="form-label">Nama Akun & Layanan</label>
            <div
              style={{
                padding: "10px 14px",
                background: "var(--bg-surface)",
                borderRadius: "12px",
                border: "1px solid var(--border-light)",
                fontSize: "0.88rem",
                fontWeight: 600,
              }}
            >
              {account.issuer} —{" "}
              <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
                {account.account}
              </span>
            </div>
          </div>

          {/* Secret Key with Show/Hide & Copy */}
          <div className="form-group">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label className="form-label">Kunci Penyiapan (Secret Key Base32)</label>
              <button
                style={{
                  fontSize: "0.75rem",
                  color: "var(--google-blue-dark)",
                  fontWeight: 600,
                }}
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? "Sembunyikan" : "Tampilkan"}
              </button>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: "var(--bg-surface)",
                  borderRadius: "12px",
                  border: "1px solid var(--border-light)",
                  fontFamily: "var(--font-code)",
                  fontSize: "0.9rem",
                  letterSpacing: "0.08em",
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {showSecret
                  ? account.secret
                  : "•••• •••• •••• ••••"}
              </div>
              <button
                className="studio-btn"
                onClick={handleCopySecret}
                title="Salin Secret Key"
              >
                {copiedKey ? <IconCheck size={16} /> : <IconCopy size={16} />}
                <span>Salin</span>
              </button>
            </div>
          </div>

          {/* Test Verification Input */}
          <div
            style={{
              padding: "14px 16px",
              background: "var(--bg-surface)",
              borderRadius: "16px",
              border: "1px solid var(--border-light)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <label className="form-label" style={{ marginBottom: 2 }}>
              🧪 Uji Verifikasi Kode OTP (Simulator)
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                maxLength={6}
                placeholder="Ketik 6 digit..."
                value={verifyInput}
                onChange={(e) => {
                  setVerifyInput(e.target.value);
                  setVerifyResult("idle");
                }}
                className="form-input"
                style={{
                  fontFamily: "var(--font-code)",
                  letterSpacing: "0.15em",
                  textAlign: "center",
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  width: 140,
                }}
              />
              <button
                className="btn-primary"
                onClick={handleTestVerify}
                style={{ flex: 1, justifyContent: "center" }}
              >
                Uji Kode
              </button>
            </div>
            {verifyResult === "valid" && (
              <div
                style={{
                  color: "var(--google-green)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <IconCheck size={16} />
                <span>Kode cocok dan valid untuk akun ini!</span>
              </div>
            )}
            {verifyResult === "invalid" && (
              <div
                style={{
                  color: "var(--google-red)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                }}
              >
                ⚠️ Kode tidak cocok atau sudah kadaluarsa. Cek kembali.
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleCopyUri}>
            {copiedUri ? "URI Disalin!" : "Salin otpauth:// URI"}
          </button>
          <button className="btn-primary" onClick={onClose}>
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
