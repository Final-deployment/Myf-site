import React, { useState, useEffect, useRef } from 'react';
import { Mail, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface EmailVerificationProps {
    email: string;
    onSuccess: () => void;
    onBack: () => void;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ email, onSuccess, onBack }) => {
    const { language } = useLanguage();
    const { login } = useAuth();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const verifyingRef = useRef(false); // Guard against double calls
    const isPastingRef = useRef(false); // Guard against paste + auto-submit race

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0 && !canResend) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0) {
            setCanResend(true);
        }
    }, [countdown, canResend]);

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // Take only last digit
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits are entered — BUT NOT during paste
        // (handlePaste already calls handleVerify, so we skip here to avoid double call)
        if (!isPastingRef.current && newOtp.every(digit => digit) && newOtp.join('').length === 6) {
            handleVerify(newOtp.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            isPastingRef.current = true; // Block auto-submit in handleOtpChange
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            // Reset paste flag after React processes the state update
            setTimeout(() => { isPastingRef.current = false; }, 100);
            handleVerify(pastedData.join(''));
        }
    };

    const handleVerify = async (code: string) => {
        // Prevent double calls (paste + auto-submit race condition)
        if (verifyingRef.current) return;
        verifyingRef.current = true;

        if (!email) {
            localStorage.removeItem('pendingVerificationEmail');
            setError(language === 'ar' ? 'لم يتم العثور على البريد الإلكتروني. يرجى تسجيل الدخول مرة أخرى.' : 'Email not found. Please login again.');
            verifyingRef.current = false;
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const { success: verifySuccess, error: vError, pendingApproval } = await api.verifyOtp(email, code);

            if (vError) {
                const errorMsg = typeof vError === 'string' ? vError : vError.message;
                throw new Error(errorMsg || (language === 'ar' ? 'فشل التحقق' : 'Verification failed'));
            }

            if (!verifySuccess) {
                throw new Error(language === 'ar' ? 'رمز غير صحيح' : 'Invalid code');
            }

            localStorage.removeItem('pendingVerificationEmail');
            setSuccess(true);

            // If pending admin approval, do NOT proceed to dashboard
            if (pendingApproval) {
                // Clear any stored auth data to prevent auto-login
                localStorage.removeItem('authToken');
                localStorage.removeItem('mastaba_currentUser');
                sessionStorage.removeItem('authToken');
                sessionStorage.removeItem('mastaba_currentUser');
                // Stay on the success screen — user must wait for admin approval
                return;
            }

            // Only redirect to dashboard if user is fully approved
            setTimeout(() => {
                onSuccess();
            }, 1500);
        } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : 'Verification failed';
            setError(errMsg);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();

            // If the error indicates the OTP was already consumed or user not found,
            // clear the stale localStorage to break the redirect loop
            if (errMsg.includes('already verified') || errMsg.includes('مؤكد مسبقاً') || errMsg.includes('User not found') || errMsg.includes('لم يتم العثور')) {
                localStorage.removeItem('pendingVerificationEmail');
            }
        } finally {
            setIsLoading(false);
            verifyingRef.current = false;
        }
    };

    const handleResend = async () => {
        if (!canResend || isResending) return;

        setIsResending(true);
        setError('');

        try {
            const { error: rError } = await api.resendOtp(email);

            if (rError) {
                throw new Error(language === 'ar' ? rError.message || 'فشل إعادة الإرسال' : rError.message || 'Failed to resend code');
            }

            // Reset countdown
            setCountdown(60);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to resend code');
        } finally {
            setIsResending(false);
        }
    };

    if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-panel w-full max-w-md p-8 rounded-[2.5rem] text-center animate-fade-in border border-white/20 shadow-2xl">
          <div className="w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {language === 'ar' ? 'تم التسجيل بنجاح!' : 'Registration Successful!'}
          </h2>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            {language === 'ar'
              ? 'تم التحقق من بريدك الإلكتروني بنجاح. طلب انتسابك الآن بانتظار موافقة المسؤولين.'
              : 'Your email has been verified. Your registration is now pending admin approval.'}
          </p>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
            <p className="text-amber-300 text-sm">
              {language === 'ar'
                ? '⏳ سيتم إبلاغك عبر البريد الإلكتروني عند الموافقة على طلب انتسابك.'
                : '⏳ You will be notified via email once your registration is approved.'}
            </p>
          </div>
          <button
            onClick={onBack}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all"
          >
            {language === 'ar' ? 'العودة للصفحة الرئيسية' : 'Back to Home'}
          </button>
        </div>
      </div>
    );
  }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-md p-8 rounded-[2.5rem] relative overflow-hidden animate-fade-in border border-white/20 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {language === 'ar' ? 'تحقق من بريدك' : 'Verify Your Email'}
                    </h2>
                    <p className="text-gray-400 text-sm">
                        {language === 'ar'
                            ? `أرسلنا رمز تحقق مكون من 6 أرقام إلى`
                            : `We sent a 6-digit verification code to`}
                    </p>
                    <p className="text-emerald-400 font-medium mt-1">{email}</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4 text-red-300 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* OTP Input */}
                <div className="flex justify-center gap-2 mb-4" dir="ltr">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => (inputRefs.current[index] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            disabled={isLoading}
                            className="w-12 h-14 text-center text-2xl font-bold bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                        />
                    ))}
                </div>

                {/* Verify Button */}
                <button
                    onClick={() => handleVerify(otp.join(''))}
                    disabled={isLoading || otp.some(d => !d)}
                    className="w-full py-3 mb-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>{language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}</span>
                        </>
                    ) : (
                        <span>{language === 'ar' ? 'تحقق' : 'Verify'}</span>
                    )}
                </button>

                {/* Loading Indicator - only show when button not visible */}
                {isLoading && (
                    <div className="flex items-center justify-center gap-2 text-emerald-400 mb-4">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{language === 'ar' ? 'جاري التحقق...' : 'Verifying...'}</span>
                    </div>
                )}

                {/* Resend Section */}
                <div className="text-center">
                    <p className="text-gray-400 text-sm mb-2">
                        {language === 'ar' ? 'لم تستلم الرمز؟' : "Didn't receive the code?"}
                    </p>
                    {canResend ? (
                        <button
                            onClick={handleResend}
                            disabled={isResending}
                            className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center justify-center gap-2 mx-auto transition-colors disabled:opacity-50"
                        >
                            {isResending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                            <span>{language === 'ar' ? 'إعادة الإرسال' : 'Resend Code'}</span>
                        </button>
                    ) : (
                        <p className="text-gray-500 text-sm">
                            {language === 'ar'
                                ? `إعادة الإرسال خلال ${countdown} ثانية`
                                : `Resend in ${countdown} seconds`}
                        </p>
                    )}
                </div>

                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="w-full mt-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
                >
                    {language === 'ar' ? 'تغيير البريد الإلكتروني' : 'Change Email'}
                </button>
            </div>
        </div>
    );
};

export default EmailVerification;
