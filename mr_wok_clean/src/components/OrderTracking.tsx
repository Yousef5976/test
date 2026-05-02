import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Package, ChefHat, Bike, CheckCircle, ArrowLeft, Send, Star } from 'lucide-react';

// ── Map icons ────────────────────────────────────────────────────────
const driverIcon = L.divIcon({
  html: `<div style="background:#FF4500;border-radius:50%;width:36px;height:36px;border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
  </div>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 18],
});

const homeIcon = L.divIcon({
  html: `<div style="background:#4CAF50;border-radius:50%;width:36px;height:36px;border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  </div>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 18],
});

// ── This component lives INSIDE MapContainer and smoothly moves the map ──
const LiveDriverMarker: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    // Smoothly pan map to follow driver
    map.flyTo(position, map.getZoom(), { animate: true, duration: 1.5 });
  }, [position, map]);

  return (
    <Marker position={position} icon={driverIcon}>
      <Popup>Your Driver 🛵</Popup>
    </Marker>
  );
};

// ── Status labels ────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  PENDING:            'Order Received',
  ACCEPTED:           'Order Accepted',
  READY_FOR_DELIVERY: 'Ready for Delivery',
  OUT_FOR_DELIVERY:   'Out for Delivery',
  DELIVERED:          'Delivered',
};

interface OrderTrackingProps {
  orderRef: string;
  onBack: () => void;
}

