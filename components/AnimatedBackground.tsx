import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Dynamic 3D Orbs / Glowing Lights */}
      <div 
        className="absolute top-[-15%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-[#047857]/40 via-[#047857]/10 to-transparent blur-[100px] animate-float opacity-80 mix-blend-screen" 
        style={{ animationDuration: '12s' }} 
      />
      <div 
        className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-[#d4a045]/30 via-[#d4a045]/5 to-transparent blur-[120px] animate-float opacity-70 mix-blend-screen" 
        style={{ animationDuration: '18s', animationDelay: '3s' }} 
      />
      <div 
        className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] rounded-full bg-gradient-to-tr from-[#115e59]/20 to-transparent blur-[80px] animate-pulse-slow opacity-50 mix-blend-screen" 
      />
      
      {/* 3D Geometric Glassmorphism Fragments */}
      <div 
        className="absolute top-[20%] right-[15%] w-40 h-40 rounded-[2rem] bg-gradient-to-br from-white/10 to-white/0 border border-white/20 backdrop-blur-md transform rotate-12 animate-float shadow-[0_8px_32px_rgba(0,0,0,0.1)]" 
        style={{ animationDuration: '9s' }} 
      />
      <div 
        className="absolute bottom-[25%] left-[12%] w-28 h-28 rounded-full bg-gradient-to-tr from-white/10 to-transparent border border-white/20 backdrop-blur-xl transform -rotate-12 animate-float shadow-[0_8px_32px_rgba(0,0,0,0.1)]" 
        style={{ animationDuration: '14s', animationDelay: '1.5s' }} 
      />
      <div 
        className="absolute top-[60%] right-[35%] w-20 h-20 rounded-xl bg-gradient-to-br from-[#d4a045]/20 to-transparent border border-[#d4a045]/30 backdrop-blur-sm transform rotate-45 animate-float" 
        style={{ animationDuration: '11s', animationDelay: '4s' }}
      />
      <div 
        className="absolute top-[30%] left-[25%] w-16 h-16 rounded-full bg-gradient-to-bl from-emerald-500/20 to-transparent border border-emerald-500/20 backdrop-blur-sm animate-float" 
        style={{ animationDuration: '7s', animationDelay: '0.5s' }}
      />
      
      {/* Technical/Geometric Overlay Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.15]" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} 
      />
    </div>
  );
};

export default AnimatedBackground;
