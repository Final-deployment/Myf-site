/**
 * Main Application Component
 * 
 * This is the root component that handles:
 * - Provider hierarchy (Language, Theme, Auth)
 * - View state management (landing, auth, app)
 * - Code splitting with React.lazy
 * - Error boundary for graceful error handling
 * 
 * @module App
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './components/LanguageContext';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { AuthProvider, useAuth } from './components/AuthContext';
import { ToastProvider, useToast } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { SkeletonDashboard } from './components/Skeleton';
import InstallPrompt from './components/InstallPrompt';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CoursesGrid from './components/CoursesGrid';
import { ProtectedRoute, AdminRoute, PublicRoute, SupervisorRoute } from './components/RouteGuards';
import { Course } from './types';
import SupportChatBubble from './components/SupportChatBubble';

// ============================================================================
// Lazy-loaded Components (Code Splitting)
// ============================================================================

// ============================================================================
// Lazy-loaded Components Map (For Preloading)
// ============================================================================

const ROUTE_IMPORTS = {
  // Student
  dashboard: () => import('./components/Dashboard'),
  player: () => import('./components/Player'),
  quiz: () => import('./components/Quiz'),
  community: () => import('./components/Community'),
  library: () => import('./components/Library'),
  settings: () => import('./components/Settings'),
  profile: () => import('./components/Profile'),
  'daily-tracking': () => import('./components/DailyTracking'),
  notifications: () => import('./components/Notifications'),
  favorites: () => import('./components/Favorites'),
  progress: () => import('./components/PersonalProgress'),
  search: () => import('./components/Search'),
  certificates: () => import('./components/StudentCertificates'),
  messages: () => import('./components/MessagingSystem'),

  // Admin
  'admin-dashboard': () => import('./components/AdminDashboard'),
  'admin-students': () => import('./components/AdminStudents'),
  'admin-audio-courses': () => import('./components/AdminAudioCourses'),
  'admin-reports': () => import('./components/AdminReports'),
  'admin-library': () => import('./components/AdminLibrary'),
  'admin-announcements': () => import('./components/AdminAnnouncements'),
  'admin-quizzes': () => import('./components/AdminQuizManagement'),
  'admin-activity-log': () => import('./components/AdminActivityLog'),
  'admin-certificates': () => import('./components/AdminCertificateManagement'),
  'admin-backup': () => import('./components/AdminBackupSettings'),

  // Auth
  landing: () => import('./components/LandingPage'),
  auth: () => import('./components/Auth'),
  registration: () => import('./components/RegistrationForm'),
  'email-verification': () => import('./components/EmailVerification'),
};

// Student Components
const Dashboard = lazy(ROUTE_IMPORTS.dashboard);
const Player = lazy(ROUTE_IMPORTS.player);
const Quiz = lazy(ROUTE_IMPORTS.quiz);
const Community = lazy(ROUTE_IMPORTS.community);
const Library = lazy(ROUTE_IMPORTS.library);
const Settings = lazy(ROUTE_IMPORTS.settings);
const Profile = lazy(ROUTE_IMPORTS.profile);
const DailyTracking = lazy(ROUTE_IMPORTS['daily-tracking']);
const Notifications = lazy(ROUTE_IMPORTS.notifications);
const Favorites = lazy(ROUTE_IMPORTS.favorites);
const PersonalProgress = lazy(ROUTE_IMPORTS.progress);
const Search = lazy(ROUTE_IMPORTS.search);
const StudentCertificates = lazy(ROUTE_IMPORTS.certificates);
const MessagingSystem = lazy(ROUTE_IMPORTS.messages);

// Admin Components
const AdminDashboard = lazy(ROUTE_IMPORTS['admin-dashboard']);
const AdminStudents = lazy(ROUTE_IMPORTS['admin-students']);
const AdminAudioCourses = lazy(ROUTE_IMPORTS['admin-audio-courses']);
const AdminReports = lazy(ROUTE_IMPORTS['admin-reports']);
const AdminLibrary = lazy(ROUTE_IMPORTS['admin-library']);
const AdminAnnouncements = lazy(ROUTE_IMPORTS['admin-announcements']);
const AdminQuizManagement = lazy(ROUTE_IMPORTS['admin-quizzes']);
const AdminActivityLog = lazy(ROUTE_IMPORTS['admin-activity-log']);
const AdminCertificateManagement = lazy(ROUTE_IMPORTS['admin-certificates']);
const AdminBackupSettings = lazy(ROUTE_IMPORTS['admin-backup']);

// Supervisor Components
const SupervisorDashboard = lazy(() => import('./components/SupervisorDashboard'));
const SupervisorStudents = lazy(() => import('./components/SupervisorStudents'));

// Auth Components
const LandingPage = lazy(ROUTE_IMPORTS.landing);
const Auth = lazy(ROUTE_IMPORTS.auth);
const RegistrationForm = lazy(ROUTE_IMPORTS.registration);
const EmailVerification = lazy(ROUTE_IMPORTS['email-verification']);

// ============================================================================
// Types
// ============================================================================

type ViewState = 'landing' | 'auth' | 'app' | 'registration' | 'verification';
type AuthType = 'login' | 'signup';

// ============================================================================
// App Content Component
// ============================================================================

/**
 * Main content component that uses auth context
 * Separated from App to use hooks inside provider
 */
