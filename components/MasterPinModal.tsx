import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, X, AlertTriangle } from 'lucide-react';

interface MasterPinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (pin: string) => void;
    actionName?: string;
    loading?: boolean;
}

const MasterPinModal: React.FC<MasterPinModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    actionName = "هذه العملية",
    loading = false
}) => {
    const [pin, setPin] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setPin('');
            // Focus after a short delay to ensure modal is rendered
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length > 0) {
            onConfirm(pin);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-red-500/30 animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="bg-red-50 dark:bg-red-900/20 p-6 flex flex-col items-center justify-center border-b border-red-100 dark:border-red-900/50 relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                        <ShieldAlert size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">
                        مصادقة أمنية مطلوبة
                    </h2>
                    <p className="text-sm text-red-600 dark:text-red-400 text-center mt-2 flex items-center gap-1">
                        <AlertTriangle size={14} />
                        أنت على وشك تنفيذ عملية حساسة
                    </p>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 text-sm text-center mb-6">
                        لإتمام <span className="font-bold text-gray-900 dark:text-white">[{actionName}]</span>، يرجى إدخال الرمز السري للإدارة (Master PIN):
                    </p>

                    <div className="mb-6">
                        <input
                            ref={inputRef}
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="••••"
                            className="w-full text-center text-3xl tracking-[1em] font-mono py-4 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:text-white transition-all"
                            maxLength={8}
                            disabled={loading}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={pin.length === 0 || loading}
                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'تنفيذ العملية'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MasterPinModal;
