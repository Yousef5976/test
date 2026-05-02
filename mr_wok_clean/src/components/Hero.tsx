import React from 'react';
import { ArrowDown } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background with wok flame effect */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#0D0D0D]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,69,0,0.15)_0%,transparent_50%)] animate-pulse" style={{ animationDuration: '3s' }}></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0wIDBoMXY0MEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIvPgo8cGF0aCBkPSJNMCAwaDQwdjFIMHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMikiLz4KPC9zdmc+')] opacity-50"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-black tracking-tight mb-6">
          <span className="text-[#F5F0E8]">Wok. Fire.</span><br />
          <span className="text-[#FFB300]">Flavor.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-[#9E9D99] max-w-2xl mx-auto mb-10 font-light">
          Build your perfect Asian box — crafted live in the wok.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <button 
            onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto bg-[#FF4500] text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-[#FF4500]/90 shadow-[0_0_20px_rgba(255,69,0,0.5)] transition-all transform hover:scale-105"
          >
            Order Now
          </button>
          <button 
            onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto bg-transparent border-2 border-white text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-white/10 transition-all"
          >
            View Menu
          </button>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-sm md:text-base font-mono text-[#9E9D99]">
          <div className="flex items-center gap-2">
            <span>🔥</span> Cooked Fresh to Order
          </div>
          <div className="flex items-center gap-2">
            <span>🚀</span> Delivery Available
          </div>
          <div className="flex items-center gap-2">
            <span>🗺️</span> 5 Cairo Branches
          </div>
          <div className="flex items-center gap-2">
            <span>⭐</span> 78% Recommended
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce text-[#F5F0E8]/50">
        <ArrowDown size={32} />
      </div>
    </section>
  );
};
