import React from 'react';
import { Utensils, Beef, Flame, Droplet } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      icon: <Utensils size={32} className="text-[#FFB300]" />,
      title: 'Choose Your Base',
      desc: 'Noodles or Rice'
    },
    {
      num: '02',
      icon: <Beef size={32} className="text-[#FFB300]" />,
      title: 'Pick Your Protein',
      desc: 'Chicken, Beef, Shrimp, Tofu'
    },
    {
      num: '03',
      icon: <Droplet size={32} className="text-[#FFB300]" />,
      title: 'Select Your Sauce',
      desc: 'Sweet, Savory, or Spicy'
    },
    {
      num: '04',
      icon: <Flame size={32} className="text-[#FF4500]" />,
      title: 'Cooked Live',
      desc: 'Tossed in the flaming wok'
    }
  ];

  return (
    <section className="py-24 bg-[#111111] relative border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-[#F5F0E8] mb-4">How It Works</h2>
          <div className="w-24 h-1 bg-[#FF4500] mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Desktop connecting line */}
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-white/20 -translate-y-1/2 z-0"></div>

          {steps.map((step, index) => (
            <div key={index} className="relative z-10 flex flex-col items-center text-center group">
              <div className="text-5xl font-display font-black text-white/5 mb-4 group-hover:text-white/10 transition-colors">
                {step.num}
              </div>
              <div className="w-20 h-20 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center mb-6 shadow-lg group-hover:border-[#FFB300]/50 transition-colors">
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-[#F5F0E8] mb-2">{step.title}</h3>
              <p className="text-[#9E9D99]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
