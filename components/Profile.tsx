/**
 * @fileoverview Profile component for user account management
 * @module components/Profile
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit, Camera, Award, BookOpen, Clock, Target, Save, X, LucideIcon } from 'lucide-react';
import { useAuth } from './AuthContext';
import { sanitizeHTML, sanitizeEmail } from '../utils/sanitize';

/**
 * Profile data interface
 */
interface ProfileData {
    email: string;
    phone: string;
    location: string;
    bio: string;
}



/**
 * Profile form field component
 */
const FormField = memo<{
    icon: LucideIcon;
    label: string;
    value: string;
    isEditing: boolean;
    onChange: (value: string) => void;
    type?: string;
    id: string;
    maxLength?: number;
}>(({ icon: Icon, label, value, isEditing, onChange, type = 'text', id, maxLength }) => {
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    }, [onChange]);

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="text-gray-400 text-sm flex items-center gap-2">
                <Icon className="w-4 h-4" aria-hidden="true" />
                {label}
            </label>
            {isEditing ? (
                <input
                    id={id}
                    type={type}
                    value={value}
                    maxLength={maxLength}
                    onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    aria-label={label}
                />
            ) : (
                <p className="text-white py-3">{value}</p>
            )}
        </div>
    );
});
FormField.displayName = 'FormField';

/**
 * Profile component - User account management and statistics
 * 
 * Features:
 * - Editable profile information
 * - User statistics display
 * - Achievement showcase
 * - ARIA accessibility
 * - Input sanitization
 * 
 * @returns Profile component
 */
const Profile: React.FC = memo(() => {
    const { user: authUser, updateUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);

    // Initial state derived from authUser
    const [profileData, setProfileData] = useState<ProfileData>({
        email: '',
        phone: '',
        location: '',
        bio: ''
    });

    // Sync state with user data
    useEffect(() => {
        if (authUser) {
            setProfileData({
                email: authUser.email || '',
                phone: authUser.phone || '',
                location: authUser.location || '',
                bio: authUser.bio || ''
            });
        }
    }, [authUser]);

    /** Handle save profile changes */
    const handleSave = useCallback(() => {
        if (authUser) {
            // Sanitize inputs before saving
            updateUser({
                email: sanitizeEmail(profileData.email),
                phone: sanitizeHTML(profileData.phone),
                location: sanitizeHTML(profileData.location),
                bio: sanitizeHTML(profileData.bio)
            });
        }
        setIsEditing(false);
        alert('تم حفظ التغييرات بنجاح!');
    }, [authUser, profileData, updateUser]);

    /** Handle field change */
    const handleChange = useCallback((field: keyof ProfileData, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    }, []);

    /** Toggle edit mode */
    const toggleEdit = useCallback(() => {
        setIsEditing(prev => !prev);
    }, []);

    /** Handle keyboard navigation for edit toggle */
    const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleEdit();
        }
    }, [toggleEdit]);

    // Merged user object for display
    const user = useMemo(() => ({
        name: authUser?.name || 'User',
        email: profileData.email,
        avatar: authUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        joinDate: authUser?.joinDate || '2024-01-15',
        phone: profileData.phone,
        location: profileData.location,
        bio: profileData.bio
    }), [authUser, profileData]);



    return (
        <div
            className="animate-fade-in space-y-6"
            role="main"
            aria-label="الملف الشخصي"
        >
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">الملف الشخصي</h2>
                    <p className="text-gray-300">إدارة معلوماتك الشخصية</p>
                </div>
                <button
                    onClick={toggleEdit}
                    onKeyDown={handleEditKeyDown}
                    className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${isEditing
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 focus:ring-red-400'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 focus:ring-emerald-400'
                        }`}
                    aria-label={isEditing ? 'إلغاء التعديل' : 'تعديل الملف الشخصي'}
                    aria-pressed={isEditing}
                >
                    {isEditing ? <X className="w-5 h-5" aria-hidden="true" /> : <Edit className="w-5 h-5" aria-hidden="true" />}
                    <span>{isEditing ? 'إلغاء' : 'تعديل'}</span>
                </button>
            </header>

            {/* Profile Card */}
            <section className="glass-panel p-8 rounded-2xl" aria-label="معلومات الملف الشخصي">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Avatar */}
                    <div className="flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500/30">
                                <img
                                    src={user.avatar}
                                    alt={`صورة ${user.name}`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                            {isEditing && (
                                <button
                                    className="absolute bottom-0 right-0 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                    aria-label="تغيير الصورة الشخصية"
                                >
                                    <Camera className="w-5 h-5" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-white mt-4">{user.name}</h3>
                        <p className="text-gray-400 text-sm">عضو منذ {user.joinDate}</p>
                    </div>

                    {/* Info Form */}
                    <form className="flex-1 space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                id="email"
                                icon={Mail}
                                label="البريد الإلكتروني"
                                value={user.email}
                                isEditing={isEditing}
                                onChange={(v) => handleChange('email', v)}
                                type="email"
                                maxLength={100}
                            />

                            <FormField
                                id="phone"
                                icon={Phone}
                                label="رقم الهاتف"
                                value={user.phone}
                                isEditing={isEditing}
                                onChange={(v) => handleChange('phone', v)}
                                type="tel"
                                maxLength={20}
                            />

                            <FormField
                                id="location"
                                icon={MapPin}
                                label="الموقع"
                                value={user.location}
                                isEditing={isEditing}
                                onChange={(v) => handleChange('location', v)}
                                maxLength={50}
                            />

                            <div className="space-y-2">
                                <label className="text-gray-400 text-sm flex items-center gap-2">
                                    <Calendar className="w-4 h-4" aria-hidden="true" />
                                    تاريخ الانضمام
                                </label>
                                <p className="text-white py-3">{user.joinDate}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="bio" className="text-gray-400 text-sm">نبذة شخصية</label>
                            {isEditing ? (
                                <textarea
                                    id="bio"
                                    value={user.bio}
                                    maxLength={500}
                                    onChange={(e) => handleChange('bio', e.target.value)}
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none"
                                    aria-label="نبذة شخصية"
                                />
                            ) : (
                                <p className="text-white">{user.bio}</p>
                            )}
                        </div>

                        {isEditing && (
                            <button
                                onClick={handleSave}
                                type="button"
                                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                                aria-label="حفظ التغييرات"
                            >
                                <Save className="w-5 h-5" aria-hidden="true" />
                                <span>حفظ التغييرات</span>
                            </button>
                        )}
                    </form>
                </div>
            </section>


        </div>
    );
});

Profile.displayName = 'Profile';

export default Profile;
