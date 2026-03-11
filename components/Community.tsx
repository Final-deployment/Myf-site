/**
 * @fileoverview Community component for social interactions and discussions
 * @module components/Community
 */

import React, { memo, useState, useCallback, useMemo } from 'react';
import { MessageSquare, Heart, Share2, MoreHorizontal, PenSquare } from 'lucide-react';
import { COMMUNITY_POSTS } from '../constants';
import { useLanguage } from './LanguageContext';
import { sanitizeHTML } from '../utils/sanitize';
import { Post } from '../types';

/**
 * Post card props
 */
interface PostCardProps {
   post: Post;
   t: (key: string) => string;
}

/**
 * Post card props
 */
interface PostCardProps {
   post: Post;
   t: (key: string) => string;
}

/**
 * Individual post card component
 */
const PostCard = memo<PostCardProps>(({ post, t }) => {
   const handleLike = useCallback(() => {
      // TODO: Dispatch to state management
   }, [post.id]);

   const handleComment = useCallback(() => {
      // TODO: Open comment dialog
   }, [post.id]);

   const handleShare = useCallback(() => {
      // TODO: Open share dialog
   }, [post.id]);

   const handleMore = useCallback(() => {
      // TODO: Open options menu
   }, [post.id]);

   return (
      <article
         className="glass-panel p-6 rounded-2xl hover:border-white/20 transition-colors"
         aria-label={`Post by ${post.author}`}
      >
         <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
               <img
                  src={post.authorAvatar}
                  alt={`${post.author} avatar`}
                  className="w-10 h-10 rounded-full border border-white/20"
                  loading="lazy"
               />
               <div>
                  <h4 className="font-bold text-white text-sm">{post.author}</h4>
                  <time className="text-xs text-gray-400">{post.time}</time>
               </div>
            </div>
            <button
               className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
               onClick={handleMore}
               aria-label="More options"
            >
               <MoreHorizontal className="w-5 h-5" aria-hidden="true" />
            </button>
         </div>

         <p className="text-gray-200 leading-relaxed mb-4">
            {post.content}
         </p>

         <div className="flex gap-2 mb-6" role="list" aria-label="Tags">
            {post.tags.map((tag, i) => (
               <span
                  key={i}
                  className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs"
                  role="listitem"
               >
                  #{tag}
               </span>
            ))}
         </div>

         <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <button
               className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors group"
               onClick={handleLike}
               aria-label={`Like this post. Current likes: ${post.likes}`}
            >
               <Heart className="w-5 h-5 group-hover:fill-current" aria-hidden="true" />
               <span className="text-sm">{post.likes}</span>
            </button>
            <button
               className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors"
               onClick={handleComment}
               aria-label={`Comment on this post. Current comments: ${post.comments}`}
            >
               <MessageSquare className="w-5 h-5" aria-hidden="true" />
               <span className="text-sm">{post.comments} {t('community.comments')}</span>
            </button>
            <button
               className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
               onClick={handleShare}
               aria-label="Share this post"
            >
               <Share2 className="w-5 h-5" aria-hidden="true" />
            </button>
         </div>
      </article>
   );
});
PostCard.displayName = 'PostCard';

/**
 * Trending topics sidebar component
 */
const TrendingTopics = memo<{ t: (key: string) => string }>(({ t }) => {
   const topics = useMemo(() => [
      t('community.topics.fiqhPrayer'),
      t('community.topics.ramadan'),
      t('community.topics.tafsir'),
      t('community.topics.seerah')
   ], [t]);

   return (
      <div className="glass-panel p-6 rounded-2xl">
         <h3 className="font-bold text-white mb-4 border-b border-white/10 pb-2">{t('community.trendingTopics')}</h3>
         <div className="space-y-3" role="list" aria-label="Trending topics">
            {topics.map((topic, i) => (
               <div
                  key={i}
                  className="flex items-center justify-between group cursor-pointer"
                  role="listitem"
                  tabIndex={0}
                  onKeyDown={(e) => {
                     if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        // TODO: Navigate to topic page
                     }
                  }}
               >
                  <span className="text-gray-300 group-hover:text-emerald-400 transition-colors">#{topic}</span>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">120+</span>
               </div>
            ))}
         </div>
      </div>
   );
});
TrendingTopics.displayName = 'TrendingTopics';

/**
 * Community rules sidebar component
 */
const CommunityRules = memo<{ t: (key: string) => string }>(({ t }) => {
   const handleReadRules = useCallback(() => {
      // TODO: Navigate to full rules page
   }, []);

   return (
      <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-black/20">
         <h3 className="font-bold text-white mb-2">{t('community.rulesTitle')}</h3>
         <p className="text-xs text-gray-400 leading-relaxed mb-4">
            {t('community.rulesText')}
         </p>
         <button
            className="w-full py-2 rounded-lg border border-white/10 text-xs text-gray-300 hover:bg-white/5 transition-colors"
            onClick={handleReadRules}
            aria-label={t('community.readRules')}
         >
            {t('community.readRules')}
         </button>
      </div>
   );
});
CommunityRules.displayName = 'CommunityRules';

/**
 * Community component - Social hub for discussions and interactions
 * 
 * Features:
 * - Post feed with like, comment, and share functionality
 * - New post creation
 * - Trending topics sidebar
 * - Community rules
 * - ARIA accessibility
 * 
 * @returns Community component
 */
const Community: React.FC = memo(() => {
   const { t } = useLanguage();
   const [posts, setPosts] = useState<Post[]>(COMMUNITY_POSTS);

   /** Handle creating a new post */
   const handleNewPost = useCallback(() => {
      const content = prompt(t('community.newPostPrompt') || 'أكتب منشورك الجديد:');
      if (content) {
         // Sanitize user input to prevent XSS
         const sanitizedContent = sanitizeHTML(content);
         const newPost: Post = {
            id: `post-${Date.now()}`,
            author: 'أحمد محمد', // Current User
            authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            time: 'الآن',
            content: sanitizedContent,
            likes: 0,
            comments: 0,
            tags: ['جديد']
         };
         setPosts(prevPosts => [newPost, ...prevPosts]);
      }
   }, [t]);

   return (
      <div className="animate-fade-in max-w-5xl mx-auto" role="main" aria-label={t('community.title')}>
         {/* Header */}
         <header className="flex justify-between items-center mb-8">
            <div>
               <h2 className="text-3xl font-bold text-white mb-2">{t('community.title')}</h2>
               <p className="text-gray-400">{t('community.subtitle')}</p>
            </div>
            <button
               onClick={handleNewPost}
               className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-gray-900"
               aria-label={t('community.newPost')}
            >
               <PenSquare className="w-5 h-5" aria-hidden="true" />
               <span className="font-bold">{t('community.newPost')}</span>
            </button>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Feed */}
            <section className="lg:col-span-2 space-y-6" aria-label="Posts feed">
               {posts.map((post) => (
                  <PostCard key={post.id} post={post} t={t} />
               ))}
            </section>

            {/* Sidebar Widgets */}
            <aside className="space-y-6" aria-label="Community sidebar">
               <TrendingTopics t={t} />
               <CommunityRules t={t} />
            </aside>
         </div>
      </div>
   );
});

Community.displayName = 'Community';

export default Community;
