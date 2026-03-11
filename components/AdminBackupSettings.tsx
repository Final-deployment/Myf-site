import React, { useRef, useState, useEffect } from 'react';
import { Database, HardDrive, Cloud, Download, Upload, RefreshCw, Clock, CheckCircle, AlertTriangle, Settings, Save } from 'lucide-react';
import { api } from '../services/api';

const AdminBackupSettings: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [backups, setBackups] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState({
        autoBackup: false,
        cloudStorage: false,
        retention: '30'
    });

    const fetchBackups = async (cloudEnabled: boolean) => {
        if (!cloudEnabled) {
            setBackups([]);
            return;
        }
        setIsLoading(true);
        try {
            const data = await api.r2.listFiles('backups/');
            const mappedBackups = (data.files || []).map(f => ({
                id: f.id || f.fullName,
                name: f.name || f.fullName.split('/').pop(),
                date: new Date(f.lastModified || Date.now()).toLocaleString('en-CA'),
                size: ((f.size || 0) / 1024 / 1024).toFixed(2) + ' MB',
                status: 'success',
                type: 'cloud',
                url: f.url
            })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setBackups(mappedBackups);
        } catch (e) {
            console.error('Failed to fetch R2 backups', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await api.getBackupSettings();
                const cloudEnabled = data.cloud_backup_enabled;
                setSettings({
                    autoBackup: data.auto_backup_enabled,
                    cloudStorage: cloudEnabled,
                    retention: data.backup_retention_days || '30'
                });
                fetchBackups(cloudEnabled);
            } catch (e) {
                console.error('Failed to load backup settings', e);
            }
        };
        loadSettings();
    }, []);

    const toggleSetting = async (key: keyof typeof settings) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings);

        try {
            await api.updateBackupSettings({
                auto_backup_enabled: newSettings.autoBackup,
                cloud_backup_enabled: newSettings.cloudStorage,
                backup_retention_days: newSettings.retention
            });
            if (key === 'cloudStorage') {
                fetchBackups(newSettings.cloudStorage);
            }
        } catch (e) {
            console.error('Failed to save setting', e);
            // Revert on failure
            setSettings(settings);
        }
    };

    const handleCreateBackup = async () => {
        try {
            await api.downloadBackup();

            // Add visual feedback
            const newBackup = {
                id: Date.now(),
                name: 'نسخة محلية (Database)',
                date: new Date().toLocaleString('en-CA'),
                size: 'Unknown',
                status: 'success',
                type: 'manual'
            };
            setBackups([newBackup, ...backups]);
            alert('تم تحميل النسخة الاحتياطية بنجاح');
        } catch (e) {
            alert('فشل إنشاء النسخة الاحتياطية');
            console.error(e);
        }
    };

    const handleCloudBackup = async () => {
        try {
            const res = await api.uploadCloudBackup();
            alert(`تم الرفع للسحابة بنجاح! الملف: ${res.key}`);
            const newBackup = {
                id: Date.now(),
                name: 'نسخة سحابية (S3)',
                date: new Date().toLocaleString('en-CA'),
                size: (res.size / 1024 / 1024).toFixed(2) + ' MB',
                status: 'success',
                type: 'auto',
                url: res.url
            };
            setBackups([newBackup, ...backups]);
            fetchBackups(settings.cloudStorage);
        } catch (e) {
            alert('فشل الرفع للسحابة. تأكد من إعدادات S3/R2.');
            console.error(e);
        }
    };

    const handleRestoreClick = () => {
        if (confirm('تحذير: استعادة النسخة الاحتياطية ستقوم باستبدال جميع البيانات الحالية. هل أنت متأكد؟')) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (confirm('هل أنت متأكد من استعادة هذه النسخة؟ سيتم فقدان التغييرات غير المحفوظة.')) {
            try {
                await api.restoreBackup(file);
                alert('تم استعادة النسخة الاحتياطية بنجاح! سيتم إعادة تحميل الصفحة.');
                window.location.reload();
            } catch (error) {
                alert('فشل استعادة النسخة الاحتياطية');
                console.error(error);
            }
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const stats = [
        { label: 'آخر نسخة', value: backups[0]?.date?.split(' ')[0] || 'لا يوجد', icon: Clock, color: 'from-emerald-500 to-teal-600' },
        { label: 'حجم التخزين', value: backups.length > 0 ? backups.reduce((acc, b) => acc + parseFloat(b.size), 0).toFixed(1) + ' MB' : '0 MB', icon: HardDrive, color: 'from-blue-500 to-cyan-600' },
        { label: 'النسخ المحفوظة', value: backups.length.toString(), icon: Database, color: 'from-violet-500 to-purple-600' },
        { label: 'التخزين السحابي', value: settings.cloudStorage ? 'سحابي (R2)' : 'محلي فقط', icon: Cloud, color: settings.cloudStorage ? 'from-blue-400 to-indigo-500' : 'from-amber-500 to-orange-600' },
    ];

    const handleDownloadIndividual = (backup: any) => {
        if (backup.url) {
            window.open(backup.url, '_blank');
        } else {
            handleCreateBackup();
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">النسخ الاحتياطي</h2>
                    <p className="text-gray-300">إدارة النسخ الاحتياطية والاستعادة</p>
                </div>
                <div className="flex gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".sqlite"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={handleRestoreClick}
                        className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 flex items-center gap-2"
                    >
                        <Upload className="w-5 h-5" /><span>استعادة</span>
                    </button>
                    <button
                        onClick={handleCreateBackup}
                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:opacity-90 flex items-center gap-2"
                    >
                        <Save className="w-5 h-5" /><span>تحميل محلي</span>
                    </button>
                    <button
                        onClick={handleCloudBackup}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:opacity-90 flex items-center gap-2"
                    >
                        <Cloud className="w-5 h-5" /><span>رفع سحابي</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <div key={idx} className="glass-panel p-5 rounded-2xl">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-white">{stat.value}</p>
                                <p className="text-gray-400 text-sm">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5" /> إعدادات النسخ التلقائي
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                            <div>
                                <p className="text-white font-medium">النسخ التلقائي</p>
                                <p className="text-gray-400 text-sm">نسخ احتياطي يومي الساعة 3 صباحاً</p>
                            </div>
                            <div
                                onClick={() => toggleSetting('autoBackup')}
                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.autoBackup ? 'bg-emerald-500' : 'bg-gray-600'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.autoBackup ? 'left-7' : 'left-1'}`} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                            <div>
                                <p className="text-white font-medium">التخزين السحابي</p>
                                <p className="text-gray-400 text-sm">رفع تلقائي إلى السحابة</p>
                            </div>
                            <div
                                onClick={() => toggleSetting('cloudStorage')}
                                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.cloudStorage ? 'bg-emerald-500' : 'bg-gray-600'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.cloudStorage ? 'left-7' : 'left-1'}`} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                            <div>
                                <p className="text-white font-medium">الاحتفاظ بالنسخ</p>
                                <p className="text-gray-400 text-sm">حذف النسخ الأقدم من الكود المختار</p>
                            </div>
                            <select
                                value={settings.retention}
                                onChange={async (e) => {
                                    const val = e.target.value;
                                    setSettings(prev => ({ ...prev, retention: val }));
                                    try {
                                        await api.updateBackupSettings({
                                            auto_backup_enabled: settings.autoBackup,
                                            cloud_backup_enabled: settings.cloudStorage,
                                            backup_retention_days: val
                                        });
                                    } catch (err) {
                                        console.error('Failed to save retention', err);
                                    }
                                }}
                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                            >
                                <option value="30">30 يوم</option>
                                <option value="60">60 يوم</option>
                                <option value="90">90 يوم</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Database className="w-5 h-5" /> النسخ الأخيرة
                    </h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                                <RefreshCw className="w-6 h-6 animate-spin" />
                                <p className="text-sm">جاري جلب النسخ من السحابة...</p>
                            </div>
                        ) : backups.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                <p>لا توجد نسخ احتياطية حالياً</p>
                                {!settings.cloudStorage && <p className="text-xs mt-1">قم بتفعيل التخزين السحابي لرؤية النسخ السحابية</p>}
                            </div>
                        ) : (
                            backups.map((backup) => (
                                <div key={backup.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${backup.status === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                        {backup.status === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-medium text-sm truncate" title={backup.name}>{backup.name}</p>
                                        <p className="text-gray-400 text-[10px]">{backup.date} • {backup.size}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleDownloadIndividual(backup)}
                                            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white"
                                            title="تحميل النسخة"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBackupSettings;
