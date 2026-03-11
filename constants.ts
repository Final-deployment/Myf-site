/**
 * Application Constants
 * 
 * This file contains all static data and configuration constants.
 * Moving magic numbers and default data here improves maintainability.
 * 
 * @module constants
 */

import { Course, Question, Badge, Post, ActivityLog } from './types';
import { Book, Star, Calendar, Sun, Shield, Award, Users } from 'lucide-react';

// ============================================================================
// Configuration Constants
// ============================================================================

/** Animation durations in milliseconds */
export const ANIMATION = {
  FADE_IN: 500,
  SLIDE: 300,
  SPIN_SLOW: 120000, // 120 seconds for slow spin
} as const;

/** Pagination settings */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/** File size limits */
export const FILE_LIMITS = {
  MAX_UPLOAD_SIZE_MB: 10,
  MAX_AVATAR_SIZE_MB: 2,
  MAX_THUMBNAIL_SIZE_MB: 5,
} as const;

/** Gamification settings */
export const GAMIFICATION = {
  POINTS_PER_LESSON: 10,
  POINTS_PER_COURSE: 100,
  POINTS_PER_QUIZ: 50,
  STREAK_BONUS_MULTIPLIER: 1.5,
} as const;

/** UI breakpoints matching Tailwind */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
} as const;

// ============================================================================
// Course Data
// ============================================================================

/**
 * Default courses displayed in the application
 */
export const COURSES: Course[] = [
  {
    id: 'course_aqeeda',
    title: 'عقيدة',
    titleEn: 'Aqeeda',
    instructor: 'العلماء',
    instructorEn: 'Scholars',
    progress: 0,
    category: 'العقيدة',
    categoryEn: 'Aqeeda',
    duration: '2س 15د',
    durationEn: '2h 15m',
    thumbnail: '/thumbnails/aqeeda.png',
    description: 'دورة في العقيدة الإسلامية',
    descriptionEn: 'Course on Islamic Creed',
    lessonsCount: 25,
    studentsCount: 189,
    status: 'published'
  },
  {
    id: 'course_fiqh1-waseelit',
    title: 'فقه (الوسيلة)',
    titleEn: 'Fiqh (Al-Waseela)',
    instructor: 'العلماء',
    instructorEn: 'Scholars',
    progress: 0,
    category: 'الفقه',
    categoryEn: 'Fiqh',
    duration: '3س',
    durationEn: '3h',
    thumbnail: '/thumbnails/fiqh_waseelit.png',
    description: 'شرح كتاب الوسيلة في الفقه',
    descriptionEn: 'Explanation of Al-Waseela in Fiqh',
    lessonsCount: 15,
    studentsCount: 120,
    status: 'published'
  },
  {
    id: 'course_fiqh2-it7af',
    title: 'فقه (الإتحاف)',
    titleEn: 'Fiqh (Al-Ithaf)',
    instructor: 'العلماء',
    instructorEn: 'Scholars',
    progress: 0,
    category: 'الفقه',
    categoryEn: 'Fiqh',
    duration: '4س',
    durationEn: '4h',
    thumbnail: '/thumbnails/fiqh_it7af.png',
    description: 'شرح كتاب الإتحاف في الفقه',
    descriptionEn: 'Explanation of Al-Ithaf in Fiqh',
    lessonsCount: 20,
    studentsCount: 95,
    status: 'published'
  },
  {
    id: 'course_madkhal',
    title: 'مدخل للعلوم الشرعية',
    titleEn: 'Introduction to Sharia Sciences',
    instructor: 'العلماء',
    instructorEn: 'Scholars',
    progress: 0,
    category: 'أصول',
    categoryEn: 'Principles',
    duration: '1س 30د',
    durationEn: '1h 30m',
    thumbnail: '/thumbnails/madkhal.png',
    description: 'مدخل للأصول والعلوم الشرعية',
    descriptionEn: 'Intro to Sharia principles and sciences',
    lessonsCount: 10,
    studentsCount: 150,
    status: 'published'
  },
  {
    id: 'course_nifas',
    title: 'أحكام النفاس',
    titleEn: 'Rules of Postpartum',
    instructor: 'العلماء',
    instructorEn: 'Scholars',
    progress: 0,
    category: 'الفقه',
    categoryEn: 'Fiqh',
    duration: '1س',
    durationEn: '1h',
    thumbnail: '/thumbnails/nifas.png',
    description: 'دورة في أحكام النفاس للمرأة المسلمة',
    descriptionEn: 'Course on Postpartum rules for Muslim women',
    lessonsCount: 5,
    studentsCount: 80,
    status: 'published'
  },
  {
    id: 'course_seerah',
    title: 'سيرة نبوية',
    titleEn: 'Prophetic Seerah',
    instructor: 'العلماء',
    instructorEn: 'Scholars',
    progress: 0,
    category: 'السيرة',
    categoryEn: 'Seerah',
    duration: '5س',
    durationEn: '5h',
    thumbnail: '/thumbnails/seerah.png',
    description: 'موجز السيرة النبوية العطرة',
    descriptionEn: 'Summary of the Prophetic Biography',
    lessonsCount: 30,
    studentsCount: 245,
    status: 'published'
  },
  {
    id: 'course_tafseer',
    title: 'تفسير',
    titleEn: 'Tafseer',
    instructor: 'العلماء',
    instructorEn: 'Scholars',
    progress: 0,
    category: 'القرآن',
    categoryEn: 'Quran',
    duration: '10س',
    durationEn: '10h',
    thumbnail: '/thumbnails/tafseer.png',
    description: 'تفسير لبعض سور القرآن الكريم',
    descriptionEn: 'Interpretation of some Quranic chapters',
    lessonsCount: 40,
    studentsCount: 312,
    status: 'published'
  },
  {
    id: 'course_tazkiyah',
    title: 'تزكية',
    titleEn: 'Tazkiyah',
    instructor: 'العلماء',
    instructorEn: 'Scholars',
    progress: 0,
    category: 'التزكية',
    categoryEn: 'Tazkiyah',
    duration: '1س 50د',
    durationEn: '1h 50m',
    thumbnail: '/thumbnails/tazkiyah.png',
    description: 'مبادئ تزكية النفس والقلب',
    descriptionEn: 'Principles of Soul and Heart Purification',
    lessonsCount: 12,
    studentsCount: 175,
    status: 'published'
  },
  {
    id: 'course_arba3oon',
    title: 'الأربعون النووية',
    titleEn: 'The Forty Nuclear',
    instructor: 'العلماء',
    instructorEn: 'Scholars',
    progress: 0,
    category: 'الحديث',
    categoryEn: 'Hadith',
    duration: '2س 30د',
    durationEn: '2h 30m',
    thumbnail: '/thumbnails/arba3oon.png',
    description: 'شرح الأربعين النووية',
    descriptionEn: 'Explanation of An-Nawawi\'s Forty Hadith',
    lessonsCount: 42,
    studentsCount: 210,
    status: 'published'
  }
];

