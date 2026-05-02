import React from 'react';
import { ShoppingCart, Menu as MenuIcon, X } from 'lucide-react';
import { useCart } from '../store/CartContext';

interface NavbarProps {
  onTrackOrder: (ref: string) => void;
}

// Smooth scroll helper — never changes the hash
function scrollTo(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

export const Navbar: React.FC<NavbarProps> = ({ onTrackOrder }) => {
  const { totalItems, setIsCartOpen } = useCart();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home',        id: 'home' },
    { label: 'Menu',        id: 'menu' },
    { label: 'About',       id: 'about' },
    { label: 'Branches',    id: 'branches' },
    { label: 'Track Order', id: 'track-order' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0D0D0D]/90 backdrop-blur-md shadow-lg py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">

          {/* Logo */}
          <button onClick={() => scrollTo('home')} className="flex items-center gap-2">
            <span className="text-3xl font-display font-bold text-[#F5F0E8]">
              Mr. <span className="text-[#FF4500]">Wok</span>
            </span>
          </button>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className="text-[#F5F0E8] hover:text-[#FFB300] transition-colors bg-transparent border-none cursor-pointer text-base"
              >
                {link.label}
              </button>
            ))}

            <div className="flex items-center gap-4">
              <a href="tel:01066780006" className="text-[#9E9D99] font-mono text-sm hover:text-[#F5F0E8]">
                010-6678-0006
              </a>
              <button
                onClick={() => scrollTo('menu')}
                className="bg-[#FF4500] text-white px-6 py-2 rounded-full font-medium hover:bg-[#FF4500]/90 shadow-[0_0_15px_rgba(255,69,0,0.4)] transition-all"
              >
                Order Now
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-[#F5F0E8] hover:text-[#FFB300] transition-colors"
              >
                <ShoppingCart size={24} />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 bg-[#FF4500] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform translate-x-1 -translate-y-1">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile buttons */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-[#F5F0E8]">
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-[#FF4500] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transform translate-x-1 -translate-y-1">
                  {totalItems}
                </span>
              )}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[#F5F0E8]">
              {isMobileMenuOpen ? <X size={28} /> : <MenuIcon size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#1A1A1A] border-t border-white/10 shadow-xl">
          <div className="px-4 pt-2 pb-6 space-y-4 flex flex-col">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => { scrollTo(link.id); setIsMobileMenuOpen(false); }}
                className="block py-2 text-[#F5F0E8] text-left bg-transparent border-none cursor-pointer text-base"
              >
                {link.label}
              </button>
            ))}
            <a href="tel:01066780006" className="block py-2 text-[#FFB300] font-mono">Call: 010-6678-0006</a>
            <button
              onClick={() => { scrollTo('menu'); setIsMobileMenuOpen(false); }}
              className="w-full bg-[#FF4500] text-white px-6 py-3 rounded-full font-medium shadow-[0_0_15px_rgba(255,69,0,0.4)]"
            >
              Order Now
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