export const OrderTracking: React.FC<OrderTrackingProps> = ({ orderRef, onBack }) => {
  const [order,          setOrder]          = useState<any>(null);
  const [status,         setStatus]         = useState('PENDING');
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [deliveryPhone,  setDeliveryPhone]  = useState('');
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [chatMessages,   setChatMessages]   = useState<any[]>([]);
  const [chatInput,      setChatInput]      = useState('');
  const [rating,         setRating]         = useState(0);
  const [hoverRating,    setHoverRating]    = useState(0);
  const [ratingComment,  setRatingComment]  = useState('');
  const [rated,          setRated]          = useState(false);

  const socketRef  = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const joinedRef  = useRef(false);

  // ── One-time setup ────────────────────────────────────────────────
  useEffect(() => {
    // Fetch order
    fetch(`/api/orders/${orderRef}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); }
        else {
          setOrder(data);
          setStatus(data.status || 'PENDING');
          if (data.rating) setRated(true);
          if (data.deliveryLat && data.deliveryLng)
            setDriverLocation([data.deliveryLat, data.deliveryLng]);
        }
        setLoading(false);
      })
      .catch(() => { setError('Failed to load order'); setLoading(false); });

    // Fetch chat history
    fetch(`/api/chat/${orderRef}`)
      .then(r => r.json())
      .then(msgs => setChatMessages(Array.isArray(msgs) ? msgs : []))
      .catch(() => {});

    // Create socket ONCE
    if (!socketRef.current) {
      const socket = io({ autoConnect: true, reconnection: true });
      socketRef.current = socket;

      socket.on('connect', () => {
        if (!joinedRef.current) {
          socket.emit('join_tracking', orderRef);
          joinedRef.current = true;
        }
      });

      socket.on('order_status', (data: any) => {
        if (data.orderRef === orderRef) {
          setStatus(data.status);
          if (data.deliveryPhone) setDeliveryPhone(data.deliveryPhone);
        }
      });

      // Live GPS from delivery guy — update driver marker position
      socket.on('driver_location', (data: any) => {
        setDriverLocation([data.lat, data.lng]);
      });

      socket.on('chat_message', (msg: any) => {
        if (msg.orderRef === orderRef) {
          setChatMessages(prev => [...prev, msg]);
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        joinedRef.current = false;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendChat = useCallback(() => {
    const msg = chatInput.trim();
    if (!msg || !socketRef.current) return;
    socketRef.current.emit('chat_message', {
      orderRef,
      message: msg,
      senderRole: 'customer',
      senderId: 'customer',
      senderName: order?.customerName || 'Customer',
      token: '',
    });
    setChatInput('');
  }, [chatInput, order, orderRef]);

  const submitRating = async () => {
    if (!rating) return;
    await fetch(`/api/orders/${orderRef}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, comment: ratingComment }),
    });
    setRated(true);
  };

  // ── Loading / Error ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF4500]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center text-[#F5F0E8] p-4">
        <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
        <p className="text-[#9E9D99] mb-2 font-mono">{orderRef}</p>
        <p className="text-[#9E9D99] mb-8">Check your reference number and try again.</p>
        <button onClick={onBack} className="bg-[#FF4500] text-white px-6 py-3 rounded-full hover:bg-[#FF4500]/90">
          ← Return Home
        </button>
      </div>
    );
  }

  const isDelivery    = order.orderType === 'DELIVERY';
  const isOutForDeliv = status === 'OUT_FOR_DELIVERY';
  const isDelivered   = status === 'DELIVERED';

  const steps = [
    { id: 'PENDING',            label: 'Received',  icon: <Package size={22} /> },
    { id: 'ACCEPTED',           label: 'Accepted',  icon: <ChefHat size={22} /> },
    { id: 'READY_FOR_DELIVERY', label: 'Prepared',  icon: <CheckCircle size={22} /> },
    ...(isDelivery ? [{ id: 'OUT_FOR_DELIVERY', label: 'On the Way', icon: <Bike size={22} /> }] : []),
    { id: 'DELIVERED',          label: isDelivery ? 'Delivered' : 'Ready', icon: <CheckCircle size={22} /> },
  ];
  const currentIdx = steps.findIndex(s => s.id === status);

  // Default map center — driver location if available, else customer location, else Cairo
  const mapCenter: [number, number] = driverLocation
    || (order.customerLat && order.customerLng ? [order.customerLat, order.customerLng] : [30.0626, 31.2233]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F5F0E8] font-body pt-8 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        <button onClick={onBack}
          className="flex items-center gap-2 text-[#9E9D99] hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} /> Back to Home
        </button>

        <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">

          {/* Header */}
          <div className="p-6 md:p-8 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold mb-2">Order Tracking</h1>
              <p className="text-[#9E9D99] font-mono text-sm">
                Ref: <span className="text-[#FFB300]">{orderRef}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#9E9D99]">Current Status</p>
              <p className="text-lg font-bold text-[#FFB300]">{STATUS_LABELS[status] || status}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6 md:p-8 bg-[#111111]">
            <div className="relative flex justify-between">
              <div className="absolute top-6 left-0 w-full h-1 bg-white/10" />
              <div
                className="absolute top-6 left-0 h-1 bg-[#FF4500] transition-all duration-700"
                style={{ width: `${(Math.max(0, currentIdx) / (steps.length - 1)) * 100}%` }}
              />
              {steps.map((step, i) => {
                const isActive  = i <= currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                      isActive
                        ? 'bg-[#FF4500] border-[#111111] text-white shadow-[0_0_15px_rgba(255,69,0,0.5)]'
                        : 'bg-[#1A1A1A] border-[#111111] text-[#9E9D99]'
                    }`}>
                      {step.icon}
                    </div>
                    <p className={`mt-3 text-xs font-medium text-center max-w-[64px] ${isActive ? 'text-white' : 'text-[#9E9D99]'}`}>
                      {step.label}
                    </p>
                    {isCurrent && <span className="mt-1 text-xs text-[#FFB300] animate-pulse">Now</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── LIVE MAP — shows as soon as order is out for delivery ── */}
          {isDelivery && (isOutForDeliv || isDelivered || driverLocation) && (
            <div className="h-[400px] w-full relative border-t border-white/10">
              <MapContainer
                center={mapCenter}
                zoom={14}
                className="h-full w-full z-0"
                zoomControl={true}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OpenStreetMap &copy; CARTO'
                />

                {/* Driver marker — moves smoothly with LiveDriverMarker */}
                {driverLocation && (
                  <LiveDriverMarker position={driverLocation} />
                )}

                {/* Customer home marker */}
                {order.customerLat && order.customerLng && (
                  <Marker
                    position={[order.customerLat, order.customerLng]}
                    icon={homeIcon}
                  >
                    <Popup>Your Location 🏠</Popup>
                  </Marker>
                )}
              </MapContainer>

              {/* Status overlay */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#1A1A1A]/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 z-[1000] flex items-center gap-2.5 pointer-events-none">
                {!isDelivered && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF4500] animate-ping" />
                )}
                <span className="font-medium text-sm text-white">
                  {isDelivered ? '✅ Order has arrived!' : '🛵 Driver is on the way — live location'}
                </span>
              </div>
            </div>
          )}

          {/* Call driver */}
          {isDelivery && (isOutForDeliv || isDelivered) && deliveryPhone && (
            <div className="px-6 py-4 border-t border-white/10 bg-[#0D0D0D]">
              <a href={`tel:${deliveryPhone}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold hover:bg-blue-500/20 transition-colors">
                📞 Call Driver: {deliveryPhone}
              </a>
            </div>
          )}

          {/* Chat */}
          {isDelivery && (isOutForDeliv || isDelivered) && (
            <div className="p-6 border-t border-white/10 bg-[#111111]">
              <h3 className="text-base font-bold text-[#F5F0E8] mb-4">💬 Chat with Driver</h3>
              <div className="bg-[#0D0D0D] rounded-xl p-4 h-[220px] overflow-y-auto flex flex-col gap-2 mb-3">
                {chatMessages.length === 0 && (
                  <p className="text-[#555] text-sm text-center mt-8">No messages yet. Say hi! 👋</p>
                )}
                {chatMessages.map((msg, i) => {
                  const isMe = msg.senderRole === 'customer';
                  return (
                    <div key={i} className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                      <div className={`px-4 py-2 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-[#FF4500] text-white rounded-br-sm'
                          : 'bg-[#1A1A1A] text-[#F5F0E8] border border-white/10 rounded-bl-sm'
                      }`}>
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-[#555] mt-1 px-1">
                        {isMe ? 'You' : msg.senderName} · {new Date(msg.sentAt).toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              {!isDelivered && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat()}
                    placeholder="Type a message…"
                    className="flex-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-[#F5F0E8] text-sm focus:border-[#FF4500] outline-none"
                  />
                  <button onClick={sendChat}
                    className="bg-[#FF4500] text-white px-4 py-3 rounded-xl hover:bg-[#FF4500]/90 transition-colors">
                    <Send size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Rating */}
          {isDelivered && !rated && (
            <div className="p-6 border-t border-white/10 bg-[#0D0D0D]">
              <h3 className="text-base font-bold text-[#F5F0E8] mb-4">⭐ Rate Your Experience</h3>
              <div className="flex justify-center gap-3 mb-4">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(n)}
                    className="transition-transform hover:scale-125">
                    <Star size={32} className={`transition-colors ${
                      n <= (hoverRating || rating) ? 'text-[#FFB300] fill-[#FFB300]' : 'text-[#333]'
                    }`} />
                  </button>
                ))}
              </div>
              <textarea
                value={ratingComment}
                onChange={e => setRatingComment(e.target.value)}
                placeholder="Any comments? (optional)"
                rows={2}
                className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl p-3 text-[#F5F0E8] text-sm outline-none focus:border-[#FF4500] resize-none mb-3"
              />
              <button onClick={submitRating} disabled={!rating}
                className="w-full bg-[#FFB300] text-[#111] py-3 rounded-xl font-bold hover:bg-[#FFB300]/90 disabled:opacity-40 transition-all">
                Submit Rating
              </button>
            </div>
          )}

          {isDelivered && rated && (
            <div className="p-6 border-t border-white/10 bg-[#0D0D0D] text-center">
              <p className="text-[#4CAF50] font-bold text-lg">✅ Thanks for your feedback!</p>
              <p className="text-[#9E9D99] text-sm mt-1">See you next time 🍜</p>
            </div>
          )}

          {/* Delivery address */}
          {isDelivery && (
            <div className="p-6 md:p-8 border-t border-white/10 bg-[#111111]">
              <h3 className="text-lg font-bold mb-3">📍 Delivery Location</h3>
              <div className="bg-[#0D0D0D] rounded-xl p-4 border border-white/5">
                <p className="text-[#F5F0E8] font-medium">{order.deliveryArea}</p>
                <p className="text-[#9E9D99] text-sm mt-1">
                  {order.streetAddress}{order.buildingNumber ? ` — Bldg ${order.buildingNumber}` : ''}
                </p>
                {order.deliveryNotes && (
                  <p className="text-[#FFB300] text-sm mt-2">📝 {order.deliveryNotes}</p>
                )}
              </div>
            </div>
          )}

          {/* Order items */}
          <div className="p-6 md:p-8 border-t border-white/10 bg-[#0D0D0D]">
            <h3 className="text-lg font-bold mb-4">Order Details</h3>
            <div className="space-y-3">
              {order.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-[#9E9D99]">
                  <span>{item.quantity}× {item.itemName}</span>
                  <span className="font-mono text-white">EGP {item.unitPrice * item.quantity}</span>
                </div>
              ))}
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-[#9E9D99]">
                  <span>Delivery Fee</span>
                  <span className="font-mono">EGP {order.deliveryFee}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="font-mono text-[#FFB300]">EGP {order.total}</span>
              </div>
            </div>
          </div>

        </div>

        <p className="text-center text-[#555] text-sm mt-6">
          Save your ref: <span className="font-mono text-[#9E9D99]">{orderRef}</span>
        </p>
      </div>
    </div>
  );
};
