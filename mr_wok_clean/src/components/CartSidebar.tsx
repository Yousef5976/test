import React from 'react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../store/CartContext';

interface CartSidebarProps {
  onCheckout: () => void;
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ onCheckout }) => {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeItem, subtotal } = useCart();
  const deliveryFee = 25;
  const total = subtotal + (items.length > 0 ? deliveryFee : 0);

  if (!isCartOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />
      
      <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-[#111111] shadow-2xl z-50 flex flex-col border-l border-white/10 transform transition-transform duration-300 ease-in-out">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0D0D0D]">
          <h2 className="text-2xl font-display font-bold text-[#F5F0E8] flex items-center gap-2">
            <ShoppingBag className="text-[#FF4500]" /> Your Cart
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="text-[#9E9D99] hover:text-white transition-colors p-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#9E9D99] space-y-4">
              <ShoppingBag size={64} className="opacity-20" />
              <p className="text-lg">Your wok is empty!</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="text-[#FF4500] hover:underline"
              >
                Start building your box
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex gap-4 bg-[#1A1A1A] p-4 rounded-xl border border-white/5">
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-bold text-[#F5F0E8]">{item.name}</h4>
                    <span className="font-mono text-[#FFB300]">EGP {item.price * item.quantity}</span>
                  </div>
                  <p className="text-sm text-[#9E9D99] mb-4">{item.category}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-black/50 rounded-lg p-1">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 text-[#9E9D99] hover:text-white transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-mono w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 text-[#9E9D99] hover:text-white transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-sm text-red-500 hover:text-red-400 underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 bg-[#0D0D0D] border-t border-white/10">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-[#9E9D99]">
                <span>Subtotal</span>
                <span className="font-mono">EGP {subtotal}</span>
              </div>
              <div className="flex justify-between text-[#9E9D99]">
                <span>Standard Delivery</span>
                <span className="font-mono">EGP {deliveryFee}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-[#F5F0E8] pt-3 border-t border-white/10">
                <span>Total</span>
                <span className="font-mono text-[#FFB300]">EGP {total}</span>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setIsCartOpen(false);
                onCheckout();
              }}
              className="w-full bg-[#FF4500] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#FF4500]/90 shadow-[0_0_20px_rgba(255,69,0,0.3)] transition-all"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};
