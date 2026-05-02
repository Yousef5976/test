import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { menuData } from '../data/menu';
import { useCart } from '../store/CartContext';

export const Menu: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState(menuData.categories[0]);
  const { addItem } = useCart();

  const filteredItems = menuData.items.filter(item => item.category === activeCategory);

  return (
    <section id="menu" className="py-24 bg-[#0D0D0D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-[#F5F0E8] mb-4">Our Menu</h2>
          <div className="w-24 h-1 bg-[#FF4500] mx-auto"></div>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto pb-4 mb-12 hide-scrollbar space-x-4 justify-start md:justify-center">
          {menuData.categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-6 py-3 rounded-full font-medium transition-all ${
                activeCategory === category
                  ? 'bg-[#FF4500] text-white shadow-[0_0_15px_rgba(255,69,0,0.4)]'
                  : 'bg-[#1A1A1A] text-[#9E9D99] hover:bg-[#1A1A1A]/80 hover:text-white border border-white/5'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div 
              key={item.id} 
              className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/5 hover:border-[#FFB300]/30 transition-all transform hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-[#F5F0E8]">{item.name}</h3>
                  <span className="font-mono text-[#FFB300] font-bold">EGP {item.price}</span>
                </div>
                <p className="text-[#9E9D99] text-sm italic mb-4">{item.description}</p>
                
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {item.badges.map(badge => (
                    <span 
                      key={badge} 
                      className={`text-xs px-2 py-1 rounded-md font-mono ${
                        badge.includes('Veg') ? 'bg-[#4CAF50]/20 text-[#4CAF50]' :
                        badge === 'Spicy' ? 'bg-red-500/20 text-red-500' :
                        'bg-[#FFB300]/20 text-[#FFB300]'
                      }`}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => addItem(item)}
                className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-[#FF4500] text-white py-3 rounded-xl transition-colors group"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
