import React, { useState, useEffect, useRef } from "react";
import { 
  Wallet, 
  Building2, 
  QrCode, 
  Copy, 
  Check, 
  CreditCard,
  Smartphone,
  Shield,
  Upload,
  Loader2,
  X
} from "lucide-react";
import { EditableText } from "../src/components/editor/EditableText";
import { useEditor } from "../src/contexts/EditorContext";
import { useWebsite } from "../src/contexts/WebsiteContext";
import { supabase } from "../src/lib/supabase";

interface PaymentContent {
  id: string;
  heading: string;
  subheading: string;
  description: string;
  gcash: {
    enabled: boolean;
    qr_code_url: string;
    account_name: string;
    account_number: string;
  };
  bank_transfer: {
    enabled: boolean;
    bank_name: string;
    account_name: string;
    account_number: string;
    additional_info?: string;
  };
  maya: {
    enabled: boolean;
    qr_code_url: string;
    account_name: string;
    account_number: string;
  };
  instructions: string;
}

const DEFAULT_PAYMENT: PaymentContent = {
  id: "1",
  heading: "Payment Options",
  subheading: "SECURE PAYMENT",
  description: "Choose your preferred payment method below. After payment, please send your proof of payment to our contact number.",
  gcash: {
    enabled: true,
    qr_code_url: "",
    account_name: "Your Business Name",
    account_number: "0917 XXX XXXX"
  },
  bank_transfer: {
    enabled: true,
    bank_name: "BDO / BPI",
    account_name: "Your Business Name",
    account_number: "1234 5678 9012",
    additional_info: ""
  },
  maya: {
    enabled: false,
    qr_code_url: "",
    account_name: "Your Business Name",
    account_number: "0917 XXX XXXX"
  },
  instructions: "After payment, kindly send a screenshot of your receipt via Viber/SMS to confirm your order."
};

