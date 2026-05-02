import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { Menu } from './components/Menu';
import { Featured } from './components/Featured';
import { Reviews } from './components/Reviews';
import { CartSidebar } from './components/CartSidebar';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTracking } from './components/OrderTracking';
import { CartProvider } from './store/CartContext';
import { Search } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────
// CRITICAL: CartProvider is mounted ONCE at the very top and NEVER
// unmounts. The view switch (home vs tracking) happens INSIDE it.
// This prevents any component tree teardown when navigating.
// ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <CartProvider>
      <AppInner />
    </CartProvider>
  );
}

function AppInner() {
  const [trackingRef, setTrackingRef] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const goToTracking = (ref: string) => {
    const clean = ref.trim().toUpperCase();
    if (!clean) return;
    setIsCheckoutOpen(false);
    setTrackingRef(clean);
  };

  const goHome = () => setTrackingRef(null);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F5F0E8] font-body selection:bg-[#FF4500] selection:text-white">

      {/* ── TRACKING PAGE ── rendered in place, no unmount */}
      {trackingRef && (
        <OrderTracking orderRef={trackingRef} onBack={goHome} />
      )}

      {/* ── HOMEPAGE ── hidden not unmounted when tracking is shown */}
      <div style={{ display: trackingRef ? 'none' : 'block' }}>
        <Navbar onTrackOrder={goToTracking} />
        <main>
          <Hero />
          <HowItWorks />
          <Featured />
          <Menu />

          {/* Track Your Order */}
          <section id="track-order" className="py-20 bg-[#0D0D0D]">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-[#F5F0E8] mb-3">
                Track Your Order
              </h2>
              <p className="text-[#9E9D99] mb-10">
                Enter your order reference number to see live status and delivery tracking.
              </p>
              <TrackOrderInput onTrack={goToTracking} />
            </div>
          </section>

          {/* About */}
          <section id="about" className="py-24 bg-[#111111] border-y border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-4xl md:text-5xl font-display font-bold text-[#F5F0E8] mb-6">The Mr. Wok Story</h2>
                  <div className="w-16 h-1 bg-[#FF4500] mb-8"></div>
                  <p className="text-[#9E9D99] text-lg mb-6 leading-relaxed">
                    Since 2012, Mr. Wok has been Cairo's original build-your-own wok box concept. We believe in the theater of cooking — fresh ingredients, authentic Asian flavors, and the roaring fire of the wok.
                  </p>
                  <ul className="space-y-4 text-[#F5F0E8]">
                    <li className="flex items-center gap-3"><span className="text-[#FFB300]">🔥</span> Cooked live in the wok — every order fresh</li>
                    <li className="flex items-center gap-3"><span className="text-[#FFB300]">🌏</span> Authentic Asian ingredients</li>
                    <li className="flex items-center gap-3"><span className="text-[#FFB300]">🎨</span> Fully customizable — your box, your way</li>
                    <li className="flex items-center gap-3"><span className="text-[#FFB300]">📦</span> Heat-retaining signature boxes</li>
                  </ul>
                </div>
                <div className="relative h-[500px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=1000&auto=format&fit=crop"
                    alt="Wok Cooking"
                    className="absolute inset-0 w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                </div>
              </div>
            </div>
          </section>

          {/* Branches */}
          <section id="branches" className="py-24 bg-[#0D0D0D]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-display font-bold text-[#F5F0E8] mb-4">Our Branches</h2>
                <div className="w-24 h-1 bg-[#FF4500] mx-auto"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { name: 'Zamalek', address: '122, 26th of July Street' },
                  { name: 'Downtown', address: '4 Spot Mall' },
                  { name: 'Sheikh Zayed', address: 'Chillout Galerya 40' }
                ].map(branch => (
                  <div key={branch.name} className="bg-[#1A1A1A] p-8 rounded-2xl border border-white/5 hover:border-[#FF4500]/50 transition-colors">
                    <h3 className="text-2xl font-bold text-[#FFB300] mb-2">{branch.name}</h3>
                    <p className="text-[#9E9D99] mb-4">{branch.address}</p>
                    <p className="text-sm text-[#F5F0E8] mb-6">Open Daily: 11 AM – 12 AM</p>
                    <button className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-colors">
                      Get Directions
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <Reviews />
        </main>

        <footer className="bg-[#111111] border-t border-white/10 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <span className="text-3xl font-display font-bold text-[#F5F0E8] block mb-4">
                Mr. <span className="text-[#FF4500]">Wok</span>
              </span>
              <p className="text-[#9E9D99] text-sm">Fresh, tasty and nutritious — Asian food whipped up your way!</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-[#FFB300]">Contact</h4>
              <ul className="space-y-2 text-[#9E9D99] text-sm font-mono">
                <li>010-6678-0006</li><li>02-2736-1542</li><li>mrwokeg1@gmail.com</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-[#FFB300]">Quick Links</h4>
              <ul className="space-y-2 text-[#9E9D99] text-sm">
                {[['Menu','menu'],['About Us','about'],['Branches','branches'],['Track Order','track-order']].map(([l,id]) => (
                  <li key={id}>
                    <button onClick={() => document.getElementById(id)?.scrollIntoView({behavior:'smooth'})}
                      className="hover:text-white transition-colors bg-transparent border-none cursor-pointer text-[#9E9D99] text-sm p-0">
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-[#FFB300]">Follow Us</h4>
              <ul className="space-y-2 text-[#9E9D99] text-sm">
                <li><span className="hover:text-white cursor-pointer">Instagram @mrwokeg</span></li>
                <li><span className="hover:text-white cursor-pointer">Facebook</span></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/5 text-center text-[#9E9D99] text-sm">
            <p>© 2026 Mr. Wok Egypt. All rights reserved.</p>
          </div>
        </footer>

        <CartSidebar onCheckout={() => setIsCheckoutOpen(true)} />
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onTrackOrder={goToTracking}
        />
      </div>

    </div>
  );
}

function TrackOrderInput({ onTrack }: { onTrack: (ref: string) => void }) {
  const [value, setValue] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onTrack(value.trim());
  };
  return (
    <form onSubmit={handleSubmit} className="flex gap-3 max-w-lg mx-auto">
      <div className="relative flex-1">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E9D99]" />
        <input
          type="text" value={value} onChange={e => setValue(e.target.value)}
          placeholder="e.g. MRW-20260318-1234"
          className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-11 pr-4 py-4 text-[#F5F0E8] font-mono text-sm focus:border-[#FF4500] focus:outline-none placeholder:text-[#555] transition-colors"
        />
      </div>
      <button type="submit"
        className="bg-[#FF4500] text-white px-7 py-4 rounded-xl font-bold hover:bg-[#FF4500]/90 transition-all shadow-[0_0_15px_rgba(255,69,0,0.3)] whitespace-nowrap">
        Track →
      </button>
    </form>
  );
}
