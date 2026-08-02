import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Paperclip, Image as ImageIcon, Check, CheckCheck, Loader2, XCircle, Mic, StopCircle, Trash2, Users } from 'lucide-react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface GroupMessage {
    id: string;
    sender_id: string;
    section_id: string;
    content: string;
    created_at: string;
    attachment_url?: string;
    attachment_type?: string;
    attachment_name?: string;
    senderName?: string;
    senderAvatar?: string;
    senderRole?: string;
}

export default function AskSupervisorBubble() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Only show if user has a section_id, and is a student
    const hasSection = Boolean(user?.section_id);
    const isStudent = user?.role === 'student';

    const loadMessages = useCallback(async () => {
        if (!user || !user.section_id || !isOpen) return;
        try {
            const data = await api.getGroupMessages(user.section_id, 1, 100);
            setMessages(data.messages || []);
        } catch (error) {
            console.error('Failed to load group messages', error);
        }
    }, [user, isOpen]);

    // Poll for messages when open
    useEffect(() => {
        if (isOpen) {
            loadMessages();
            const interval = setInterval(loadMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [isOpen, loadMessages]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleFileSelect = (file: File) => {
        if (file.size > 20 * 1024 * 1024) {
            alert('حجم الملف كبير جداً. الحد الأقصى هو 20 ميغابايت.');
            return;
        }
        setSelectedFile(file);
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const uploadFile = async (file: File) => {
        setIsUploading(true);
        setUploadProgress(0);
        try {
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const latestToken = (user as any)?.access_token || localStorage.getItem('token');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (user && latestToken) headers['Authorization'] = `Bearer ${latestToken}`;

            const response = await fetch('/api/social/upload-proxy', {
                method: 'POST',
                headers,
                body: JSON.stringify({ base64Data: base64Data, fileName: file.name, fileType: file.type })
            });
            if (!response.ok) throw new Error('فشل رفع الملف');
            const data = await response.json();
            return { url: data.publicUrl || data.url, type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : 'application/pdf', name: file.name };
        } catch (error) {
            console.error('Upload Error:', error);
            alert('حدث خطأ أثناء رفع الملف.');
            throw error;
        } finally {
            setIsUploading(false);
            setUploadProgress(100);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !user?.section_id) return;

        let attachmentUrl = undefined;
        let attachmentType = undefined;
        let attachmentName = undefined;

        if (selectedFile) {
            try {
                const uploaded = await uploadFile(selectedFile);
                attachmentUrl = uploaded.url;
                attachmentType = uploaded.type;
                attachmentName = uploaded.name;
                removeSelectedFile();
            } catch (error) {
                return;
            }
        }

        try {
            await api.sendGroupMessage(user.section_id, newMessage, attachmentUrl, attachmentType, attachmentName);
            setNewMessage('');
            loadMessages();
        } catch (error) {
            console.error('Failed to send message', error);
            alert('فشل إرسال الرسالة');
        }
    };

    if (!isStudent || !hasSection) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-24 right-6 md:bottom-6 md:right-72 p-4 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all z-50 animate-bounce hover:animate-none flex items-center justify-center"
                title="مجموعة الشعبة - اسأل المشرف"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Users className="w-6 h-6" />}
            </button>

            {isOpen && (
                <div className="fixed bottom-40 right-6 md:bottom-24 md:right-72 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 border border-slate-200 dark:border-slate-700 h-[32rem]">
                    <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
                        <div>
                            <h3 className="font-bold flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                مجموعة الشعبة
                            </h3>
                            <p className="text-emerald-100 text-sm">تواصل مع المشرف والزملاء</p>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white hover:bg-emerald-700 p-1 rounded-full">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900 custom-scrollbar">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Users className="w-12 h-12 mb-2 opacity-50" />
                                <p>لا توجد رسائل حالياً</p>
                                <p className="text-xs mt-1">ابدأ النقاش مع شعبتك!</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isMine = msg.sender_id === user.id;
                                const isSupervisor = msg.senderRole === 'supervisor';
                                
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                        <div className={`flex items-end gap-2 max-w-[85%] ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className="flex-shrink-0">
                                                <img 
                                                    src={msg.senderAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + msg.senderName} 
                                                    alt={msg.senderName}
                                                    className="w-8 h-8 rounded-full border border-slate-200"
                                                />
                                            </div>
                                            <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                                <span className="text-xs text-slate-500 mb-1 mx-1">
                                                    {isMine ? 'أنت' : msg.senderName} {isSupervisor && <span className="text-emerald-600 font-bold ml-1">(مشرف)</span>}
                                                </span>
                                                <div className={`p-3 rounded-2xl ${
                                                    isMine ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-sm'
                                                }`}>
                                                    {msg.content && <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>}

                                                    {msg.attachment_url && (
                                                        <div className="mt-2">
                                                            {msg.attachment_type === 'image' && (
                                                                <img src={msg.attachment_url} alt="Attachment" className="max-w-full rounded-lg cursor-pointer max-h-48 object-cover" onClick={() => window.open(msg.attachment_url, '_blank')} />
                                                            )}
                                                            {msg.attachment_type === 'audio' && (
                                                                <audio controls src={msg.attachment_url} className="max-w-[200px]" />
                                                            )}
                                                            {msg.attachment_type === 'video' && (
                                                                <video controls src={msg.attachment_url} className="max-w-full rounded-lg max-h-48" />
                                                            )}
                                                            {msg.attachment_type === 'application/pdf' && (
                                                                <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-emerald-600 hover:underline">
                                                                    <Paperclip className="w-4 h-4" /> {msg.attachment_name || 'ملف PDF'}
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                                                    <span>{new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {selectedFile && (
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden">
                                {filePreview ? (
                                    <img src={filePreview} alt="Preview" className="w-10 h-10 object-cover rounded" />
                                ) : (
                                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center">
                                        <Paperclip className="w-5 h-5 text-slate-500" />
                                    </div>
                                )}
                                <div className="truncate">
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate w-32">{selectedFile.name}</p>
                                    <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button onClick={removeSelectedFile} disabled={isUploading} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                        <form onSubmit={handleSend} className="flex gap-2 items-end">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileSelect(file);
                                }}
                                className="hidden"
                                accept="image/*,audio/*,video/*,application/pdf"
                            />
                            
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full transition-colors flex-shrink-0"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>

                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="اكتب رسالة للشعبة..."
                                className="flex-1 bg-slate-100 dark:bg-slate-900 border-0 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 dark:text-white resize-none h-11 min-h-[44px] max-h-32 custom-scrollbar"
                                disabled={isUploading}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(e);
                                    }
                                }}
                            />

                            <button
                                type="submit"
                                disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                                className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                            >
                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 rtl:-scale-x-100" />}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