export const Payment: React.FC = () => {
  const [content, setContent] = useState<PaymentContent>(DEFAULT_PAYMENT);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const { isEditing, saveField } = useEditor();
  const { websiteData, loading: websiteLoading } = useWebsite();
  
  const gcashInputRef = useRef<HTMLInputElement>(null);
  const mayaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!websiteLoading && websiteData?.content?.payment) {
      setContent({ ...DEFAULT_PAYMENT, ...websiteData.content.payment });
      setLoading(false);
    } else if (!websiteLoading) {
      setLoading(false);
    }
  }, [websiteData, websiteLoading]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text.replace(/\s/g, ''));
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleImageUpload = async (field: 'gcash' | 'maya', file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setUploadingField(field);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `payment-${field}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('images')
        .getPublicUrl(data.path);

      // Update content
      const updatedPayment = {
        ...content,
        [field]: { ...content[field], qr_code_url: urlData.publicUrl }
      };
      await saveField("payment", field, updatedPayment[field]);
      setContent(updatedPayment);
    } catch (error: any) {
      console.error("Error uploading QR code:", error);
      alert("Failed to upload image: " + (error.message || 'Unknown error'));
    } finally {
      setUploadingField(null);
    }
  };

  const handleRemoveImage = async (field: 'gcash' | 'maya') => {
    if (!window.confirm('Remove this QR code image?')) return;

    try {
      const updatedPayment = {
        ...content,
        [field]: { ...content[field], qr_code_url: '' }
      };
      await saveField("payment", field, updatedPayment[field]);
      setContent(updatedPayment);
    } catch (error: any) {
      console.error("Error removing QR code:", error);
    }
  };

  const handleFieldSave = async (
    section: 'gcash' | 'bank_transfer' | 'maya',
    field: string,
    value: string
  ) => {
    const updatedSection = { ...content[section], [field]: value };
    const updatedContent = { ...content, [section]: updatedSection };
    await saveField("payment", section, updatedSection);
    setContent(updatedContent);
  };

  if (loading) {
    return (
      <section id="payment" className="py-20 bg-bakery-light flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-bakery-text/80">Loading payment options...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="payment" className="py-20 bg-bakery-light relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-bakery-primary/10 text-bakery-primary px-4 py-2 rounded-full mb-4">
            <Shield size={16} />
            {isEditing ? (
              <EditableText
                value={content.subheading}
                onSave={async (newValue) => {
                  await saveField("payment", "subheading", newValue);
                  setContent({ ...content, subheading: newValue });
                }}
                tag="span"
                className="text-sm font-semibold tracking-wider uppercase"
              />
            ) : (
              <span className="text-sm font-semibold tracking-wider uppercase">{content.subheading}</span>
            )}
          </div>
          
          {isEditing ? (
            <EditableText
              value={content.heading}
              onSave={async (newValue) => {
                await saveField("payment", "heading", newValue);
                setContent({ ...content, heading: newValue });
              }}
              tag="h2"
              className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark mb-6"
            />
          ) : (
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark mb-6">
              {content.heading}
            </h2>
          )}
          
          {isEditing ? (
            <EditableText
              value={content.description}
              onSave={async (newValue) => {
                await saveField("payment", "description", newValue);
                setContent({ ...content, description: newValue });
              }}
              tag="p"
              className="font-sans text-lg text-bakery-text/80 max-w-2xl mx-auto"
            />
          ) : (
            <p className="font-sans text-lg text-bakery-text/80 max-w-2xl mx-auto">
              {content.description}
            </p>
          )}
        </div>

        {/* Payment Methods Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* GCash Card - Using theme primary color */}
          {content.gcash.enabled && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              {/* GCash Header - Theme colored */}
              <div className="bg-bakery-primary p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Smartphone size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">GCash</h3>
                    <p className="text-white/80 text-sm">Scan QR or Send to Number</p>
                  </div>
                </div>
              </div>
              
              {/* GCash Content */}
              <div className="p-6">
                {/* Hidden file input */}
                <input
                  ref={gcashInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload('gcash', file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                {/* QR Code Display */}
                <div className="flex flex-col items-center mb-6">
                  <div 
                    className={`relative bg-bakery-beige/50 rounded-2xl p-4 mb-4 ${isEditing ? 'cursor-pointer hover:ring-2 hover:ring-bakery-primary group' : ''}`}
                    onClick={isEditing ? () => gcashInputRef.current?.click() : undefined}
                  >
                    {uploadingField === 'gcash' ? (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <Loader2 size={48} className="animate-spin text-bakery-primary" />
                      </div>
                    ) : content.gcash.qr_code_url ? (
                      <>
                        <img 
                          src={content.gcash.qr_code_url} 
                          alt="GCash QR Code" 
                          className="w-48 h-48 object-contain rounded-lg"
                        />
                        {isEditing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage('gcash');
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="w-48 h-48 flex flex-col items-center justify-center text-bakery-text/40 border-2 border-dashed border-bakery-primary/30 rounded-lg">
                        <QrCode size={48} className="mb-2" />
                        <span className="text-sm text-center px-4">
                          {isEditing ? 'Click to upload QR Code' : 'QR Code not set'}
                        </span>
                      </div>
                    )}
                    {isEditing && content.gcash.qr_code_url && (
                      <div className="absolute inset-0 bg-bakery-dark/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-white text-center">
                          <Upload size={24} className="mx-auto mb-2" />
                          <span className="text-sm">Change QR Code</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-bakery-text/60">Scan to pay via GCash</p>
                </div>

                {/* Account Details */}
                <div className="space-y-4 bg-bakery-beige/30 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-bakery-text/60 text-sm">Account Name</span>
                    {isEditing ? (
                      <EditableText
                        value={content.gcash.account_name}
                        onSave={(newValue) => handleFieldSave('gcash', 'account_name', newValue)}
                        tag="span"
                        className="font-semibold text-bakery-dark"
                      />
                    ) : (
                      <span className="font-semibold text-bakery-dark">{content.gcash.account_name}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-bakery-text/60 text-sm">Account Number</span>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <EditableText
                          value={content.gcash.account_number}
                          onSave={(newValue) => handleFieldSave('gcash', 'account_number', newValue)}
                          tag="span"
                          className="font-mono font-semibold text-bakery-dark"
                        />
                      ) : (
                        <span className="font-mono font-semibold text-bakery-dark">{content.gcash.account_number}</span>
                      )}
                      {!isEditing && (
                        <button
                          onClick={() => copyToClipboard(content.gcash.account_number, 'gcash-number')}
                          className="p-2 hover:bg-bakery-sand rounded-lg transition-colors"
                          title="Copy number"
                        >
                          {copiedField === 'gcash-number' ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <Copy size={16} className="text-bakery-text/50" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bank Transfer Card - Using theme accent color */}
          {content.bank_transfer.enabled && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              {/* Bank Header - Theme colored (solid) */}
              <div className="bg-bakery-accent p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Building2 size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Bank Transfer</h3>
                    <p className="text-white/80 text-sm">Direct Bank Deposit</p>
                  </div>
                </div>
              </div>
              
              {/* Bank Content */}
              <div className="p-6">
                {/* Bank Icon Display */}
                <div className="flex flex-col items-center mb-6">
                  <div className="bg-bakery-beige rounded-2xl p-8 mb-4">
                    <CreditCard size={64} className="text-bakery-primary" />
                  </div>
                  <p className="text-sm text-bakery-text/60">Transfer to our bank account</p>
                </div>

                {/* Account Details */}
                <div className="space-y-4 bg-bakery-beige/30 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-bakery-text/60 text-sm">Bank</span>
                    {isEditing ? (
                      <EditableText
                        value={content.bank_transfer.bank_name}
                        onSave={(newValue) => handleFieldSave('bank_transfer', 'bank_name', newValue)}
                        tag="span"
                        className="font-semibold text-bakery-dark"
                      />
                    ) : (
                      <span className="font-semibold text-bakery-dark">{content.bank_transfer.bank_name}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-bakery-text/60 text-sm">Account Name</span>
                    {isEditing ? (
                      <EditableText
                        value={content.bank_transfer.account_name}
                        onSave={(newValue) => handleFieldSave('bank_transfer', 'account_name', newValue)}
                        tag="span"
                        className="font-semibold text-bakery-dark"
                      />
                    ) : (
                      <span className="font-semibold text-bakery-dark">{content.bank_transfer.account_name}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-bakery-text/60 text-sm">Account Number</span>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <EditableText
                          value={content.bank_transfer.account_number}
                          onSave={(newValue) => handleFieldSave('bank_transfer', 'account_number', newValue)}
                          tag="span"
                          className="font-mono font-semibold text-bakery-dark"
                        />
                      ) : (
                        <span className="font-mono font-semibold text-bakery-dark">{content.bank_transfer.account_number}</span>
                      )}
                      {!isEditing && (
                        <button
                          onClick={() => copyToClipboard(content.bank_transfer.account_number, 'bank-number')}
                          className="p-2 hover:bg-bakery-sand rounded-lg transition-colors"
                          title="Copy number"
                        >
                          {copiedField === 'bank-number' ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <Copy size={16} className="text-bakery-text/50" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  {content.bank_transfer.additional_info && (
                    <div className="pt-2 border-t border-bakery-sand">
                      <span className="text-bakery-text/60 text-sm block mb-1">Additional Info</span>
                      {isEditing ? (
                        <EditableText
                          value={content.bank_transfer.additional_info}
                          onSave={(newValue) => handleFieldSave('bank_transfer', 'additional_info', newValue)}
                          tag="p"
                          className="text-bakery-text text-sm"
                        />
                      ) : (
                        <p className="text-bakery-text text-sm">{content.bank_transfer.additional_info}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Maya Card (Optional) - Using theme colors */}
          {content.maya.enabled && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              {/* Maya Header - Theme colored */}
              <div className="bg-bakery-primary p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Wallet size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Maya</h3>
                    <p className="text-white/80 text-sm">Scan QR or Send to Number</p>
                  </div>
                </div>
              </div>
              
              {/* Maya Content */}
              <div className="p-6">
                {/* Hidden file input */}
                <input
                  ref={mayaInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload('maya', file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                {/* QR Code Display */}
                <div className="flex flex-col items-center mb-6">
                  <div 
                    className={`relative bg-bakery-beige/50 rounded-2xl p-4 mb-4 ${isEditing ? 'cursor-pointer hover:ring-2 hover:ring-bakery-accent group' : ''}`}
                    onClick={isEditing ? () => mayaInputRef.current?.click() : undefined}
                  >
                    {uploadingField === 'maya' ? (
                      <div className="w-48 h-48 flex items-center justify-center">
                        <Loader2 size={48} className="animate-spin text-bakery-accent" />
                      </div>
                    ) : content.maya.qr_code_url ? (
                      <>
                        <img 
                          src={content.maya.qr_code_url} 
                          alt="Maya QR Code" 
                          className="w-48 h-48 object-contain rounded-lg"
                        />
                        {isEditing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage('maya');
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="w-48 h-48 flex flex-col items-center justify-center text-bakery-text/40 border-2 border-dashed border-bakery-accent/30 rounded-lg">
                        <QrCode size={48} className="mb-2" />
                        <span className="text-sm text-center px-4">
                          {isEditing ? 'Click to upload QR Code' : 'QR Code not set'}
                        </span>
                      </div>
                    )}
                    {isEditing && content.maya.qr_code_url && (
                      <div className="absolute inset-0 bg-bakery-dark/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="text-white text-center">
                          <Upload size={24} className="mx-auto mb-2" />
                          <span className="text-sm">Change QR Code</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-bakery-text/60">Scan to pay via Maya</p>
                </div>

                {/* Account Details */}
                <div className="space-y-4 bg-bakery-beige/30 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-bakery-text/60 text-sm">Account Name</span>
                    {isEditing ? (
                      <EditableText
                        value={content.maya.account_name}
                        onSave={(newValue) => handleFieldSave('maya', 'account_name', newValue)}
                        tag="span"
                        className="font-semibold text-bakery-dark"
                      />
                    ) : (
                      <span className="font-semibold text-bakery-dark">{content.maya.account_name}</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-bakery-text/60 text-sm">Account Number</span>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <EditableText
                          value={content.maya.account_number}
                          onSave={(newValue) => handleFieldSave('maya', 'account_number', newValue)}
                          tag="span"
                          className="font-mono font-semibold text-bakery-dark"
                        />
                      ) : (
                        <span className="font-mono font-semibold text-bakery-dark">{content.maya.account_number}</span>
                      )}
                      {!isEditing && (
                        <button
                          onClick={() => copyToClipboard(content.maya.account_number, 'maya-number')}
                          className="p-2 hover:bg-bakery-sand rounded-lg transition-colors"
                          title="Copy number"
                        >
                          {copiedField === 'maya-number' ? (
                            <Check size={16} className="text-green-600" />
                          ) : (
                            <Copy size={16} className="text-bakery-text/50" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions Box - Theme colored */}
        <div className="bg-bakery-beige border border-bakery-primary/20 rounded-2xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-bakery-primary/10 rounded-full mb-4">
            <Wallet size={24} className="text-bakery-primary" />
          </div>
          {isEditing ? (
            <EditableText
              value={content.instructions}
              onSave={async (newValue) => {
                await saveField("payment", "instructions", newValue);
                setContent({ ...content, instructions: newValue });
              }}
              tag="p"
              className="font-sans text-bakery-dark max-w-2xl mx-auto"
            />
          ) : (
            <p className="font-sans text-bakery-dark max-w-2xl mx-auto">
              {content.instructions}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
