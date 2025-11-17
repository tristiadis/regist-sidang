'use client';

import { useState, useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'error' | 'warning' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  confirmColor = 'error',
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    }
  }, [isOpen]);

  if (!show) return null;

  const handleConfirm = () => {
    onConfirm();
    setShow(false);
  };

  const handleCancel = () => {
    onCancel();
    setShow(false);
  };

  const colorClasses = {
    primary: 'btn-primary bg-purple-600',
    error: 'btn-error',
    warning: 'btn-warning',
    success: 'btn-success'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="card bg-white w-full max-w-md animate-scale-in">
        <div className="card-body">
          <h3 className="card-title text-xl">{title}</h3>
          <p className="text-gray-600 py-4">{message}</p>
          <div className="card-actions justify-end gap-2">
            <button
              className="btn btn-ghost"
              onClick={handleCancel}
            >
              {cancelText}
            </button>
            <button
              className={`btn ${colorClasses[confirmColor]}`}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook untuk menggunakan confirm dialog
export function useConfirm() {
  const [config, setConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'primary' | 'error' | 'warning' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const confirm = (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'primary' | 'error' | 'warning' | 'success';
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig({
        isOpen: true,
        ...options,
        onConfirm: () => {
          setConfig(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        }
      });
    });
  };

  const handleCancel = () => {
    setConfig(prev => ({ ...prev, isOpen: false }));
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      {...config}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmDialogComponent };
}
