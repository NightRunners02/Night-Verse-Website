import React, { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  warningText: string;
  itemDetails: React.ReactNode;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  warningText,
  itemDetails,
}) => {
  const [confirmText, setConfirmText] = useState("");

  // Reset text when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setConfirmText("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmed = confirmText === "HAPUS";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 xs:p-4 bg-slate-950/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-[340px] xs:max-w-sm sm:max-w-md bg-slate-900 border border-rose-900/50 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-rose-950/30 border-b border-rose-900/50 p-4 md:p-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-rose-500">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 animate-pulse shrink-0" />
              <h2 className="font-bold font-space text-sm md:text-base lg:text-lg tracking-tight">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="p-4 md:p-6 space-y-4 md:space-y-5">
            <div className="bg-slate-950 rounded-xl p-3 md:p-4 border border-slate-800">
              {itemDetails}
            </div>

            <div className="bg-rose-950/20 text-rose-400 p-3 md:p-4 rounded-xl border border-rose-900/40 text-[11px] md:text-xs leading-relaxed">
              <strong>Warning:</strong> {warningText}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest pl-1">
                Type <strong>HAPUS</strong> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="HAPUS"
                className="w-full bg-slate-950 border border-rose-900/50 focus:border-rose-500 focus:outline-none rounded-xl py-2 px-3 md:py-2.5 md:px-4 text-center font-mono text-slate-100 text-sm md:text-base tracking-[0.2em] transition-all"
              />
            </div>

            <div className="flex gap-2.5 pt-1.5">
              <button
                onClick={onClose}
                className="flex-1 py-2 px-3 md:py-2.5 md:px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors cursor-pointer text-[11px] md:text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (isConfirmed) {
                    onConfirm();
                    onClose();
                  }
                }}
                disabled={!isConfirmed}
                className="flex-[2] py-2 px-3 md:py-2.5 md:px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all cursor-pointer font-space flex justify-center items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-rose-900/20 text-[11px] md:text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" /> 
                Confirm Deletion
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
