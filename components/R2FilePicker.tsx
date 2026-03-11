import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Video, Music, Loader2, CheckCircle2, FileVideo, Clock, HardDrive, RefreshCw, Folder, ChevronRight, ChevronLeft, Plus, Upload, Trash2, Edit3, FolderPlus, Check, MoreVertical } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useToast } from './Toast';

interface R2File {
    id: string;
    name: string;
    fullName: string;
    size: number;
    lastModified: string;
    url: string;
}

interface R2Folder {
    name: string;
    path: string;
}

interface R2FilePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
    onSelectMultiple?: (urls: string[]) => void;
    multiSelect?: boolean;
}

const R2FilePicker: React.FC<R2FilePickerProps> = ({ isOpen, onClose, onSelect, onSelectMultiple, multiSelect = false }) => {
    const toast = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<R2File[]>([]);
    const [folders, setFolders] = useState<R2Folder[]>([]);
    const [currentPrefix, setCurrentPrefix] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingProgress, setUploadingProgress] = useState<{ [key: string]: number }>({});
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

    // UI States for actions
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [editingItem, setEditingItem] = useState<{ key: string, name: string, isFolder: boolean } | null>(null);
    const [newItemName, setNewItemName] = useState('');

    const fetchFiles = useCallback(async (prefix: string = currentPrefix) => {
        setIsLoading(true);
        setError(null);
        try {
            const { api } = await import('../services/api');
            const data = await api.r2.listFiles(prefix);

            setFiles(data.files || []);
            setFolders(data.folders || []);
            setCurrentPrefix(data.prefix || '');
        } catch (err: any) {
            console.error('Error fetching R2 files:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [currentPrefix]);

    useEffect(() => {
        if (isOpen) {
            fetchFiles('');
        }
    }, [isOpen]);

    const handleFolderClick = (path: string) => {
        fetchFiles(path);
    };

    const handleGoUp = () => {
        if (!currentPrefix) return;
        const parts = currentPrefix.split('/').filter(Boolean);
        parts.pop();
        const newPrefix = parts.length > 0 ? parts.join('/') + '/' : '';
        fetchFiles(newPrefix);
    };

    const handleSelectFolderItems = () => {
        const folderUrls = filteredFiles.map(f => f.url);
        if (selectedUrls.size === folderUrls.length) {
            // Unselect all in view
            setSelectedUrls(new Set());
        } else {
            // Select all in view
            setSelectedUrls(new Set([...Array.from(selectedUrls), ...folderUrls]));
        }
    };

    const filteredFiles = useMemo(() => {
        return files.filter(file =>
            file.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [files, searchTerm]);

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ar-EG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        const { api } = await import('../services/api');

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const fileId = `${Date.now()}-${file.name}`;

            try {
                setUploadingProgress(prev => ({ ...prev, [fileId]: 0 }));

                // 1. Get pre-signed URL
                const { uploadUrl } = await api.r2.getUploadUrl(
                    file.name,
                    file.type,
                    currentPrefix
                );

                // 2. Upload directly to R2
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', uploadUrl, true);
                xhr.setRequestHeader('Content-Type', file.type);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        setUploadingProgress(prev => ({ ...prev, [fileId]: percent }));
                    }
                };

                const uploadPromise = new Promise((resolve, reject) => {
                    xhr.onload = () => xhr.status === 200 ? resolve(xhr.response) : reject(new Error('Upload failed'));
                    xhr.onerror = () => reject(new Error('Upload error'));
                });

                xhr.send(file);
                await uploadPromise;

                toast.success(`تم رفع ${file.name} بنجاح`);
            } catch (err: any) {
                console.error('Upload error:', err);
                toast.error(`فشل رفع ${file.name}: ${err.message}`);
            } finally {
                setUploadingProgress(prev => {
                    const next = { ...prev };
                    delete next[fileId];
                    return next;
                });
            }
        }

        fetchFiles();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDelete = async (key: string, name: string) => {
        if (!window.confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;

        try {
            const { api } = await import('../services/api');
            await api.r2.deleteFile(key);
            toast.success('تم الحذف بنجاح');
            fetchFiles();
        } catch (err: any) {
            toast.error(`فشل الحذف: ${err.message}`);
        }
    };

    const handleRename = async () => {
        if (!editingItem || !newItemName.trim()) return;

        try {
            const { api } = await import('../services/api');
            const oldKey = editingItem.key;
            const newKey = currentPrefix + newItemName.trim() + (editingItem.isFolder ? '/' : '');

            await api.r2.renameFile(oldKey, newKey);
            toast.success('تمت إعادة التسمية بنجاح');
            setEditingItem(null);
            fetchFiles();
        } catch (err: any) {
            toast.error(`فشل إعادة التسمية: ${err.message}`);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;

        try {
            const { api } = await import('../services/api');
            await api.r2.createFolder(currentPrefix + newFolderName.trim() + '/');
            toast.success('تم إنشاء المجلد بنجاح');
            setIsCreatingFolder(false);
            setNewFolderName('');
            fetchFiles();
        } catch (err: any) {
            toast.error(`فشل إنشاء المجلد: ${err.message}`);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-[#0f172a] border border-white/10 rounded-[2rem] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                            <Video className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">متصفح ملفات R2</h3>
                            <p className="text-xs text-gray-400">تصفح المجلدات واختر المحتوى</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all shadow-inner"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Breadcrumbs / Navigation */}
                <div className="px-6 py-3 bg-white/[0.01] border-b border-white/5 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <button
                        onClick={() => fetchFiles('')}
                        className={`text-sm ${!currentPrefix ? 'text-violet-400 font-bold' : 'text-gray-400 hover:text-white'}`}
                    >
                        الرئيسية
                    </button>
                    {currentPrefix.split('/').filter(Boolean).map((part, i, arr) => (
                        <React.Fragment key={i}>
                            <ChevronLeft className="w-4 h-4 text-gray-600 rtl:rotate-0 rotate-180" />
                            <button
                                onClick={() => fetchFiles(arr.slice(0, i + 1).join('/') + '/')}
                                className={`text-sm ${(i === arr.length - 1) ? 'text-violet-400 font-bold' : 'text-gray-400 hover:text-white'}`}
                            >
                                {part}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                {/* Sub-Header: Search & Action Buttons */}
                <div className="p-4 bg-white/[0.01] border-b border-white/5 flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="ابحث في هذا المجلد..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pr-11 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                        />
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleUpload}
                            className="hidden"
                            multiple
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2.5 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30 hover:bg-violet-600/30 transition-all"
                            title="رفع ملفات"
                        >
                            <Upload className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => setIsCreatingFolder(true)}
                            className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30 transition-all"
                            title="مجلد جديد"
                        >
                            <FolderPlus className="w-5 h-5" />
                        </button>

                        {currentPrefix && (
                            <button
                                onClick={handleGoUp}
                                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                                title="المجلد السابق"
                            >
                                <ChevronRight className="w-5 h-5 rtl:rotate-0 rotate-180" />
                            </button>
                        )}
                        <button
                            onClick={() => fetchFiles()}
                            disabled={isLoading}
                            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                            title="تحديث"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>

                        {multiSelect && files.length > 0 && (
                            <button
                                onClick={handleSelectFolderItems}
                                className="px-4 py-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all text-sm font-bold flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>{selectedUrls.size === files.length ? 'إلغاء تحديد الكل' : 'تحديد كل المجلد'}</span>
                            </button>
                        )}

                        {multiSelect && selectedUrls.size > 0 && (
                            <button
                                onClick={() => {
                                    onSelectMultiple?.(Array.from(selectedUrls));
                                    onClose();
                                }}
                                className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-500 transition-all flex items-center gap-2 shadow-lg shadow-violet-600/20"
                            >
                                <span>إضافة {selectedUrls.size} محاضرة</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Uploads progress bar */}
                {Object.keys(uploadingProgress).length > 0 && (
                    <div className="px-6 py-2 bg-violet-500/10 border-b border-violet-500/20 flex flex-col gap-2">
                        {Object.entries(uploadingProgress).map(([fileName, progress]) => (
                            <div key={fileName} className="flex flex-col gap-1">
                                <div className="flex justify-between text-[10px] text-violet-300">
                                    <span className="truncate max-w-[200px]">{fileName.split('-').slice(1).join('-')}</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[400px]">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-gray-400">
                            <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
                            <p className="animate-pulse">جاري جلب الملفات...</p>
                        </div>
                    ) : error ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                                <X className="w-8 h-8 text-red-500" />
                            </div>
                            <h4 className="text-lg font-bold text-white">خطأ في الاتصال بالسيرفر</h4>
                            <p className="text-gray-400 max-w-md">{error}</p>
                            <button onClick={() => fetchFiles()} className="mt-4 px-6 py-2 rounded-xl bg-violet-600 text-white">تحديث</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {/* New Folder Creation UI */}
                            {isCreatingFolder && (
                                <div className="glass-panel p-4 rounded-2xl border border-amber-500/50 bg-amber-500/5 flex gap-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                        <Folder className="w-7 h-7 text-amber-500" />
                                    </div>
                                    <div className="flex-1 flex flex-col gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="اسم المجلد الجديد..."
                                            value={newFolderName}
                                            onChange={(e) => setNewFolderName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={handleCreateFolder} className="text-[10px] px-3 py-1 bg-amber-600 text-white rounded-md">إنشاء</button>
                                            <button onClick={() => setIsCreatingFolder(false)} className="text-[10px] px-3 py-1 bg-white/5 text-gray-400 rounded-md">إلغاء</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Folders */}
                            {folders.map((folder, idx) => (
                                <div
                                    key={`folder-${idx}`}
                                    className="group glass-panel p-4 rounded-2xl transition-all flex gap-4 border border-white/5 hover:border-violet-500/50 bg-white/[0.02] relative"
                                >
                                    <div
                                        onClick={() => handleFolderClick(folder.path)}
                                        className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition-colors cursor-pointer"
                                    >
                                        <Folder className="w-7 h-7 text-amber-500" />
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center cursor-pointer" onClick={() => handleFolderClick(folder.path)}>
                                        {editingItem?.key === folder.path ? (
                                            <input
                                                autoFocus
                                                className="bg-black/60 border border-violet-500 rounded px-2 py-1 text-sm text-white"
                                                value={newItemName}
                                                onChange={e => setNewItemName(e.target.value)}
                                                onBlur={handleRename}
                                                onKeyDown={e => e.key === 'Enter' && handleRename()}
                                                onClick={e => e.stopPropagation()}
                                            />
                                        ) : (
                                            <h4 className="font-bold text-white truncate text-sm" title={folder.name}>
                                                {folder.name.split('/').filter(Boolean).pop()}
                                            </h4>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const name = folder.name.split('/').filter(Boolean).pop() || '';
                                                setEditingItem({ key: folder.path, name, isFolder: true });
                                                setNewItemName(name);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-violet-400"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(folder.path, folder.name);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center text-gray-400 group-hover:text-white transition-colors ml-1">
                                        <ChevronLeft className="w-4 h-4 rtl:rotate-0 rotate-180" />
                                    </div>
                                </div>
                            ))}

                            {/* Files */}
                            {filteredFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className={`group glass-panel p-4 rounded-2xl transition-all flex gap-4 overflow-hidden relative border bg-white/[0.02] ${selectedUrls.has(file.url) ? 'border-violet-500 bg-violet-500/5' : 'border-white/5 hover:border-violet-500/50'}`}
                                >
                                    <div
                                        onClick={() => {
                                            if (multiSelect) {
                                                setSelectedUrls(prev => {
                                                    const next = new Set(prev);
                                                    if (next.has(file.url)) next.delete(file.url);
                                                    else next.add(file.url);
                                                    return new Set(next);
                                                });
                                            } else {
                                                onSelect(file.url);
                                                onClose();
                                            }
                                        }}
                                        className="w-14 h-14 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/20 transition-colors cursor-pointer"
                                    >
                                        {file.fullName.toLowerCase().endsWith('.mp3') || file.fullName.toLowerCase().endsWith('.wav') ? (
                                            <Music className="w-7 h-7 text-violet-400" />
                                        ) : (
                                            <FileVideo className="w-7 h-7 text-violet-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-1 flex flex-col justify-center cursor-pointer"
                                        onClick={() => {
                                            if (multiSelect) {
                                                setSelectedUrls(prev => {
                                                    const next = new Set(prev);
                                                    if (next.has(file.url)) next.delete(file.url);
                                                    else next.add(file.url);
                                                    return new Set(next);
                                                });
                                            } else {
                                                onSelect(file.url);
                                                onClose();
                                            }
                                        }}
                                    >
                                        {editingItem?.key === file.fullName ? (
                                            <input
                                                autoFocus
                                                className="bg-black/60 border border-violet-500 rounded px-2 py-1 text-sm text-white mb-1"
                                                value={newItemName}
                                                onChange={e => setNewItemName(e.target.value)}
                                                onBlur={handleRename}
                                                onKeyDown={e => e.key === 'Enter' && handleRename()}
                                                onClick={e => e.stopPropagation()}
                                            />
                                        ) : (
                                            <h4 className="font-bold text-white truncate text-sm mb-1" title={file.name}>
                                                {file.name}
                                            </h4>
                                        )}
                                        <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                            <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" />{formatSize(file.size)}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(file.lastModified)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingItem({ key: file.fullName, name: file.name, isFolder: false });
                                                setNewItemName(file.name);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-violet-400"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(file.fullName, file.name);
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className={`ml-2 transition-opacity ${selectedUrls.has(file.url) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <CheckCircle2 className={`w-5 h-5 ${selectedUrls.has(file.url) ? 'text-violet-500' : 'text-emerald-500'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 text-center bg-black/40">
                    <p className="text-[10px] text-gray-500">
                        {currentPrefix ? `المجلد الحالي: ${currentPrefix}` : 'تصفح الملفات المرفوعة على R2'}
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default R2FilePicker;
