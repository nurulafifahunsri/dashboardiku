"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  children: ReactNode;
  onClose: () => void;
  ariaLabel?: string;
  labelledBy?: string;
  className?: string;
  overlayClassName?: string;
}

const ModalShell: React.FC<Props> = ({
  children,
  onClose,
  ariaLabel,
  labelledBy,
  className = "",
  overlayClassName = "",
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 top-0 z-[100] flex min-h-screen items-center justify-center bg-slate-950/45 px-4 py-6 ${overlayClassName}`}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      onClick={onClose}
    >
      <div className={className} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default ModalShell;
