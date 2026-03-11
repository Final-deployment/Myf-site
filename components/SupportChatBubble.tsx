import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Paperclip, Image as ImageIcon, Check, CheckCheck, Loader2, XCircle, Mic, StopCircle, Trash2 } from 'lucide-react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface DefaultMessage {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    read: number | boolean;
    timestamp: string;
    attachmentUrl?: string; // e.g. "https://pub-...r2.dev/uploads/123-img.png"
    attachmentType?: string; // 'image', 'audio', 'video', 'application/pdf', etc.
    attachmentName?: string;
    isComplaint?: number | boolean;
}

export default function SupportChatBubble() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<DefaultMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [guestName, setGuestName] = useState(''); // Added for guest usage
    const [unreadCount, setUnreadCount] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const ADMIN_MAIN_ID = 'admin_manager'; // manager@mastaba.com — exclusive support account
    const [guestId, setGuestId] = useState<string | null>(null);

    // Initialize guestId from localStorage if present
    useEffect(() => {
        if (!user) {
            const savedGuestId = localStorage.getItem('support_guest_id');
            const savedGuestName = localStorage.getItem('support_guest_name');
            if (savedGuestId) {
                setGuestId(savedGuestId);
            }
            if (savedGuestName) {
                setGuestName(savedGuestName);
            }
        }
    }, [user]);

    const loadMessages = useCallback(async () => {
        if (!user || !isOpen) return;
        try {
            const msgs = await api.getMessages();
            // Filter only support messages (isComplaint = 1) involving the current user
            // If the user IS the manager, they see all complaints.
            // If the user is a student/supervisor, they see their own complaints.
            // For students, fetch all messages with the admin (both sent and received)
            // Also include any explicitly flagged as complaints
            // Filter: show messages involving between the current user and the ADMIN_MAIN_ID
            // and explicitly flagged as complaints involving the user.
            const supportMsgs = msgs.filter((m: DefaultMessage) =>
                (m.senderId === user.id && m.receiverId === ADMIN_MAIN_ID) ||
                (m.senderId === ADMIN_MAIN_ID && m.receiverId === user.id) ||
                ((m.isComplaint === 1 || m.isComplaint === true) && (m.senderId === user.id || m.receiverId === user.id))
            );

            // Don't show chat bubble messages to the manager themselves (they use dashboard)
            if (user?.id !== ADMIN_MAIN_ID) {
                setMessages(supportMsgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
                // Mark as read
                const hasUnread = supportMsgs.some((m: DefaultMessage) => m.receiverId === user.id && !m.read);
                if (hasUnread) {
                    // Notice: marking conversation read as ADMIN_MAIN_ID
                    const firstUnread = supportMsgs.find((m: DefaultMessage) => m.receiverId === user.id && !m.read);
                    if (firstUnread) {
                        await api.markConversationAsRead(firstUnread.senderId);
                        setUnreadCount(0);
                    }
                }
            } else {
                // If the user IS the admin, the bubble could just be a shortcut to the admin support page
                // But we'll leave it closed or render a "Go to Support Dashboard" button.
            }
        } catch (error) {
            console.error('Failed to load support messages', error);
        }
    }, [user, isOpen]);

    // Load guest messages specifically
    const loadGuestMessages = useCallback(async () => {
        if (!guestId || user || !isOpen) return;
        try {
            const msgs = await api.getPublicMessages(guestId);
            setMessages(msgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
        } catch (error) {
            console.error('Failed to load guest messages', error);
        }
    }, [guestId, user, isOpen]);

    // Poll for unread count & auto refresh messages
    useEffect(() => {
        const fetchUnreadAndMessages = async () => {
            if (user) {
                try {
                    if (isOpen) {
                        await loadMessages();
                    } else {
                        const msgs = await api.getMessages();
                        const supportUnread = msgs.filter((m: DefaultMessage) =>
                            (m.isComplaint === 1 || m.isComplaint === true || (user?.role !== 'admin' && m.senderId === ADMIN_MAIN_ID)) &&
                            m.receiverId === user.id && !m.read
                        );
                        setUnreadCount(supportUnread.length);
                    }
                } catch (e) { }
            } else if (guestId && isOpen) {
                await loadGuestMessages();
            }
        };

        fetchUnreadAndMessages();
        const interval = setInterval(fetchUnreadAndMessages, 10000); // 10s polling
        return () => clearInterval(interval);
    }, [user, isOpen, loadMessages, guestId, loadGuestMessages]);




    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Handle past events (images)
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            if (!isOpen) return;
            const items = e.clipboardData?.items;
            if (items) {
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        if (file) handleFileSelect(file);
                        break;
                    }
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [isOpen]);

    const handleFileSelect = (file: File) => {
        // 20MB limit
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
        setAudioPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const file = new File([blob], "voice-note.webm", { type: 'audio/webm' });

                setSelectedFile(file);
                const url = URL.createObjectURL(blob);
                setAudioPreviewUrl(url);

                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);

            timerIntervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (e) {
            console.error(e);
            alert('لا يمكن الوصول للميكروفون');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
    };

    const cancelRecording = () => {
        stopRecording();
        setSelectedFile(null);
        setAudioPreviewUrl(null);
        setRecordingDuration(0);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

            // Simulate progress for UI since fetch doesn't have native upload progress easily
            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => (prev >= 90 ? 90 : prev + 10));
            }, 300);

            const latestToken = (user as any)?.access_token || localStorage.getItem('token');

            const res = await fetch('/api/social/upload-proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${latestToken}`
                },
                body: JSON.stringify({
                    fileName: file.name,
                    fileType: file.type,
                    base64Data: base64Data
                })
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'فشل رفع الملف عبر الخادم');
            }

            const { publicUrl } = await res.json();
            return publicUrl;
        } catch (e: any) {
            console.error('Fetch upload error', e);
            throw new Error(e.message || 'Network error during upload');
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() && !selectedFile) return;

        // If guest, ensure guestName is provided
        if (!user && !guestName.trim()) {
            alert('يرجى إدخال اسمك أولاً لنتمكن من التواصل معك');
            return;
        }

        try {
            // Shared attachment logic for both users and guests
            let attachmentUrl = null;
            let attachmentType = null;
            let attachmentName = null;

            if (selectedFile) {
                try {
                    attachmentUrl = await uploadFile(selectedFile);
                    attachmentType = selectedFile.type;
                    attachmentName = selectedFile.name;
                } catch (e: any) {
                    alert('فشل رفع الملف: ' + e.message);
                    setIsUploading(false);
                    return;
                }
            }

            // Guest mode logic
            if (!user) {
                setIsUploading(true);
                const actualName = guestName.trim() || 'زائر';
                const res = await api.sendPublicMessage(newMessage.trim(), actualName, guestId, attachmentUrl, attachmentType, attachmentName);

                // Save the guest ID and name to local storage so they can see responses
                if (res.guestId && !guestId) {
                    setGuestId(res.guestId);
                    localStorage.setItem('support_guest_id', res.guestId);
                    localStorage.setItem('support_guest_name', actualName);
                }

                // Instead of pushing a pseudo message, trigger a load so we see actual state
                if (res.guestId) {
                    setTimeout(() => {
                        loadGuestMessages();
                    }, 500);
                } else {
                    // Fallback optimistic update
                    const pseudoMsg: DefaultMessage = {
                        id: res.messageId || 'msg_' + Date.now(),
                        senderId: guestId || res.guestId || 'guest',
                        receiverId: ADMIN_MAIN_ID,
                        content: newMessage.trim(),
                        read: false,
                        timestamp: new Date().toISOString(),
                        isComplaint: 1,
                        attachmentUrl,
                        attachmentType,
                        attachmentName
                    };
                    setMessages(prev => [...prev, pseudoMsg]);
                }

                setNewMessage('');
                removeSelectedFile();
                setIsUploading(false);

                setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);

                return; // End guest flow
            }


            // Regular authenticated user flow


            // We send it to ADMIN_MAIN_ID - backend fallback logic will route it to the main admin
            const msgData = {
                receiverId: ADMIN_MAIN_ID,
                content: newMessage.trim(),
                isComplaint: 1, // Flags it as technical support
                attachmentUrl,
                attachmentType,
                attachmentName
            };

            const savedMsg = await api.sendMessage(
                msgData.receiverId,
                msgData.content,
                msgData.attachmentUrl,
                msgData.attachmentType,
                msgData.attachmentName,
                true // isComplaint
            );

            setMessages(prev => [...prev, savedMsg as any]);
            setNewMessage('');
            removeSelectedFile();
            setIsUploading(false);

            // Scroll down
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

        } catch (error: any) {
            console.error('Failed to send support message', error);
            alert(error.message || 'فشل إرسال الرسالة');
            setIsUploading(false);
        }
    };


    const renderAttachment = (msg: DefaultMessage) => {
        if (!msg.attachmentUrl) return null;

        const typeStr = (msg.attachmentType || '').toLowerCase();
        const urlStr = (msg.attachmentUrl || '').toLowerCase();

        const isImage = typeStr.startsWith('image/') || typeStr === 'image' || !!urlStr.match(/\.(jpeg|jpg|gif|png|webp|bmp)(\?.*)?$/i);
        const isVideo = typeStr.startsWith('video/') || typeStr === 'video' || !!urlStr.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i);
        const isAudio = typeStr.startsWith('audio/') || typeStr === 'audio' || !!urlStr.match(/\.(mp3|wav|ogg|m4a|weba)(\?.*)?$/i);

        if (isImage) {
            return (
                <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
                    <img src={msg.attachmentUrl} alt="Attachment" className="max-w-[200px] max-h-[200px] rounded-lg border border-white/10 hover:opacity-90 transition-opacity object-cover" />
                </a>
            );
        }
        if (isVideo) {
            return (
                <video src={msg.attachmentUrl} controls className="max-w-[200px] max-h-[200px] mt-2 rounded-lg border border-white/10" />
            );
        }
        if (isAudio) {
            return (
                <div className="mt-2 bg-white/5 rounded-xl border border-white/10 p-2 max-w-[260px]">
                    <audio src={msg.attachmentUrl} controls className="w-[240px] h-12" />
                </div>
            );
        }

        // Generic File
        return (
            <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 p-2 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
                <Paperclip className="w-4 h-4 text-emerald-400" />
                <span className="text-sm truncate max-w-[150px]">{msg.attachmentName || 'ملف مرفق'}</span>
            </a>
        );
    };

    // The designated support manager uses the Messaging Dashboard, so hide the bubble for them
    if (user?.id === ADMIN_MAIN_ID) {
        return null;
    }

    return (
        <div className="fixed bottom-20 left-6 z-50 flex flex-col items-start font-cairo" dir="rtl">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl mb-4 w-[350px] sm:w-[400px] h-[500px] flex flex-col overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-5">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">الدعم الفني المباشر</h3>
                                <p className="text-emerald-100 text-xs opacity-90">نحن هنا لمساعدتك في حل أي مشكلة</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-emerald-500/20">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm p-6 text-center">
                                <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                                <p>كيف يمكننا مساعدتك اليوم؟<br />أرسل رسالة نصية أو أرفق صورة توضح المشكلة.</p>
                                <p className="text-xs mt-2 text-emerald-400/70">سيتم الاحتفاظ بالملفات المرفقة لمدة 14 يوماً فقط.</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => {
                                const isMe = user ? (msg.senderId === user.id) : (msg.senderId === guestId || msg.senderId.startsWith('guest_'));
                                return (
                                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl p-3 ${isMe
                                            ? 'bg-emerald-600 text-white rounded-br-sm'
                                            : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-sm'
                                            }`}>
                                            {msg.content && <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>}
                                            {renderAttachment(msg)}

                                            <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMe ? 'text-emerald-200' : 'text-slate-500'}`}>
                                                <span>{new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                                                {isMe && (
                                                    msg.read ? <CheckCheck className="w-3 h-3 text-blue-300" /> : <Check className="w-3 h-3" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* File Attachment Preview */}
                    {selectedFile && !isRecording && (
                        <div className="px-4 py-3 border-t border-slate-800 bg-slate-800/50 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    {audioPreviewUrl ? (
                                        <Mic className="w-5 h-5 text-violet-400 shrink-0" />
                                    ) : filePreview ? (
                                        <img src={filePreview} alt="Preview" className="w-8 h-8 rounded object-cover" />
                                    ) : (
                                        <Paperclip className="w-5 h-5 text-emerald-400 shrink-0" />
                                    )}
                                    <span className="text-xs text-slate-300 truncate max-w-[150px]" dir="ltr">{selectedFile.name}</span>
                                    <span className="text-[10px] text-slate-500">({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)</span>
                                </div>
                                <button onClick={removeSelectedFile} title="إلغاء المرفق" className="text-red-400 hover:text-red-300 p-1">
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                            {audioPreviewUrl && (
                                <audio controls src={audioPreviewUrl} className="w-full h-12 mt-1" />
                            )}
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-3 bg-slate-900 border-t border-slate-800 flex flex-col gap-2">

                        {/* Guest Name Input */}
                        {!user && !guestId && messages.length === 0 && (
                            <input
                                type="text"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                placeholder="الاسم الكريم (مطلوب)"
                                className="w-full bg-slate-800 border-none rounded-xl py-2 px-4 text-sm text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-emerald-500"
                                required
                            />
                        )}

                        {isRecording ? (
                            <div className="flex items-center gap-4 bg-red-500/10 p-2 rounded-xl border border-red-500/20 animate-pulse">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-ping mx-2"></div>
                                <span className="text-red-400 font-mono font-bold">{formatDuration(recordingDuration)}</span>
                                <span className="text-sm text-gray-400">جاري التسجيل...</span>
                                <div className="flex-1"></div>
                                <button onClick={cancelRecording} className="p-2 text-gray-400 hover:text-white transition-colors" title="إلغاء">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button onClick={stopRecording} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 mx-1" title="إيقاف">
                                    <StopCircle className="w-6 h-6 fill-current" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-end gap-2 relative">
                                <>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                handleFileSelect(e.target.files[0]);
                                            }
                                        }}
                                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                                    />
                                    <div className="flex gap-1 shrink-0">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading || !!selectedFile}
                                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-xl transition-colors shrink-0 disabled:opacity-50"
                                            title="إرفاق ملف أو صورة"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={startRecording}
                                            disabled={isUploading || !!selectedFile}
                                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors shrink-0 disabled:opacity-50"
                                            title="تسجيل رسالة صوتية"
                                        >
                                            <Mic className="w-5 h-5" />
                                        </button>
                                    </div>
                                </>

                                <div className="flex-1 relative">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="اكتب رسالتك للدعم الفني..."
                                        className="w-full bg-slate-800 border-none rounded-xl py-3 px-4 text-sm text-slate-200 placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 resize-none h-[44px] max-h-[120px] scrollbar-hide"
                                        rows={1}
                                        disabled={isUploading}
                                    />
                                </div>

                                <button
                                    onClick={handleSendMessage}
                                    disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                                    className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center justify-center relative shadow-lg shadow-emerald-900/20"
                                >
                                    {isUploading ? (
                                        <div className="relative flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {uploadProgress > 0 && <span className="absolute text-[8px] font-bold mt-1 text-emerald-100">{uploadProgress}%</span>}
                                        </div>
                                    ) : (
                                        <Send className="w-5 h-5 rtl:-scale-x-100" />
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Bubble Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-amber-600 to-orange-500 rounded-full shadow-lg shadow-amber-900/30 hover:shadow-amber-900/50 hover:scale-105 transition-all duration-300"
                >
                    <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300" />

                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-pulse shadow-sm">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}

                    <div className="absolute left-full ml-4 whitespace-nowrap bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 border border-slate-700 shadow-xl">
                        الدعم الفني المباشر
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
                    </div>
                </button>
            )}
        </div>
    );
}


