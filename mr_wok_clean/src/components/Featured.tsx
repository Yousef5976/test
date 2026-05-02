import React from 'react';
import { menuData } from '../data/menu';
import { useCart } from '../store/CartContext';

export const Featured: React.FC = () => {
  const { addItem } = useCart();
  
  // Get popular items
  const popularItems = menuData.items
    .filter(item => item.badges.includes('Popular'))
    .slice(0, 3);

  return (
    <section className="py-24 bg-[#111111] border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-[#F5F0E8] mb-4">Popular Choices</h2>
          <div className="w-24 h-1 bg-[#FF4500] mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {popularItems.map((item, index) => (
            <div key={item.id} className="bg-[#1A1A1A] rounded-2xl overflow-hidden border border-white/5 group hover:border-[#FFB300]/30 transition-all">
              <div className="h-48 bg-[#0D0D0D] relative overflow-hidden flex items-center justify-center text-6xl">
                {/* Placeholder images based on category */}
                {item.category === 'Combos' && '🍱'}
                {item.category === 'Noodles' && '🍜'}
                {item.category === 'Appetizers' && '🥟'}
                {item.category === 'Proteins' && '🥩'}
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] to-transparent opacity-80"></div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-[#F5F0E8]">{item.name}</h3>
                  <span className="font-mono text-[#FFB300] font-bold">EGP {item.price}</span>
                </div>
                <p className="text-[#9E9D99] text-sm italic mb-6">{item.description}</p>
                
                <button 
                  onClick={() => addItem(item)}
                  className="w-full bg-[#FF4500] text-white py-3 rounded-xl font-medium hover:bg-[#FF4500]/90 transition-colors shadow-[0_0_15px_rgba(255,69,0,0.2)]"
                >
                  Add to Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
