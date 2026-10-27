"use client";

import React, { useState, useEffect } from "react";
import { AuthenticatorAccount } from "../lib/types";
import { generateTOTP } from "../lib/totp";
import { IconCopy, IconCheck, IconQr, IconTrash, IconSchool, GoogleGLogo } from "./Icons";
import { soundService } from "../lib/sound";

interface OtpCardProps {
  account: AuthenticatorAccount;
  currentSecond: number; // 0 to 29
  timestamp: number;
  onCopy: (code: string, label: string) => void;
  onViewDetails: (account: AuthenticatorAccount) => void;
  onDelete: (id: string, name: string) => void;
}

export function OtpCard({
  account,
  currentSecond,
  timestamp,
  onCopy,
  onViewDetails,
  onDelete,
}: OtpCardProps) {
  const [code, setCode] = useState<string>("------");
  const [copied, setCopied] = useState<boolean>(false);
  const period = account.period || 30;

  // Remaining seconds in current cycle
  const remaining = period - (currentSecond % period);
  const progress = remaining / period;

  // Radius for SVG timer circle
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Compute TOTP code whenever timestamp or account secret changes
  useEffect(() => {
    let isMounted = true;
    generateTOTP(account.secret, timestamp, period, account.digits || 6).then((totp) => {
      if (isMounted) {
        setCode(totp);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [account.secret, timestamp, period, account.digits]);

  const handleCopy = () => {
    if (code && code !== "------") {
      navigator.clipboard.writeText(code);
      soundService.playCopyChime();
      setCopied(true);
      onCopy(code, `${account.issuer} (${account.account})`);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Split 6 digits into 3 + 3 (e.g. "823 109")
  const formattedCode =
    code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3, 6)}` : code;

  // Color state based on remaining time
  const isDanger = remaining <= 5;
  const isWarning = remaining > 5 && remaining <= 9;

  let timerColor = "var(--google-blue-dark)";
  if (isDanger) timerColor = "var(--timer-danger)";
  else if (isWarning) timerColor = "var(--timer-warning)";

  // Dynamic icon based on issuer
  const renderIssuerIcon = () => {
    const isDatadik =
      account.issuer.toLowerCase().includes("datadik") ||
      account.issuer.toLowerCase().includes("dapodik") ||
      account.issuer.toLowerCase().includes("kemdikbud") ||
      account.issuer.toLowerCase().includes("sekolah");
    const isGoogle =
      account.issuer.toLowerCase().includes("google") ||
      account.issuer.toLowerCase().includes("belajar.id");

    if (isDatadik) {
      return <IconSchool size={22} />;
    }
    if (isGoogle) {
      return <GoogleGLogo size={20} />;
    }
    return <span>{account.issuer.charAt(0).toUpperCase()}</span>;
  };

  return (
    <div className={`otp-card-modern ${account.pinned ? "pinned" : ""}`}>
      {/* Top Header Row of the Card */}
      <div className="card-top-row">
        <div className="card-identity">
          <div
            className="issuer-badge-avatar"
            style={{ backgroundColor: account.color || "#0288D1" }}
          >
            {renderIssuerIcon()}
          </div>
          <div>
            <div className="card-issuer-heading">
              <span className="issuer-text">{account.issuer}</span>
              {account.pinned && (
                <span className="pinned-badge">⭐ AKUN UTAMA</span>
              )}
            </div>
            <div className="account-email-text" title={account.account}>
              {account.account}
            </div>
          </div>
        </div>

        {/* Card Top Actions */}
        <div className="card-top-actions">
          <button
            className="icon-action-btn"
            onClick={() => onViewDetails(account)}
            title="Lihat Detail & QR Code"
          >
            <IconQr size={18} />
          </button>
          {!account.pinned && (
            <button
              className="icon-action-btn delete"
              onClick={() => onDelete(account.id, `${account.issuer} (${account.account})`)}
              title="Hapus Akun"
            >
              <IconTrash size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Big OTP Code & Timer Box */}
      <div className="otp-display-box" onClick={handleCopy} title="Klik untuk menyalin kode OTP">
        <div className="otp-code-wrapper">
          <div
            className={`otp-huge-digits ${isDanger ? "danger" : isWarning ? "warning" : ""}`}
          >
            {formattedCode}
          </div>
          <div className="otp-time-hint">
            {isDanger ? (
              <span style={{ color: "var(--timer-danger)", fontWeight: 600 }}>
                ⚠️ Berakhir dalam {remaining} detik!
              </span>
            ) : isWarning ? (
              <span style={{ color: "var(--timer-warning)", fontWeight: 600 }}>
                ⏳ Tersisa {remaining} detik
              </span>
            ) : (
              <span>Berlaku {remaining} detik lagi</span>
            )}
          </div>
        </div>

        {/* Large Circular Countdown Timer */}
        <div className="timer-ring-large" title={`${remaining} detik tersisa`}>
          <svg className="timer-svg" viewBox="0 0 44 44">
            <circle
              className="timer-circle-bg"
              cx="22"
              cy="22"
              r={radius}
            />
            <circle
              className="timer-circle-fg"
              cx="22"
              cy="22"
              r={radius}
              stroke={timerColor}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <span className={`timer-ring-label ${isDanger ? "danger" : ""}`}>
            {remaining}s
          </span>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="card-bottom-actions">
        <button
          className={`btn-copy-code ${copied ? "copied" : ""}`}
          onClick={handleCopy}
        >
          {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
          <span>{copied ? "Kode Berhasil Disalin!" : "Salin Kode OTP"}</span>
        </button>

        <button
          className="btn-detail-code"
          onClick={() => onViewDetails(account)}
        >
          <IconQr size={16} />
          <span>Lihat QR</span>
        </button>
      </div>
    </div>
  );
}
