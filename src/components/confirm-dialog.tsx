'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
}: ConfirmDialogProps) {
  const getVariantColors = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-red-400',
          iconBg: 'bg-red-500/20',
          confirmBg: 'bg-red-600 hover:bg-red-700',
          confirmBorder: 'border-red-500',
        };
      case 'warning':
        return {
          icon: 'text-yellow-400',
          iconBg: 'bg-yellow-500/20',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
          confirmBorder: 'border-yellow-500',
        };
      case 'info':
        return {
          icon: 'text-blue-400',
          iconBg: 'bg-blue-500/20',
          confirmBg: 'bg-blue-600 hover:bg-blue-700',
          confirmBorder: 'border-blue-500',
        };
    }
  };

  const colors = getVariantColors();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colors.iconBg}`}>
                    <AlertTriangle className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-300 leading-relaxed">{message}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 p-6 bg-gray-800/50 border-t border-gray-700">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 border border-gray-600"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-4 py-2.5 ${colors.confirmBg} text-white rounded-lg font-medium transition-all duration-200 border ${colors.confirmBorder} shadow-lg`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
