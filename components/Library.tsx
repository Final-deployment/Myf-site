import React, { useState, useEffect } from 'react';
import { Book, FileText, Download, Search, Filter, BookOpen } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { api } from '../services/api';

interface BookItem {
   id: string;
   title: string;
   path: string;
   courseId?: string;
   courseTitle?: string;
   createdAt: string;
   url?: string;
}

const Library: React.FC = () => {
   const { t, language } = useLanguage();
   const [searchQuery, setSearchQuery] = useState('');
   const [books, setBooks] = useState<BookItem[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      const fetchBooks = async () => {
         try {
            const data = await api.getBooks();
            setBooks(data);
         } catch (error) {
            console.error('Error fetching library books:', error);
         } finally {
            setIsLoading(false);
         }
      };
      fetchBooks();
   }, []);

   const filteredBooks = books.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.courseTitle && item.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()))
   );

   return (
      <div className="animate-fade-in">
         <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
            <div>
               <h2 className="text-3xl font-bold text-white mb-2">{t('library.title')}</h2>
               <p className="text-gray-400">{t('library.subtitle')}</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                  <input
                     type="text"
                     placeholder={t('library.searchPlaceholder')}
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-black/20 border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm focus:outline-none focus:border-emerald-500/50 text-white placeholder-gray-500"
                  />
                  <Search className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-2.5 text-gray-400 w-5 h-5`} />
               </div>
            </div>
         </div>

         {isLoading ? (
            <div className="text-center py-20 text-gray-500">جاري التحميل...</div>
         ) : filteredBooks.length === 0 ? (
            <div className="text-center py-20 text-gray-500">لا توجد كتب في المكتبة حالياً</div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {filteredBooks.map((book) => (
                  <div key={book.id} className="glass-panel p-5 rounded-2xl group hover:border-emerald-500/30 transition-all duration-300 flex flex-col">
                     <div className="h-40 rounded-xl mb-4 relative overflow-hidden bg-gradient-to-br from-[#0f2e2a] to-[#0a1815] flex items-center justify-center border border-white/5">
                        <BookOpen className="w-16 h-16 text-emerald-800/40 group-hover:text-emerald-500/20 transition-colors" />
                        <div className="absolute inset-x-0 bottom-0 top-auto h-full bg-gradient-to-t from-black/80 to-transparent opacity-60"></div>
                        <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded-full p-2 border border-white/10">
                           <Book className="w-4 h-4 text-emerald-400" />
                        </div>
                     </div>

                     <h3 className="font-bold text-white mb-1 truncate text-lg" title={book.title}>{book.title}</h3>
                     <p className="text-xs text-emerald-400/80 mb-4 bg-emerald-500/10 w-fit px-2 py-0.5 rounded-full border border-emerald-500/10">
                        {book.courseTitle ? `مساق: ${book.courseTitle}` : 'كتاب عام'}
                     </p>

                     <div className="mt-auto border-t border-white/5 pt-3">
                        <a
                           href={book.url || book.path}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-emerald-600 hover:text-white text-emerald-400 rounded-xl text-sm font-bold transition-all"
                           download
                        >
                           <Download className="w-4 h-4" />
                           {t('library.download')}
                        </a>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
};

export default Library;