// ============================================================================
// Quiz Data
// ============================================================================

/**
 * Sample quiz questions
 */
export const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "أي من العلماء المسلمين في العصر الذهبي معروف بمساهماته في الطب، وتحديداً كتاب 'القانون في الطب'؟",
    textEn: "Which Muslim scholar from the Golden Age is known for his contributions to medicine, specifically 'The Canon of Medicine'?",
    options: [
      "أ. الخوارزمي",
      "ب. ابن سينا (Avicenna)",
      "ج. البيروني",
      "د. الفارابي"
    ],
    optionsEn: [
      "A. Al-Khwarizmi",
      "B. Ibn Sina (Avicenna)",
      "C. Al-Biruni",
      "D. Al-Farabi"
    ],
    correctAnswer: 1
  },
  {
    id: 2,
    text: "ما هي عاصمة الدولة الأموية؟",
    textEn: "What was the capital of the Umayyad Caliphate?",
    options: [
      "أ. بغداد",
      "ب. القاهرة",
      "ج. دمشق",
      "د. قرطبة"
    ],
    optionsEn: [
      "A. Baghdad",
      "B. Cairo",
      "C. Damascus",
      "D. Cordoba"
    ],
    correctAnswer: 2
  }
];

// ============================================================================
// Badge Data
// ============================================================================

/**
 * Achievement badges available in the platform
 */
