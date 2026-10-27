"use client";

import React from "react";
import { IconCheck } from "./Icons";

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  if (!message) return null;

  return (
    <div className="toast-container" onClick={onClose}>
      <div className="toast-pill">
        <span className="toast-icon">
          <IconCheck size={18} />
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
}
