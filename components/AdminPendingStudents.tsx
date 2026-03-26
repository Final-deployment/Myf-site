import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, UserX, RefreshCw, Clock, Mail, Phone, Globe, GraduationCap, Calendar, User, Search, CheckCircle2, XCircle, Loader2, Users, AlertTriangle } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { getAuthToken } from '../services/api/auth';
import { getApiUrl } from '../services/api/config';

interface PendingStudent {
  id: string;
  name: string;
  nameEn?: string;
  email: string;
  whatsapp: string;
  country: string;
  age: number;
  gender: string;
  educationLevel: string;
  joinDate: string;
  emailVerified: number;
  approved: number;
}

const AdminPendingStudents: React.FC = () => {
  const { language } = useLanguage();
  const [students, setStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<PendingStudent | null>(null);

  const fetchPendingStudents = useCallback(async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(getApiUrl('/pending-students'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (err) {
      console.error('Failed to fetch pending students:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingStudents();
  }, [fetchPendingStudents]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApprove = async (studentId: string) => {
    setActionLoading(studentId);
    try {
      const token = getAuthToken();
      const response = await fetch(getApiUrl(`/approve-student/${studentId}`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setStudents(prev => prev.filter(s => s.id !== studentId));
        setSelectedStudent(null);
        showNotification('success', language === 'ar' ? 'تمت الموافقة على الطالب بنجاح' : 'Student approved successfully');
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed');
      }
    } catch (err) {
      showNotification('error', language === 'ar' ? 'حدث خطأ' : 'Error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!showRejectModal) return;
    setActionLoading(showRejectModal);
    try {
      const token = getAuthToken();
      const response = await fetch(getApiUrl(`/reject-student/${showRejectModal}`), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (response.ok) {
        setStudents(prev => prev.filter(s => s.id !== showRejectModal));
        setShowRejectModal(null);
        setRejectReason('');
        setSelectedStudent(null);
        showNotification('success', language === 'ar' ? 'تم رفض الطالب' : 'Student rejected');
      } else {
        const data = await response.json();
        showNotification('error', data.error || 'Failed');
      }
    } catch (err) {
      showNotification('error', language === 'ar' ? 'حدث خطأ' : 'Error occurred');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveAll = async () => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من الموافقة على جميع الطلاب؟' : 'Are you sure you want to approve all students?')) return;
    
    for (const student of filteredStudents) {
      await handleApprove(student.id);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.includes(searchTerm) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.nameEn && s.nameEn.toLowerCase().includes(searchTerm.toLowerCase())) ||
    s.country.includes(searchTerm) ||
    s.whatsapp.includes(searchTerm)
  );

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateStr; }
  };

  const getGenderDisplay = (gender: string) => {
    if (gender === 'male') return language === 'ar' ? 'ذكر' : 'Male';
    if (gender === 'female') return language === 'ar' ? 'أنثى' : 'Female';
    return gender;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-600/90 backdrop-blur-lg text-white border border-emerald-400/30' 
            : 'bg-red-600/90 backdrop-blur-lg text-white border border-red-400/30'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            {language === 'ar' ? 'طلبات الانتساب الجديدة' : 'New Registration Requests'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {language === 'ar' 
              ? `${students.length} طلب بانتظار الموافقة`
              : `${students.length} pending requests`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchPendingStudents}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{language === 'ar' ? 'تحديث' : 'Refresh'}</span>
          </button>
          {filteredStudents.length > 0 && (
            <button 
              onClick={handleApproveAll}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white text-sm font-medium transition-colors shadow-lg shadow-emerald-900/30"
            >
              <UserCheck className="w-4 h-4" />
              <span>{language === 'ar' ? 'قبول الجميع' : 'Approve All'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={language === 'ar' ? 'ابحث بالاسم أو البريد أو الدولة...' : 'Search by name, email, or country...'}
          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pr-12 pl-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors backdrop-blur-lg"
        />
        <Search className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center border border-white/10">
          <div className="w-20 h-20 bg-emerald-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-emerald-400/50" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {language === 'ar' ? 'لا توجد طلبات جديدة' : 'No Pending Requests'}
          </h3>
          <p className="text-gray-400 text-sm">
            {language === 'ar' 
              ? 'جميع طلبات الانتساب تمت مراجعتها'
              : 'All registration requests have been reviewed'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredStudents.map((student) => (
            <div 
              key={student.id}
              className="glass-panel border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all duration-300 group"
            >
              {/* Student Info Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">{student.name}</h3>
                    {student.nameEn && student.nameEn !== student.name && (
                      <p className="text-gray-500 text-xs">{student.nameEn}</p>
                    )}
                  </div>
                </div>
                <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {language === 'ar' ? 'بانتظار المراجعة' : 'Pending'}
                </span>
              </div>

              {/* Student Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-gray-300 text-sm col-span-1 sm:col-span-2 bg-white/5 rounded-lg p-2.5">
                  <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-gray-500 text-xs ml-1">البريد:</span>
                  <span className="truncate font-medium" title={student.email}>{student.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-sm bg-white/5 rounded-lg p-2.5">
                  <Phone className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <span className="text-gray-500 text-xs ml-1">واتساب:</span>
                  <span dir="ltr" className="font-medium">{student.whatsapp || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-sm bg-white/5 rounded-lg p-2.5">
                  <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-gray-500 text-xs ml-1">الدولة:</span>
                  <span className="font-medium">{student.country || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-sm bg-white/5 rounded-lg p-2.5">
                  <User className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-gray-500 text-xs ml-1">الجنس:</span>
                  <span className="font-medium">{getGenderDisplay(student.gender)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-sm bg-white/5 rounded-lg p-2.5">
                  <Calendar className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-gray-500 text-xs ml-1">العمر:</span>
                  <span className="font-medium">{student.age ? `${student.age} سنة` : '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-sm bg-white/5 rounded-lg p-2.5">
                  <GraduationCap className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span className="text-gray-500 text-xs ml-1">التعليم:</span>
                  <span className="font-medium">{student.educationLevel || '-'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-sm col-span-1 sm:col-span-2 bg-white/5 rounded-lg p-2.5">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-500 text-xs ml-1">تاريخ التسجيل:</span>
                  <span className="font-medium">{formatDate(student.joinDate)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => handleApprove(student.id)}
                  disabled={actionLoading === student.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50 shadow-lg shadow-emerald-900/30"
                >
                  {actionLoading === student.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  <span>{language === 'ar' ? 'قبول' : 'Approve'}</span>
                </button>
                <button
                  onClick={() => { setShowRejectModal(student.id); setRejectReason(''); }}
                  disabled={actionLoading === student.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/20 rounded-xl text-red-300 text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  <UserX className="w-4 h-4" />
                  <span>{language === 'ar' ? 'رفض' : 'Reject'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowRejectModal(null)}
          />
          <div className="relative w-full max-w-md glass-panel border border-white/20 rounded-2xl p-6 animate-fade-in shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  {language === 'ar' ? 'رفض الطالب' : 'Reject Student'}
                </h3>
                <p className="text-gray-400 text-xs">
                  {language === 'ar' ? 'سيتم حذف حساب الطالب وإبلاغه عبر البريد' : 'Student account will be deleted and notified'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-gray-400">
                {language === 'ar' ? 'سبب الرفض (اختياري)' : 'Rejection reason (optional)'}
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={language === 'ar' ? 'اكتب سبب الرفض هنا...' : 'Enter rejection reason here...'}
                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors resize-none h-24"
              />
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleReject}
                disabled={actionLoading === showRejectModal}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50"
              >
                {actionLoading === showRejectModal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserX className="w-4 h-4" />
                )}
                <span>{language === 'ar' ? 'تأكيد الرفض' : 'Confirm Rejection'}</span>
              </button>
              <button
                onClick={() => setShowRejectModal(null)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl text-white text-sm font-medium transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPendingStudents;