const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout, login, checkSession } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Derive active tab from URL
  const activeTab = location.pathname.split('/').pop() || 'dashboard';

  const setActiveTab = React.useCallback((tab: string) => {
    navigate(`/${tab}`);
  }, [navigate]);

  const handleOpenChat = React.useCallback((userId: string) => {
    setSelectedConversationId(userId);
    setActiveTab('messages');
  }, [setActiveTab]);

  // Sync view state with authentication state
  useEffect(() => {
    if (isAuthenticated && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup')) {
      if (user?.role === 'admin') navigate('/admin', { replace: true });
      else if (user?.role === 'supervisor') navigate('/supervisor', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user?.role, location.pathname, navigate]);

  // Check for pending verification or email from URL on mount
  useEffect(() => {
    // 1. Check URL query params first
    const searchParams = new URLSearchParams(location.search);
    const emailParam = searchParams.get('email');

    if (emailParam && !isAuthenticated && location.pathname === '/verify') {
      console.log('[App] Verification email from URL:', emailParam);
      setPendingEmail(emailParam);
      return;
    }

    // 2. Fallback to localStorage
    const pendingVerificationEmail = localStorage.getItem('pendingVerificationEmail');
    if (pendingVerificationEmail && !isAuthenticated && location.pathname !== '/verify') {
      setPendingEmail(pendingVerificationEmail);
      navigate('/verify');
    }
  }, [isAuthenticated, location.pathname, location.search, navigate]);

  // Unread message polling is handled by AppLayout to avoid duplicate requests

  // Preloading logic moved to AppLayout

  /**
   * Handles playing a course - navigates to player view
   */
  const handlePlayCourse = async (course: Course): Promise<void> => {
    // Block locked courses globally, but exempt admins and supervisors
    if (course.isLocked && user?.role !== 'admin' && user?.role !== 'supervisor') {
      alert(`هذا المساق مغلق. ${(course as any).lockedByPrerequisiteName ? `يجب اجتياز مساق "${(course as any).lockedByPrerequisiteName}" أولاً` : 'اجتز المساق السابق للفتح'}`);
      return;
    }
    // Auto-enroll if not enrolled
    if (!(course as any).isEnrolled) {
      try {
        const { api } = await import('./services/api');
        await api.enroll(course.id);
        // Refetch updated course data
        const allCourses = await api.getCourses();
        const updated = allCourses.find((c: any) => String(c.id) === String(course.id));
        if (updated) {
          setActiveCourse(updated);
          navigate(`/player/${updated.id}`);
          return;
        }
      } catch (err: any) {
        // If already enrolled, just continue
        console.log('Enrollment attempt:', err?.message);
      }
    }
    setActiveCourse(course);
    navigate(`/player/${course.id}`);
  };

  /**
   * Handles returning to previous tab from player
   */
  const handleBackToDashboard = (): void => {
    setActiveCourse(null);
    navigate(-1); // Go back
  };

  /**
   * Handles user logout
   */
  const handleLogout = (): void => {
    logout();
    navigate('/');
    setActiveCourse(null);
  };


  // ========================================================================
  // Loading State
  // ========================================================================
  if (isLoading) {
    return <LoadingSpinner fullScreen message="جاري التحميل..." />;
  }

  // ========================================================================
  // Root Router Return
  // ========================================================================
  return (
    <>
      <Routes>
        <Route path="/" element={
          <PublicRoute>
            <LandingPage
              onLoginClick={() => navigate('/login')}
              onSignupClick={() => navigate('/signup')}
            />
          </PublicRoute>
        } />

        <Route path="/login" element={
          <PublicRoute>
            <Auth
              initialView="login"
              onToggleView={(view) => navigate(view === 'login' ? '/login' : '/signup')}
              onBack={() => navigate('/')}
              onLoginSuccess={() => navigate('/dashboard')}
              onVerificationRequired={(email) => {
                setPendingEmail(email);
                navigate('/verify');
              }}
            />
          </PublicRoute>
        } />

        <Route path="/signup" element={
          <PublicRoute>
            <RegistrationForm
              onBack={() => navigate('/')}
              onSuccess={(email) => {
                setPendingEmail(email);
                navigate('/verify');
              }}
            />
          </PublicRoute>
        } />

        <Route path="/verify" element={
          <EmailVerification
            email={pendingEmail}
            onSuccess={() => {
              localStorage.removeItem('pendingVerificationEmail');
              checkSession().then(() => navigate('/dashboard'));
            }}
            onBack={() => {
              localStorage.removeItem('pendingVerificationEmail');
              localStorage.removeItem('authToken');
              setPendingEmail('');
              navigate('/signup');
            }}
          />
        } />

        {/* Main App Layout */}
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout
              activeCourse={activeCourse}
              handlePlayCourse={handlePlayCourse}
              handleBackToDashboard={handleBackToDashboard}
              handleOpenChat={handleOpenChat}
              selectedConversationId={selectedConversationId}
            />
          </ProtectedRoute>
        } />
      </Routes>
      <SupportChatBubble />
      <InstallPrompt />
    </>
  );
};

