import React from 'react';
import { Star } from 'lucide-react';

export const Reviews: React.FC = () => {
  const reviews = [
    { name: 'Ahmed S.', text: 'Best wok box in Cairo! The theatrical cooking is amazing and the flavors are authentic.', rating: 5, date: '2 days ago' },
    { name: 'Sarah M.', text: 'Love the Pad Thai Chicken. Generous portions and the delivery packaging keeps it super hot.', rating: 5, date: '1 week ago' },
    { name: 'Omar K.', text: 'The Zamalek branch is my go-to for late night Asian food. The secret sauce is incredible.', rating: 4, date: '2 weeks ago' },
    { name: 'Nour E.', text: 'Finally a place where I can build my own noodle box exactly how I like it.', rating: 5, date: '1 month ago' },
    { name: 'Karim T.', text: 'Great quality ingredients. The beef teriyaki is highly recommended.', rating: 5, date: '1 month ago' },
    { name: 'Laila H.', text: 'Fast delivery to Sheikh Zayed and the food tastes just as fresh as dining in.', rating: 4, date: '2 months ago' },
  ];

  return (
    <section className="py-24 bg-[#0D0D0D] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-[#F5F0E8] mb-4">What People Say</h2>
          <div className="w-24 h-1 bg-[#FF4500] mx-auto"></div>
        </div>

        <div className="flex overflow-x-auto pb-8 hide-scrollbar snap-x gap-6">
          {reviews.map((review, index) => (
            <div key={index} className="min-w-[300px] md:min-w-[400px] bg-[#1A1A1A] p-8 rounded-2xl border border-white/5 snap-center">
              <div className="flex text-[#FFB300] mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-[#9E9D99]" : ""} />
                ))}
              </div>
              <p className="text-[#F5F0E8] mb-6 italic">"{review.text}"</p>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-[#FF4500]">{review.name}</span>
                <span className="text-[#9E9D99] font-mono">{review.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
