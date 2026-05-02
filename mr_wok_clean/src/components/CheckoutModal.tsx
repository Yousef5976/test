import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle, MapPin } from 'lucide-react';
import { useCart } from '../store/CartContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrackOrder: (ref: string) => void;
}

// Leaflet map picker — loaded dynamically so it doesn't break SSR
let L: any = null;

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onTrackOrder }) => {
  const { items, subtotal, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [customerLat, setCustomerLat] = useState<number | null>(null);
  const [customerLng, setCustomerLng] = useState<number | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    orderType: 'DELIVERY',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryArea: 'Zamalek',
    streetAddress: '',
    buildingNumber: '',
    deliveryNotes: '',
    branchName: 'Zamalek - 26th of July St',
    paymentMethod: 'CASH_ON_DELIVERY'
  });

  const deliveryFee = formData.orderType === 'DELIVERY' ? 25 : 0;
  const total = subtotal + deliveryFee;

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && !L) {
      import('leaflet').then(leaflet => {
        L = leaflet.default;
        setMapReady(true);
      });
    } else if (L) {
      setMapReady(true);
    }
  }, []);

  // Init map when step 2 is shown and order type is DELIVERY
  useEffect(() => {
    if (step !== 2 || formData.orderType !== 'DELIVERY' || !mapReady || !mapContainerRef.current) return;
    if (mapRef.current) return; // already initialised

    // Default center: Cairo
    const defaultCenter: [number, number] = [30.0626, 31.2233];

    const map = L.map(mapContainerRef.current).setView(defaultCenter, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const pinIcon = L.divIcon({
      html: `<div style="background:#FF4500;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);"></div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    // Try to get user's real location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 15);
        const marker = L.marker([latitude, longitude], { icon: pinIcon, draggable: true }).addTo(map);
        markerRef.current = marker;
        setCustomerLat(latitude);
        setCustomerLng(longitude);
        marker.on('dragend', () => {
          const { lat, lng } = marker.getLatLng();
          setCustomerLat(lat);
          setCustomerLng(lng);
        });
      }, () => {
        // GPS denied — let them click to place pin
      });
    }

    // Click anywhere to place/move pin
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      setCustomerLat(lat);
      setCustomerLng(lng);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
        markerRef.current = marker;
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setCustomerLat(pos.lat);
          setCustomerLng(pos.lng);
        });
      }
    });

    mapRef.current = map;

    // Fix leaflet sizing
    setTimeout(() => map.invalidateSize(), 100);
  }, [step, formData.orderType, mapReady]);

  // Destroy map when leaving step 2
  useEffect(() => {
    if (step !== 2 && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    }
  }, [step]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          customerLat,
          customerLng,
          items: items.map(i => ({
            itemName: i.name,
            category: i.category,
            quantity: i.quantity,
            unitPrice: i.price
          }))
        })
      });
      const data = await response.json();
      if (data.success) {
        setOrderRef(data.orderRef);
        setStep(4);
        clearCart();
      } else {
        alert('Failed to place order. Please try again.');
      }
    } catch {
      alert('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setCustomerLat(null);
      setCustomerLng(null);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-[#111111] w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0D0D0D]">
          <h2 className="text-2xl font-display font-bold text-[#F5F0E8]">
            {step === 4 ? 'Order Confirmed' : 'Checkout'}
          </h2>
          {step !== 4 && (
            <button onClick={handleClose} className="text-[#9E9D99] hover:text-white">
              <X size={24} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">

          {/* Step 1 — Order Type */}
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#FFB300] mb-4">1. Order Type</h3>
              <div className="grid grid-cols-3 gap-4">
                {['DELIVERY', 'DINE_IN', 'TAKEAWAY'].map(type => (
                  <button key={type}
                    onClick={() => setFormData({ ...formData, orderType: type })}
                    className={`py-3 rounded-xl border font-medium transition-all ${
                      formData.orderType === type
                        ? 'bg-[#FF4500]/20 border-[#FF4500] text-[#FF4500]'
                        : 'bg-[#1A1A1A] border-white/10 text-[#9E9D99] hover:border-white/30'
                    }`}>
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)}
                className="w-full bg-[#FF4500] text-white py-4 rounded-xl font-bold mt-8 hover:bg-[#FF4500]/90">
                Continue to Details
              </button>
            </div>
          )}

          {/* Step 2 — Details */}
          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="space-y-4">
              <h3 className="text-xl font-bold text-[#FFB300] mb-4">2. Your Details</h3>

              <div>
                <label className="block text-sm text-[#9E9D99] mb-1">Full Name *</label>
                <input required name="customerName" value={formData.customerName} onChange={handleInputChange}
                  className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-white focus:border-[#FF4500] outline-none" />
              </div>
              <div>
                <label className="block text-sm text-[#9E9D99] mb-1">Phone Number *</label>
                <input required name="customerPhone" value={formData.customerPhone} onChange={handleInputChange}
                  placeholder="010..." className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-white focus:border-[#FF4500] outline-none" />
              </div>

              {formData.orderType === 'DELIVERY' && (
                <>
                  <div>
                    <label className="block text-sm text-[#9E9D99] mb-1">Area *</label>
                    <select name="deliveryArea" value={formData.deliveryArea} onChange={handleInputChange}
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-white focus:border-[#FF4500] outline-none">
                      <option>Zamalek</option>
                      <option>Downtown</option>
                      <option>Sheikh Zayed</option>
                      <option>New Cairo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#9E9D99] mb-1">Street Address *</label>
                    <input required name="streetAddress" value={formData.streetAddress} onChange={handleInputChange}
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-white focus:border-[#FF4500] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#9E9D99] mb-1">Building / Apt</label>
                    <input name="buildingNumber" value={formData.buildingNumber} onChange={handleInputChange}
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-white focus:border-[#FF4500] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#9E9D99] mb-1">Delivery Notes</label>
                    <textarea name="deliveryNotes" value={formData.deliveryNotes} onChange={handleInputChange}
                      rows={2} placeholder="Any instructions for the driver..."
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-white focus:border-[#FF4500] outline-none resize-none" />
                  </div>

                  {/* MAP PIN PICKER */}
                  <div>
                    <label className="block text-sm text-[#9E9D99] mb-2 flex items-center gap-2">
                      <MapPin size={14} className="text-[#FF4500]" />
                      Pin Your Delivery Location *
                      <span className="text-xs text-[#555]">— tap the map to place your pin</span>
                    </label>
                    <div
                      ref={mapContainerRef}
                      style={{ height: '220px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}
                    />
                    {customerLat && customerLng ? (
                      <p className="text-xs text-[#22c55e] mt-2 flex items-center gap-1">
                        ✓ Location pinned — drag the marker to adjust
                      </p>
                    ) : (
                      <p className="text-xs text-[#FF4500] mt-2">
                        ⚠ Please tap the map to pin your location
                      </p>
                    )}
                  </div>
                </>
              )}

              {formData.orderType !== 'DELIVERY' && (
                <div>
                  <label className="block text-sm text-[#9E9D99] mb-1">Select Branch *</label>
                  <select name="branchName" value={formData.branchName} onChange={handleInputChange}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-white focus:border-[#FF4500] outline-none">
                    <option>Zamalek - 26th of July St</option>
                    <option>Downtown - Spot Mall</option>
                    <option>Sheikh Zayed - Galerya 40</option>
                  </select>
                </div>
              )}

              <div className="flex gap-4 mt-8">
                <button type="button" onClick={() => setStep(1)}
                  className="w-1/3 bg-[#1A1A1A] text-white py-4 rounded-xl font-bold hover:bg-white/10">Back</button>
                <button type="submit"
                  disabled={formData.orderType === 'DELIVERY' && (!customerLat || !customerLng)}
                  className="w-2/3 bg-[#FF4500] text-white py-4 rounded-xl font-bold hover:bg-[#FF4500]/90 disabled:opacity-40">
                  Review Order
                </button>
              </div>
            </form>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#FFB300] mb-4">3. Review & Confirm</h3>
              <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/10 space-y-2 mb-6">
                <p className="text-[#F5F0E8]"><span className="text-[#9E9D99]">Name:</span> {formData.customerName}</p>
                <p className="text-[#F5F0E8]"><span className="text-[#9E9D99]">Phone:</span> {formData.customerPhone}</p>
                <p className="text-[#F5F0E8]"><span className="text-[#9E9D99]">Type:</span> {formData.orderType.replace('_', ' ')}</p>
                {formData.orderType === 'DELIVERY' && (
                  <>
                    <p className="text-[#F5F0E8]"><span className="text-[#9E9D99]">Address:</span> {formData.deliveryArea} — {formData.streetAddress}</p>
                    {customerLat && <p className="text-[#22c55e] text-sm">📍 Location pinned on map ✓</p>}
                  </>
                )}
              </div>
              <div className="space-y-2 mb-4">
                {items.map(i => (
                  <div key={i.id} className="flex justify-between text-[#9E9D99] text-sm">
                    <span>{i.quantity}× {i.name}</span>
                    <span className="font-mono text-white">EGP {i.price * i.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3 border-t border-white/10 pt-4">
                <div className="flex justify-between text-[#9E9D99]">
                  <span>Subtotal</span><span className="font-mono">EGP {subtotal}</span>
                </div>
                {formData.orderType === 'DELIVERY' && (
                  <div className="flex justify-between text-[#9E9D99]">
                    <span>Delivery Fee</span><span className="font-mono">EGP {deliveryFee}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold text-[#F5F0E8] pt-2">
                  <span>Total</span>
                  <span className="font-mono text-[#FFB300]">EGP {total}</span>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setStep(2)}
                  className="w-1/3 bg-[#1A1A1A] text-white py-4 rounded-xl font-bold hover:bg-white/10">Back</button>
                <button onClick={handleSubmit} disabled={isSubmitting}
                  className="w-2/3 bg-[#FF4500] text-white py-4 rounded-xl font-bold hover:bg-[#FF4500]/90 disabled:opacity-50">
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}

          {/* Step 4 — Confirmed */}
          {step === 4 && (
            <div className="text-center py-8 space-y-6">
              <CheckCircle size={80} className="text-[#4CAF50] mx-auto mb-6" />
              <h3 className="text-3xl font-display font-bold text-[#F5F0E8]">Order Placed! 🎉</h3>
              <p className="text-[#9E9D99] text-lg">Your order reference is:</p>
              <div className="bg-[#1A1A1A] py-3 px-6 rounded-lg inline-block border border-white/10">
                <span className="font-mono text-[#FFB300] text-xl font-bold">{orderRef}</span>
              </div>
              <p className="text-[#9E9D99]">We'll call you at {formData.customerPhone} to confirm.</p>
              <div className="flex flex-col gap-3 mt-8">
                <button onClick={() => { handleClose(); onTrackOrder(orderRef); }}
                  className="w-full bg-[#FFB300] text-[#111111] py-4 rounded-xl font-bold hover:bg-[#FFB300]/90 transition-colors">
                  Track Order Live →
                </button>
                <button onClick={handleClose}
                  className="w-full bg-[#1A1A1A] text-white py-4 rounded-xl font-bold hover:bg-white/10 transition-colors border border-white/10">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