export const BADGES: Badge[] = [
  {
    id: '1',
    title: 'الطالب المجتهد',
    icon: Book,
    isUnlocked: true,
    description: 'أكملت 5 دورات'
  },
  {
    id: '2',
    title: 'رائد المعرفة',
    icon: Star,
    isUnlocked: true,
    description: 'حصلت على 1000 نقطة'
  },
  {
    id: '3',
    title: 'نجم المثابرة',
    icon: Calendar,
    isUnlocked: true,
    description: 'دخلت التطبيق 7 أيام متتالية'
  },
  {
    id: '4',
    title: 'ورد الفجر',
    icon: Sun,
    isUnlocked: true,
    description: 'أتممت ورد الصباح'
  },
  {
    id: '5',
    title: 'حافظ (المستوى الأول)',
    icon: Shield,
    isUnlocked: false,
    description: 'حفظت جزء عم كاملاً'
  },
  {
    id: '6',
    title: 'قائد مجتمعي',
    icon: Users,
    isUnlocked: false,
    description: 'شاركت في 10 نقاشات'
  },
  {
    id: '7',
    title: 'مساعد خيري',
    icon: Award,
    isUnlocked: false,
    description: 'ساعدت طالبين في المنتدى'
  },
];

// ============================================================================
// Community Data
// ============================================================================

/**
 * Sample community posts
 */
export const COMMUNITY_POSTS: Post[] = [
  {
    id: '1',
    author: 'عمر فاروق',
    authorAvatar: 'https://ui-avatars.com/api/?name=Omar+F&background=0D8ABC&color=fff&size=50',
    time: 'منذ ساعتين',
    content: 'السلام عليكم، هل يوجد ملخص جيد لدورة فقه الصلاة؟ أحتاجه للمراجعة قبل الاختبار.',
    likes: 15,
    comments: 4,
    tags: ['فقه', 'مساعدة']
  },
  {
    id: '2',
    author: 'سارة أحمد',
    authorAvatar: 'https://ui-avatars.com/api/?name=Sara+A&background=5E35B1&color=fff&size=50',
    time: 'منذ 5 ساعات',
    content: 'أتممت اليوم بحمد الله دورة السيرة النبوية. أنصح الجميع بها، أسلوب الشيخ رائع جداً ومؤثر.',
    likes: 42,
    comments: 12,
    tags: ['إنجاز', 'توصية']
  }
];

// ============================================================================
// Activity Data
// ============================================================================

/**
 * Recent activity for demo purposes
 */
export const RECENT_ACTIVITY: ActivityLog[] = [
  {
    id: '1',
    user: 'فاطمة السيد',
    action: 'أنهت دورة "فقه العبادات"',
    time: 'منذ 5 دقائق',
    avatar: 'https://ui-avatars.com/api/?name=Fatma+S&background=00897B&color=fff&size=50',
    type: 'success'
  },
  {
    id: '2',
    user: 'عمر حسن',
    action: 'سجل دخول لأول مرة',
    time: 'منذ 15 دقيقة',
    avatar: 'https://ui-avatars.com/api/?name=Omar+H&background=F57C00&color=fff&size=50',
    type: 'neutral'
  },
  {
    id: '3',
    user: 'ليلى يوسف',
    action: 'حققت وسام "طالب مجتهد"',
    time: 'منذ 45 دقيقة',
    avatar: 'https://ui-avatars.com/api/?name=Layla+Y&background=C2185B&color=fff&size=50',
    type: 'success'
  },
  {
    id: '4',
    user: 'محمد عبدالله',
    action: 'فشل في اختبار المستوى 1',
    time: 'منذ ساعة',
    avatar: 'https://ui-avatars.com/api/?name=Mohamed+A&background=1565C0&color=fff&size=50',
    type: 'warning'
  },
];

// ============================================================================
// Category Options
// ============================================================================

/**
 * Available course categories
 */
export const COURSE_CATEGORIES = [
  { value: 'القرآن', valueEn: 'Quran', label: 'القرآن الكريم' },
  { value: 'الفقه', valueEn: 'Fiqh', label: 'الفقه الإسلامي' },
  { value: 'التاريخ', valueEn: 'History', label: 'التاريخ الإسلامي' },
  { value: 'الأخلاق', valueEn: 'Ethics', label: 'الأخلاق والآداب' },
  { value: 'السيرة', valueEn: 'Seerah', label: 'السيرة النبوية' },
  { value: 'المعاملات', valueEn: 'Transactions', label: 'المعاملات المالية' },
] as const;

/**
 * User status options
 */
export const USER_STATUS_OPTIONS = [
  { value: 'active', label: 'نشط', color: 'emerald' },
  { value: 'inactive', label: 'غير نشط', color: 'red' },
  { value: 'pending', label: 'معلق', color: 'amber' },
] as const;

/**
 * Priority levels for announcements
 */
export const PRIORITY_LEVELS = [
  { value: 'low', label: 'منخفضة', color: 'gray' },
  { value: 'medium', label: 'متوسطة', color: 'amber' },
  { value: 'high', label: 'عالية', color: 'red' },
] as const;
