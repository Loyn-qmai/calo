import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'danger'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  type === 'danger' ? 'bg-red-50 text-red-500' : 
                  type === 'warning' ? 'bg-orange-50 text-orange-500' : 
                  'bg-blue-50 text-blue-500'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">{title}</h3>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {message}
              </p>
            </div>
            <div className="flex items-center gap-3 p-4 bg-neutral-50 border-t border-border">
              <button
                onClick={onClose}
                className="flex-1 py-2 text-sm font-bold text-text-secondary hover:bg-neutral-100 rounded-lg transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 py-2 text-sm font-bold text-white rounded-lg transition-colors ${
                  type === 'danger' ? 'bg-red-500 hover:bg-red-600' : 
                  type === 'warning' ? 'bg-orange-500 hover:bg-orange-600' : 
                  'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
