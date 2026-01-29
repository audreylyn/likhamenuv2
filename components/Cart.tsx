import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Minus, Send, ShoppingCart } from 'lucide-react';
import { CartItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, getWebsiteId } from '../src/lib/supabase';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: number) => void;
  onUpdateQuantity: (id: number, delta: number) => void;
  onClear: () => void;
}

export const Cart: React.FC<CartProps> = ({ 
  isOpen, 
  onClose, 
  items, 
  onRemove, 
  onUpdateQuantity,
  onClear 
}) => {
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    location: '',
    message: ''
  });
  const [facebookMessengerId, setFacebookMessengerId] = useState<string | null>(null);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Load Facebook Messenger ID when cart opens
  useEffect(() => {
    if (isOpen) {
      loadFacebookMessengerId();
    }
  }, [isOpen]);

  const loadFacebookMessengerId = async () => {
    try {
      const websiteId = await getWebsiteId();
      if (!websiteId) return;

      const { data, error } = await supabase
        .from('contact_info')
        .select('facebook_messenger_id, social_links')
        .eq('website_id', websiteId)
        .single();

      if (!error && data) {
        // Check both facebook_messenger_id field and social_links.facebook_messenger
        const messengerId = data.facebook_messenger_id || 
                           (data.social_links as any)?.facebook_messenger || 
                           null;
        setFacebookMessengerId(messengerId);
      }
    } catch (error) {
      console.error('Error loading Facebook Messenger ID:', error);
    }
  };

  const handleCheckout = () => {
    if (!facebookMessengerId || items.length === 0) return;

    // Construct message for messenger (matching your working format exactly)
    const lines: string[] = [];
    lines.push('New Order Request');
    lines.push('------------------');
    lines.push('Items:');
    
    items.forEach(item => {
      const unit = item.price;
      const subtotal = unit * item.quantity;
      lines.push(`- ${item.name} x${item.quantity} @ ₱${unit} = ₱${subtotal}`);
    });
    
    lines.push('------------------');
    lines.push(`Total: ₱${total}`);
    lines.push('');
    lines.push(`Customer: ${customerDetails.name}`);
    lines.push(`Location: ${customerDetails.location}`);
    lines.push(`Note: ${customerDetails.message || 'N/A'}`);

    const fullMessage = lines.join('\n');
    const encodedMessage = encodeURIComponent(fullMessage);
    
    // Use exact same format as your working code
    // Ensure we always use HTTPS (required for m.me)
    const url = `https://m.me/${facebookMessengerId}?text=${encodedMessage}`;
    
    // Clear cart and close first (before navigation)
    onClear();
    setCustomerDetails({ name: '', location: '', message: '' });
    onClose();
    
    // Small delay to allow cart to close, then open Messenger
    // Opening in same window avoids Facebook's new window timing issues
    setTimeout(() => {
      window.location.href = url;
    }, 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col h-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-serif font-bold text-bakery-dark">Your Cart ({items.reduce((a,c) => a + c.quantity, 0)})</h2>
              </div>
              <div className="flex items-center gap-3">
                {items.length > 0 && (
                  <button 
                    onClick={onClear}
                    className="text-sm font-sans text-gray-500 hover:text-red-500 transition-colors border border-gray-200 px-3 py-1 rounded hover:border-red-200"
                  >
                    Clear
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* Items List */}
              {items.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-100 mb-8">
                  <ShoppingCart className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500 font-sans">Your cart is empty.</p>
                </div>
              ) : (
                <div className="space-y-4 mb-8">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-4 bg-white rounded-xl border border-bakery-sand/30 shadow-sm">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-serif font-bold text-bakery-dark">{item.name}</h4>
                          <span className="font-sans font-bold text-bakery-accent">₱{item.price * item.quantity}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-1">{item.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                            <button 
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="p-1 hover:bg-white rounded shadow-sm transition-all disabled:opacity-50 text-bakery-dark"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-sans font-bold text-sm w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="p-1 hover:bg-white rounded shadow-sm transition-all text-bakery-dark"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button 
                            onClick={() => onRemove(item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-100 pt-6 space-y-6">
                
                <h3 className="font-serif text-xl font-bold text-bakery-dark">Order Summary</h3>

                {/* Total */}
                <div className="flex justify-between items-end">
                  <span className="font-sans text-gray-600">Total</span>
                  <span className="font-serif text-3xl font-bold text-bakery-dark">₱{total}</span>
                </div>

                {/* Form Inputs */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-bakery-dark mb-1.5 font-serif">Name</label>
                    <input
                      type="text"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-bakery-sand bg-white focus:ring-2 focus:ring-bakery-primary/20 focus:border-bakery-primary outline-none transition-all"
                      placeholder="Enter your name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-bakery-dark mb-1.5 font-serif">Location</label>
                    <input
                      type="text"
                      value={customerDetails.location}
                      onChange={(e) => setCustomerDetails({...customerDetails, location: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-bakery-sand bg-white focus:ring-2 focus:ring-bakery-primary/20 focus:border-bakery-primary outline-none transition-all"
                      placeholder="Delivery address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-bakery-dark mb-1.5 font-serif">Message (optional)</label>
                    <textarea
                      rows={3}
                      value={customerDetails.message}
                      onChange={(e) => setCustomerDetails({...customerDetails, message: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-bakery-sand bg-white focus:ring-2 focus:ring-bakery-primary/20 focus:border-bakery-primary outline-none transition-all resize-none"
                      placeholder="Special instructions..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={handleCheckout}
                disabled={items.length === 0 || !customerDetails.name || !customerDetails.location}
                className="w-full py-4 bg-bakery-dark text-white rounded-xl font-serif font-bold text-lg hover:bg-bakery-primary transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send size={20} />
                Checkout via Messenger
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};