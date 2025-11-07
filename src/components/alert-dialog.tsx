'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, X, XCircle } from 'lucide-react';
import { useEffect } from 'react';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
  autoClose = false,
  autoCloseDuration = 3000,
}: AlertDialogProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDuration, onClose]);

  const getVariantConfig = () => {
    switch (variant) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-500/20',
          borderColor: 'border-emerald-500/30',
          buttonBg: 'bg-emerald-600 hover:bg-emerald-700',
        };
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-red-400',
          iconBg: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          buttonBg: 'bg-red-600 hover:bg-red-700',
        };
      case 'warning':
        return {
          icon: AlertCircle,
          iconColor: 'text-yellow-400',
          iconBg: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
        };
      case 'info':
        return {
          icon: Info,
          iconColor: 'text-blue-400',
          iconBg: 'bg-blue-500/20',
          borderColor: 'border-blue-500/30',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  };

  const config = getVariantConfig();
  const IconComponent = config.icon;

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
              className={`bg-gray-900 border ${config.borderColor} rounded-2xl shadow-2xl max-w-md w-full overflow-hidden`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.iconBg}`}>
                    <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
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
              <div className="flex items-center justify-end p-6 bg-gray-800/50 border-t border-gray-700">
                <button
                  onClick={onClose}
                  className={`px-6 py-2.5 ${config.buttonBg} text-white rounded-lg font-medium transition-all duration-200 shadow-lg`}
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