interface AppLayoutProps {
  activeCourse: Course | null;
  handlePlayCourse: (course: Course) => void;
  handleBackToDashboard: () => void;
  handleOpenChat: (userId: string) => void;
  selectedConversationId: string | null;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  activeCourse,
  handlePlayCourse,
  handleBackToDashboard,
  handleOpenChat,
  selectedConversationId
}) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Correctly derive active tab and role prefix
  const pathSegments = pathname.split('/').filter(Boolean);
  const isAdminPath = pathSegments[0] === 'admin';
  const isSupervisorPath = pathSegments[0] === 'supervisor';
  const activeTab = (isAdminPath || isSupervisorPath)
    ? (pathSegments[1] || 'dashboard')
    : (pathSegments[0] || 'dashboard');

  const setActiveTab = React.useCallback((tab: string) => {
    // Routes that are shared between all roles and should not be prefixed
    const sharedRoutes = ['settings', 'profile', 'notifications', 'search', 'messages'];

    if (sharedRoutes.includes(tab)) {
      navigate(`/${tab}`);
      return;
    }

    if (user?.role === 'admin') {
      // Special case for admin dashboard
      if (tab === 'dashboard') {
        navigate('/admin');
      } else {
        navigate(`/admin/${tab}`);
      }
    } else if (user?.role === 'supervisor') {
      if (tab === 'dashboard') {
        navigate('/supervisor');
      } else {
        navigate(`/supervisor/${tab}`);
      }
    } else {
      navigate(`/${tab}`);
    }
  }, [navigate, user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const preloadRoute = (tab: string) => {
    // Optional: Add preloading logic here if needed
  };

  // Poll for unread messages (duplicated from AppContent or moved here)
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUnread = async () => {
      try {
        const { api } = await import('./services/api');
        const count = await api.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Failed to fetch unread messages", error);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // ========================================================================
  // Main App View
  // ========================================================================
  // Dynamic theme classes
  const themeClasses = isDark
    ? 'bg-[url("https://github.com/NinjaWorld1234/Files/blob/main/Dark.png?raw=true")] bg-cover bg-center bg-fixed'
    : 'bg-[url("https://github.com/NinjaWorld1234/Files/blob/main/muslim_youth_forum_landing_page.png?raw=true")] bg-cover bg-center bg-fixed';

  return (
    <div className={`flex h-screen relative overflow-hidden ${themeClasses}`}>
      {/* Global Giant Ornaments */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] giant-symbol-star animate-spin-slow opacity-10 pointer-events-none z-0 translate-x-1/3 -translate-y-1/3" />
      <div className="fixed bottom-0 left-0 giant-symbol-arch opacity-10 pointer-events-none z-0 -translate-x-1/3 translate-y-1/3" />

      {/* Overlay Pattern */}
      <div className="fixed inset-0 mashrabiya-pattern opacity-5 pointer-events-none z-0" />

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onPreload={preloadRoute}
        onLogout={handleLogout}
        role={user?.role || 'student'}
        unreadMessagesCount={unreadCount}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header Gradient */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-0" />

        <Header setActiveTab={setActiveTab} />

        <div
          id="main-content"
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pt-0 pb-24 xl:pb-0 custom-scrollbar relative z-10"
          role="main"
          aria-label="المحتوى الرئيسي"
        >
          <RouteErrorBoundary>
            <Suspense fallback={<SkeletonDashboard />}>
              <Routes>
                {/* Student Routes */}
                <Route path="/dashboard" element={
                  user?.role === 'admin' ? <Navigate to="/admin" replace /> :
                    user?.role === 'supervisor' ? <Navigate to="/supervisor" replace /> :
                      <Dashboard onPlayCourse={handlePlayCourse} setActiveTab={setActiveTab} unreadCount={unreadCount} />
                } />
                <Route path="/library" element={<Library />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/courses" element={<CoursesGrid onPlayCourse={handlePlayCourse} />} />
                <Route path="/certificates" element={<StudentCertificates />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/daily-tracking" element={<DailyTracking />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/progress" element={<PersonalProgress />} />
                <Route path="/search" element={<Search />} />
                <Route path="/messages" element={<MessagingSystem initialSelectedUserId={selectedConversationId} />} />

                <Route path="/player/:courseId" element={
                  activeCourse ? <Player course={activeCourse} onBack={handleBackToDashboard} onPlayCourse={handlePlayCourse} /> : <Navigate to="/dashboard" />
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard setActiveTab={setActiveTab} unreadCount={unreadCount} /></AdminRoute>} />
                <Route path="/admin/students" element={<AdminRoute><AdminStudents onOpenChat={handleOpenChat} /></AdminRoute>} />
                <Route path="/admin/audio-courses" element={<AdminRoute><AdminAudioCourses onPreview={handlePlayCourse} /></AdminRoute>} />
                <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
                <Route path="/admin/library" element={<AdminRoute><AdminLibrary /></AdminRoute>} />
                <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
                <Route path="/admin/quizzes" element={<AdminRoute><AdminQuizManagement /></AdminRoute>} />
                <Route path="/admin/activity-log" element={<AdminRoute><AdminActivityLog /></AdminRoute>} />
                <Route path="/admin/certificates" element={<AdminRoute><AdminCertificateManagement /></AdminRoute>} />
                <Route path="/admin/messages" element={<AdminRoute><MessagingSystem /></AdminRoute>} />

                {/* Supervisor Routes */}
                <Route path="/supervisor" element={<SupervisorRoute><SupervisorDashboard onOpenChat={handleOpenChat} /></SupervisorRoute>} />
                <Route path="/supervisor/students" element={<SupervisorRoute><SupervisorStudents onOpenChat={handleOpenChat} /></SupervisorRoute>} />
                <Route path="/supervisor/audio-courses" element={<SupervisorRoute><AdminAudioCourses onPreview={handlePlayCourse} /></SupervisorRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </RouteErrorBoundary>
        </div>
      </main>
    </div>
  );
};



// ============================================================================
// Main App Component
// ============================================================================

/**
 * Root App component with all providers
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;