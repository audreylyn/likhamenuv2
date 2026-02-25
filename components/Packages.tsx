import React, { useState, useEffect } from 'react';
import {
  MessageCircle, Eye, X, Plus, Trash2, ToggleLeft, ToggleRight,
  Upload, Package, Users, CheckCircle2
} from 'lucide-react';
import type {
  ServicePackage, PackageCategory, PackagesSectionConfig, PackageInclusion
} from '../src/types/database.types';
import { EditableText } from '../src/components/editor/EditableText';
import { EditableImage } from '../src/components/editor/EditableImage';
import { useEditor } from '../src/contexts/EditorContext';
import { useWebsite } from '../src/contexts/WebsiteContext';
import { PLANS } from '../src/lib/plans';
import { ConfirmationModal } from '../src/components/ConfirmationModal';
import { useToast } from '../src/components/Toast';

const generateId = () => crypto.randomUUID?.() || Math.random().toString(36).substring(2, 9);

interface PackagesProps {}

export const Packages: React.FC<PackagesProps> = () => {
  const [config, setConfig] = useState<PackagesSectionConfig | null>(null);
  const [categories, setCategories] = useState<PackageCategory[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const { isEditing, saveField } = useEditor();
  const { websiteData, loading: websiteLoading } = useWebsite();
  const { showToast } = useToast();

  // Get messenger page ID
  const messengerPageId = (() => {
    if (!websiteData) return '';
    const messengerConfig = websiteData.messenger as any;
    if (messengerConfig?.page_id) return messengerConfig.page_id;
    const contactContent = websiteData.content?.contact as any;
    if (contactContent?.social_links?.facebook_messenger) return contactContent.social_links.facebook_messenger;
    return '';
  })();

  // Track whether we've already auto-saved defaults for this session
  const defaultsSavedRef = React.useRef(false);

  useEffect(() => {
    if (!websiteLoading && websiteData?.content?.packages) {
      const pkgContent = websiteData.content.packages as any;
      if (pkgContent.config) setConfig(pkgContent.config as PackagesSectionConfig);
      if (pkgContent.categories) setCategories(pkgContent.categories as PackageCategory[]);
      if (pkgContent.items) setPackages(pkgContent.items as ServicePackage[]);
      setLoading(false);
    } else if (!websiteLoading) {
      // No packages content exists yet — initialize with defaults so the section renders
      const now = new Date().toISOString();
      const defaultConfig: PackagesSectionConfig = {
        id: '1',
        website_id: '',
        heading: 'Our Packages',
        subheading: 'Choose the perfect package for your event',
        messenger_prefill_template: "Hi! I'm interested in {package_name} (₱{price}) for {capacity}. My event date is ___. Can you provide more details?",
        layout: 'grid',
        show_inclusions: true,
        show_capacity_badge: true,
        created_at: now,
        updated_at: now,
      };
      const defaultCategories: PackageCategory[] = [
        { id: 'pkg-cat1', website_id: '', name: '50 Pax', display_order: 1, is_visible: true, created_at: now, updated_at: now },
        { id: 'pkg-cat2', website_id: '', name: '100 Pax', display_order: 2, is_visible: true, created_at: now, updated_at: now },
      ];
      const defaultPackages: ServicePackage[] = [
        {
          id: 'pkg1', website_id: '', name: 'Starter Package',
          description: 'Perfect for intimate gatherings and small celebrations.',
          price: 10988, capacity: '50 Pax', category_id: 'pkg-cat1',
          image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80',
          is_available: true, display_order: 1, badges: ['Popular'],
          inclusions: [
            { id: 'inc1', heading: 'Venue & Setup', items: ['Tent (20ft x 30ft) with installation', 'Basic ceiling treatment & decoration', 'Mood lights & decors'] },
            { id: 'inc2', heading: 'Catering', items: ['Buffet table with skirting', '3 main course dishes', '2 side dishes', 'Rice & drinks'] },
            { id: 'inc3', heading: 'Staff', items: ['1 Event coordinator', '3 Waiters', '1 Beverage attendant'] },
          ],
          created_at: now, updated_at: now,
        },
        {
          id: 'pkg2', website_id: '', name: 'Premium Package',
          description: 'Our most popular package for mid-size events and parties.',
          price: 24988, capacity: '100 Pax', category_id: 'pkg-cat2',
          image_url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
          is_available: true, display_order: 2, badges: ['Best Value'],
          inclusions: [
            { id: 'inc4', heading: 'Venue & Setup', items: ['Tent (30ft x 40ft) with installation', 'Premium ceiling treatment', 'Drapery & themed decors', 'Stage with backdrop'] },
            { id: 'inc5', heading: 'Catering', items: ['Buffet table with full skirting', '5 main course dishes', '3 side dishes', 'Rice, drinks & dessert'] },
            { id: 'inc6', heading: 'Staff & Entertainment', items: ['1 Event host', '5 Wait staff', 'Sound system with DJ', 'Videoke machine'] },
          ],
          created_at: now, updated_at: now,
        },
      ];

      setConfig(defaultConfig);
      setCategories(defaultCategories);
      setPackages(defaultPackages);
      setLoading(false);

      // Auto-save defaults to database so they persist on public site and page reloads
      if (isEditing && !defaultsSavedRef.current) {
        defaultsSavedRef.current = true;
        (async () => {
          try {
            await saveField('packages', 'config', defaultConfig);
            await saveField('packages', 'categories', defaultCategories);
            await saveField('packages', 'items', defaultPackages);
            console.log('✅ Auto-saved default packages content to database');
          } catch (err) {
            console.error('Failed to auto-save default packages:', err);
          }
        })();
      }
    }
  }, [websiteData, websiteLoading, isEditing, saveField]);

  const filteredPackages = activeCategory === 'all'
    ? packages
    : packages.filter(pkg => pkg.category_id === activeCategory);

  const getCategoryName = (id: string) => {
    if (id === 'all') return 'All';
    return categories.find(c => c.id === id)?.name || id;
  };

  const getCategoryNameForPackage = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Package';
  };

  const handleInquire = (pkg: ServicePackage) => {
    if (!messengerPageId) {
      showToast('Messenger is not configured. Please contact us directly.', 'warning');
      return;
    }

    const template = config?.messenger_prefill_template ||
      "Hi! I'm interested in {package_name} (₱{price}) for {capacity}. My event date is ___. Can you provide more details?";

    const message = template
      .replace('{package_name}', pkg.name)
      .replace('{price}', pkg.price.toLocaleString())
      .replace('{capacity}', pkg.capacity || '');

    const encodedMessage = encodeURIComponent(message);
    const messengerUrl = `https://m.me/${messengerPageId}?text=${encodedMessage}`;
    window.open(messengerUrl, '_blank');
  };

  // --- Editor Helpers ---
  const savePackages = async (updatedList: ServicePackage[]) => {
    await saveField('packages', 'items', updatedList);
    setPackages(updatedList);
  };

  const handleDeletePackage = (pkg: ServicePackage) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Package',
      message: `Are you sure you want to delete "${pkg.name}"?`,
      onConfirm: async () => {
        try {
          await savePackages(packages.filter(p => p.id !== pkg.id));
          if (selectedPackage?.id === pkg.id) setSelectedPackage(null);
          setConfirmModal(null);
        } catch {
          setConfirmModal(null);
          showToast('Failed to delete package.', 'error');
        }
      }
    });
  };

  const handleAddPackage = async () => {
    const planId = (websiteData as any)?.marketing?.plan_id || 'basic';
    const plan = PLANS.find(p => p.id === planId);
    const limit = plan?.productLimit !== undefined ? plan.productLimit : 12;
    if (limit !== 'unlimited' && packages.length >= limit) {
      showToast(`Package limit reached (${limit}). Upgrade to add more.`, 'warning');
      return;
    }
    if (categories.length === 0) {
      showToast('Please create a category first.', 'warning');
      return;
    }

    const now = new Date().toISOString();
    const maxOrder = packages.length > 0 ? Math.max(...packages.map(p => p.display_order || 0)) : -1;
    const newPkg: ServicePackage = {
      id: generateId(),
      website_id: '',
      name: 'New Package',
      description: 'Package description',
      price: 0,
      capacity: categories[0]?.name || '',
      category_id: categories[0].id,
      image_url: '',
      is_available: true,
      display_order: maxOrder + 1,
      badges: [],
      inclusions: [
        { id: generateId(), heading: 'What\'s Included', items: ['Item 1', 'Item 2', 'Item 3'] }
      ],
      created_at: now,
      updated_at: now,
    };

    await savePackages([...packages, newPkg]);
  };

  // Inclusion editing helpers
  const addInclusionGroup = async (pkgId: string) => {
    const pkg = packages.find(p => p.id === pkgId);
    if (!pkg) return;
    const newGroup: PackageInclusion = {
      id: generateId(),
      heading: 'New Section',
      items: ['Item 1'],
    };
    const updated = packages.map(p =>
      p.id === pkgId ? { ...p, inclusions: [...(p.inclusions || []), newGroup] } : p
    );
    await savePackages(updated);
  };

  const removeInclusionGroup = async (pkgId: string, groupId: string) => {
    const updated = packages.map(p =>
      p.id === pkgId
        ? { ...p, inclusions: (p.inclusions || []).filter(g => g.id !== groupId) }
        : p
    );
    await savePackages(updated);
  };

  const updateInclusionHeading = async (pkgId: string, groupId: string, newHeading: string) => {
    const updated = packages.map(p =>
      p.id === pkgId
        ? { ...p, inclusions: (p.inclusions || []).map(g => g.id === groupId ? { ...g, heading: newHeading } : g) }
        : p
    );
    await savePackages(updated);
  };

  const updateInclusionItem = async (pkgId: string, groupId: string, itemIdx: number, newValue: string) => {
    const updated = packages.map(p =>
      p.id === pkgId
        ? {
          ...p,
          inclusions: (p.inclusions || []).map(g =>
            g.id === groupId
              ? { ...g, items: g.items.map((it, i) => i === itemIdx ? newValue : it) }
              : g
          )
        }
        : p
    );
    await savePackages(updated);
  };

  const addInclusionItem = async (pkgId: string, groupId: string) => {
    const updated = packages.map(p =>
      p.id === pkgId
        ? {
          ...p,
          inclusions: (p.inclusions || []).map(g =>
            g.id === groupId
              ? { ...g, items: [...g.items, 'New item'] }
              : g
          )
        }
        : p
    );
    await savePackages(updated);
  };

  const removeInclusionItem = async (pkgId: string, groupId: string, itemIdx: number) => {
    const updated = packages.map(p =>
      p.id === pkgId
        ? {
          ...p,
          inclusions: (p.inclusions || []).map(g =>
            g.id === groupId
              ? { ...g, items: g.items.filter((_, i) => i !== itemIdx) }
              : g
          )
        }
        : p
    );
    await savePackages(updated);
  };

  if (loading) {
    return (
      <section id="packages" className="py-20 bg-bakery-cream relative flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-bakery-text/80">Loading packages...</p>
        </div>
      </section>
    );
  }

  if (!config) return null;

  const categoryNames = ['all', ...categories.map(c => c.id)];

  return (
    <section id="packages" className="py-20 bg-gradient-to-b from-bakery-cream to-bakery-light relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          {isEditing ? (
            <EditableText
              value={config.heading}
              onSave={async (v) => {
                const c = { ...config, heading: v };
                await saveField('packages', 'config', c);
                setConfig(c);
              }}
              tag="h2"
              className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark mb-4"
            />
          ) : (
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark mb-4">
              {config.heading}
            </h2>
          )}
          <div className="w-24 h-1 bg-bakery-primary mx-auto rounded-full" />
          {config.subheading && (
            isEditing ? (
              <EditableText
                value={config.subheading}
                onSave={async (v) => {
                  const c = { ...config, subheading: v };
                  await saveField('packages', 'config', c);
                  setConfig(c);
                }}
                tag="p"
                multiline
                className="mt-4 text-bakery-dark/80 font-sans text-lg max-w-2xl mx-auto"
              />
            ) : (
              <p className="mt-4 text-bakery-dark/80 font-sans text-lg max-w-2xl mx-auto">
                {config.subheading}
              </p>
            )
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categoryNames.map((category) => {
            const isAll = category === 'all';
            const catObj = categories.find(c => c.id === category);
            return (
              <div key={category} className="relative group">
                {isEditing && !isAll && (
                  <button
                    onClick={async () => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'Delete Category',
                        message: `Delete "${getCategoryName(category)}" category?`,
                        onConfirm: async () => {
                          try {
                            const nc = categories.filter(c => c.id !== category);
                            await saveField('packages', 'categories', nc);
                            setCategories(nc);
                            if (activeCategory === category) setActiveCategory('all');
                            setConfirmModal(null);
                          } catch {
                            setConfirmModal(null);
                            showToast('Failed to delete category.', 'error');
                          }
                        }
                      });
                    }}
                    className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                )}
                <button
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-2 rounded-full font-serif font-bold text-lg capitalize transition-all duration-300 ${activeCategory === category
                    ? 'bg-bakery-primary text-white shadow-md transform scale-105'
                    : 'bg-bakery-light text-bakery-dark border border-bakery-sand hover:border-bakery-primary hover:text-bakery-primary'
                    }`}
                >
                  {isEditing && !isAll && catObj ? (
                    <EditableText
                      value={catObj.name}
                      onSave={async (v) => {
                        const nc = categories.map(c => c.id === catObj.id ? { ...c, name: v } : c);
                        await saveField('packages', 'categories', nc);
                        setCategories(nc);
                      }}
                      tag="span"
                    />
                  ) : (
                    getCategoryName(category)
                  )}
                </button>
              </div>
            );
          })}
          {isEditing && (
            <button
              onClick={async () => {
                const name = prompt('Enter category name:', 'New Category');
                if (!name) return;
                const nc: PackageCategory = {
                  id: generateId(),
                  website_id: '',
                  name,
                  display_order: categories.length,
                  is_visible: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                const updated = [...categories, nc];
                await saveField('packages', 'categories', updated);
                setCategories(updated);
              }}
              className="px-6 py-2 rounded-full font-serif font-bold text-lg bg-blue-500 text-white border-2 border-blue-600 hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> Add Category
            </button>
          )}
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          {filteredPackages.map((pkg) => {
            const isSoldOut = !pkg.is_available;
            const totalInclusions = pkg.inclusions?.reduce((sum, g) => sum + g.items.length, 0) || 0;

            return (
              <div
                key={pkg.id}
                className={`group bg-bakery-light rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col border border-bakery-sand/30 ${isSoldOut && !isEditing ? 'opacity-75' : ''}`}
              >
                {/* Image Section */}
                <div className={`relative h-52 overflow-hidden ${isSoldOut ? 'grayscale' : ''}`}>
                  {isSoldOut && !isEditing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                      <span className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider">
                        Unavailable
                      </span>
                    </div>
                  )}
                  <EditableImage
                    src={pkg.image_url || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80'}
                    alt={pkg.name}
                    onSave={async (newUrl) => {
                      const updated = packages.map(p =>
                        p.id === pkg.id ? { ...p, image_url: newUrl } : p
                      );
                      await savePackages(updated);
                    }}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Gradient overlay at bottom of image */}
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent z-[5]" />

                  {/* Capacity Badge */}
                  {config.show_capacity_badge && pkg.capacity && (
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-bakery-dark px-3 py-1.5 rounded-lg text-xs font-bold font-sans uppercase tracking-wider shadow-md flex items-center gap-1.5 z-10">
                      <Users size={12} className="text-bakery-primary" />
                      {isEditing ? (
                        <EditableText
                          value={pkg.capacity}
                          onSave={async (v) => {
                            const updated = packages.map(p =>
                              p.id === pkg.id ? { ...p, capacity: v } : p
                            );
                            await savePackages(updated);
                          }}
                          tag="span"
                        />
                      ) : pkg.capacity}
                    </div>
                  )}

                  {/* Badges */}
                  {pkg.badges && pkg.badges.length > 0 && (
                    <div className="absolute top-4 right-4 flex flex-col gap-1 z-10">
                      {pkg.badges.map((badge, i) => (
                        <span key={i} className="bg-bakery-accent text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-md">
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Package name overlay on image */}
                  <div className="absolute bottom-3 left-4 right-4 z-10">
                    {isEditing ? (
                      <EditableText
                        value={pkg.name}
                        onSave={async (v) => {
                          const updated = packages.map(p =>
                            p.id === pkg.id ? { ...p, name: v } : p
                          );
                          await savePackages(updated);
                        }}
                        tag="h3"
                        className="font-serif text-xl font-bold text-white drop-shadow-lg"
                      />
                    ) : (
                      <h3 className="font-serif text-xl font-bold text-white drop-shadow-lg">
                        {pkg.name}
                      </h3>
                    )}
                  </div>

                  {/* Category Label (editor only) */}
                  {isEditing && (
                    <div className="absolute bottom-3 right-4 bg-bakery-light/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold font-sans uppercase tracking-wider text-bakery-dark shadow-sm z-10">
                      <select
                        value={pkg.category_id}
                        onChange={async (e) => {
                          const updated = packages.map(p =>
                            p.id === pkg.id ? { ...p, category_id: e.target.value } : p
                          );
                          await savePackages(updated);
                        }}
                        className="bg-transparent border-none text-bakery-dark font-bold uppercase tracking-wider text-xs cursor-pointer outline-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Price Banner */}
                <div className="bg-gradient-to-r from-bakery-dark to-bakery-primary px-6 py-3 flex items-center justify-between">
                  <span className="text-white/80 font-sans text-sm font-medium">Price</span>
                  <div className="flex-shrink-0">
                    {isEditing ? (
                      <EditableText
                        value={pkg.price.toString()}
                        onSave={async (v) => {
                          const price = parseFloat(v) || 0;
                          const updated = packages.map(p =>
                            p.id === pkg.id ? { ...p, price } : p
                          );
                          await savePackages(updated);
                        }}
                        tag="span"
                        className="font-serif font-bold text-2xl text-white"
                      />
                    ) : (
                      <span className="font-serif font-bold text-2xl text-white">
                        ₱{pkg.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow relative">
                  {/* Editor Controls */}
                  {isEditing && (
                    <div className="absolute top-2 right-2 z-10 flex gap-2">
                      <button
                        onClick={async () => {
                          const updated = packages.map(p =>
                            p.id === pkg.id ? { ...p, is_available: !p.is_available } : p
                          );
                          await savePackages(updated);
                        }}
                        className={`rounded-full p-1.5 shadow-lg transition-colors ${pkg.is_available
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gray-400 hover:bg-gray-500 text-white'
                          }`}
                        title={pkg.is_available ? 'Available' : 'Unavailable'}
                      >
                        {pkg.is_available ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                      <button
                        onClick={() => handleDeletePackage(pkg)}
                        className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                        title="Delete package"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  {/* Description */}
                  {isEditing ? (
                    <EditableText
                      value={pkg.description || ''}
                      onSave={async (v) => {
                        const updated = packages.map(p =>
                          p.id === pkg.id ? { ...p, description: v } : p
                        );
                        await savePackages(updated);
                      }}
                      tag="p"
                      multiline
                      className="text-bakery-text/70 font-sans text-sm leading-relaxed mb-4"
                    />
                  ) : (
                    <p className="text-bakery-text/70 font-sans text-sm leading-relaxed mb-4">
                      {pkg.description}
                    </p>
                  )}

                  {/* Inclusions Summary (always visible, compact) */}
                  {config.show_inclusions && pkg.inclusions && pkg.inclusions.length > 0 && (
                    <div className="mb-4 bg-bakery-cream/60 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Package size={14} className="text-bakery-primary" />
                        <span className="font-sans font-bold text-xs uppercase tracking-wider text-bakery-dark/60">
                          What's Included
                        </span>
                      </div>
                      {pkg.inclusions.map((group) => (
                        <div key={group.id} className="flex items-center gap-2">
                          <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />
                          <span className="font-sans text-sm text-bakery-text/80">
                            <strong className="text-bakery-dark/90">{group.heading}</strong>
                            <span className="text-bakery-text/50 ml-1">({group.items.length})</span>
                          </span>
                        </div>
                      ))}
                      <button
                        onClick={() => setSelectedPackage(pkg)}
                        className="text-bakery-primary font-sans text-xs font-medium hover:text-bakery-dark transition-colors mt-1 flex items-center gap-1"
                      >
                        View all {totalInclusions} items →
                      </button>
                    </div>
                  )}

                  {/* Inclusions Editor (only in edit mode) */}
                  {isEditing && config.show_inclusions && pkg.inclusions && (
                    <div className="mb-4 border border-blue-200 rounded-lg p-3 bg-blue-50/50">
                      <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Package size={12} /> Edit Inclusions
                      </div>
                      <div className="space-y-3">
                        {pkg.inclusions.map((group) => (
                          <div key={group.id}>
                            <div className="flex items-center justify-between">
                              <EditableText
                                value={group.heading}
                                onSave={async (v) => updateInclusionHeading(pkg.id, group.id, v)}
                                tag="h4"
                                className="font-sans font-bold text-xs uppercase tracking-wider text-bakery-dark/70 mb-1"
                              />
                              <button
                                onClick={() => removeInclusionGroup(pkg.id, group.id)}
                                className="text-red-400 hover:text-red-600 p-0.5"
                              >
                                <X size={12} />
                              </button>
                            </div>
                            <ul className="space-y-1">
                              {group.items.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-1">
                                  <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                                  <input
                                    value={item}
                                    onChange={(e) => updateInclusionItem(pkg.id, group.id, idx, e.target.value)}
                                    className="flex-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none text-xs py-0.5"
                                  />
                                  <button
                                    onClick={() => removeInclusionItem(pkg.id, group.id, idx)}
                                    className="text-red-400 hover:text-red-600 p-0.5"
                                  >
                                    <X size={10} />
                                  </button>
                                </li>
                              ))}
                              <li>
                                <button
                                  onClick={() => addInclusionItem(pkg.id, group.id)}
                                  className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                                >
                                  <Plus size={10} /> Add item
                                </button>
                              </li>
                            </ul>
                          </div>
                        ))}
                        <button
                          onClick={() => addInclusionGroup(pkg.id)}
                          className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 border-t border-blue-200 pt-2"
                        >
                          <Plus size={12} /> Add section
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 mt-auto pt-3">
                    <button
                      onClick={() => setSelectedPackage(pkg)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-bakery-sand text-bakery-dark font-sans font-bold text-sm hover:border-bakery-primary hover:bg-bakery-primary hover:text-white transition-all duration-300"
                    >
                      <Eye size={16} />
                      Details
                    </button>
                    <button
                      onClick={() => !isSoldOut && handleInquire(pkg)}
                      disabled={isSoldOut}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-sans font-bold text-sm shadow-md transition-all duration-300 ${isSoldOut
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                        }`}
                    >
                      <MessageCircle size={18} />
                      {isSoldOut ? 'Unavailable' : 'Inquire'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Package Card (Editor) */}
          {isEditing && (
            <button
              onClick={handleAddPackage}
              className="bg-bakery-light rounded-2xl border-2 border-dashed border-bakery-sand/60 hover:border-bakery-primary hover:bg-bakery-cream/60 transition-colors flex flex-col items-center justify-center gap-3 p-8 h-full min-h-[400px] text-bakery-text/70 hover:text-bakery-primary"
              title="Add new package"
            >
              <Plus size={32} />
              <span className="text-lg font-medium">Add Package</span>
            </button>
          )}
        </div>
      </div>

      {/* Package Detail Modal */}
      {selectedPackage && (
        <div
          onClick={() => setSelectedPackage(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-bakery-light rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setSelectedPackage(null)}
              className="absolute top-4 right-4 bg-bakery-light/80 p-2 rounded-full text-bakery-dark hover:bg-bakery-light hover:text-red-500 transition-colors z-10"
            >
              <X size={24} />
            </button>

            {/* Hero Image */}
            <div className="h-64 relative">
              <img
                src={selectedPackage.image_url || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80'}
                alt={selectedPackage.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-6 left-6 text-white">
                {selectedPackage.capacity && (
                  <span className="inline-flex items-center gap-1 bg-bakery-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                    <Users size={12} /> {selectedPackage.capacity}
                  </span>
                )}
                <h3 className="font-serif text-3xl font-bold drop-shadow-lg">
                  {selectedPackage.name}
                </h3>
              </div>
              <div className="absolute bottom-6 right-6">
                <span className="font-serif text-3xl font-bold text-white drop-shadow-lg">
                  ₱{selectedPackage.price.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-8">
              {/* Badges */}
              {selectedPackage.badges && selectedPackage.badges.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {selectedPackage.badges.map((badge, i) => (
                    <span key={i} className="bg-bakery-accent/10 text-bakery-accent px-3 py-1 rounded-full text-xs font-bold">
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              <p className="text-bakery-text/80 font-sans leading-relaxed mb-6">
                {selectedPackage.description}
              </p>

              {/* Inclusions (always expanded in modal) */}
              {selectedPackage.inclusions && selectedPackage.inclusions.length > 0 && (
                <div className="mb-8">
                  <h4 className="font-serif text-xl font-bold text-bakery-dark mb-4 flex items-center gap-2">
                    <Package size={20} className="text-bakery-primary" />
                    Package Inclusions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedPackage.inclusions.map((group) => (
                      <div key={group.id} className="bg-bakery-cream/50 rounded-xl p-4">
                        <h5 className="font-sans font-bold text-sm uppercase tracking-wider text-bakery-primary mb-2">
                          {group.heading}
                        </h5>
                        <ul className="space-y-1.5">
                          {group.items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-bakery-text/80">
                              <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              {(() => {
                const isSoldOut = !selectedPackage.is_available;
                return (
                  <button
                    onClick={() => {
                      if (!isSoldOut) {
                        handleInquire(selectedPackage);
                        setSelectedPackage(null);
                      }
                    }}
                    disabled={isSoldOut}
                    className={`w-full py-3.5 rounded-xl font-serif font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${isSoldOut
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                      }`}
                  >
                    <MessageCircle size={20} />
                    {isSoldOut ? 'Currently Unavailable' : 'Inquire via Messenger'}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!confirmModal?.isOpen}
        title={confirmModal?.title}
        message={confirmModal?.message || ''}
        onClose={() => setConfirmModal(null)}
        onConfirm={confirmModal?.onConfirm || (() => { })}
      />
    </section>
  );
};
