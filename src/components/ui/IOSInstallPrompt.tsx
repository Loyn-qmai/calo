import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function IOSInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Check if it's already in standalone mode (installed)
    const isStandalone = (window.navigator as any).standalone;

    // Show prompt only if on iOS and not installed
    if (isIOS && !isStandalone) {
      // Show after a short delay
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 z-[100] md:hidden"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 relative overflow-hidden">
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-net/10 flex items-center justify-center flex-shrink-0">
               <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-[14px] text-slate-900 leading-tight">Cài đặt "TÔI SẼ GẦY" làm WebApp</h3>
              <p className="text-[12px] text-slate-500 mt-1 leading-normal">
                Để có trải nghiệm mượt mà không có thanh địa chỉ trình duyệt:
              </p>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-[12px] text-slate-700 font-medium">
                  <div className="p-1.5 bg-slate-100 rounded-lg">
                    <Share className="w-4 h-4 text-accent-net" />
                  </div>
                  <span>1. Bấm nút <b>Chia sẻ</b> trên Safari</span>
                </div>
                
                <div className="flex items-center gap-3 text-[12px] text-slate-700 font-medium">
                  <div className="p-1.5 bg-slate-100 rounded-lg">
                    <PlusSquare className="w-4 h-4 text-accent-net" />
                  </div>
                  <span>2. Chọn <b>Thêm vào màn hình chính</b></span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-50 text-center">
             <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Trải nghiệm như ứng dụng thật</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
