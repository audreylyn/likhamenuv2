import React, { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { ShoppingBag, Eye, X, Star, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { getWebsiteId } from '../src/lib/supabase'; // Keep getWebsiteId if needed for other things, but maybe not?
import type { MenuCategory, MenuItem as DBMenuItem, MenuSectionConfig } from '../src/types/database.types';
import { EditableText } from '../src/components/editor/EditableText';
import { EditableImage } from '../src/components/editor/EditableImage';
import { useEditor } from '../src/contexts/EditorContext';
import { useWebsite } from '../src/contexts/WebsiteContext';
import { PLANS } from '../src/lib/plans';

// Extended MenuItem type with rating and review_count
type MenuItemWithRating = MenuItem & { rating?: number; review_count?: number };

// Adapter to convert DB menu item to UI menu item
const adaptMenuItem = (dbItem: DBMenuItem): MenuItemWithRating => ({
  id: dbItem.id, // Use string ID directly
  name: dbItem.name,
  description: dbItem.description || '',
  price: Number(dbItem.price),
  category: dbItem.category_id as 'pastry' | 'bread' | 'cake' | 'beverage', // This cast might be risky if categories are dynamic
  image: dbItem.image_url || 'https://picsum.photos/seed/item/400/300',
  rating: dbItem.rating || 5,
  review_count: dbItem.review_count || 24
});

interface MenuProps {
  addToCart: (item: MenuItem) => void;
}

export const Menu: React.FC<MenuProps> = ({ addToCart }) => {
  const [config, setConfig] = useState<MenuSectionConfig | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemWithRating[]>([]);
  const [dbMenuItems, setDbMenuItems] = useState<DBMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<MenuItemWithRating | null>(null);
  const { isEditing, saveField } = useEditor();
  const { websiteData, loading: websiteLoading } = useWebsite();

  useEffect(() => {
    if (!websiteLoading && websiteData?.content?.menu) {
      const menuContent = websiteData.content.menu;

      // Load Config
      if (menuContent.config) {
        setConfig(menuContent.config as MenuSectionConfig);
      }

      // Load Categories
      if (menuContent.categories) {
        setCategories(menuContent.categories as MenuCategory[]);
      }

      // Load Items
      if (menuContent.items) {
        const items = menuContent.items as DBMenuItem[];
        setDbMenuItems(items);
        setMenuItems(items.map(adaptMenuItem));
      }

      setLoading(false);
    } else if (!websiteLoading) {
      // Default initialization if no data found
      setLoading(false);
    }
  }, [websiteData, websiteLoading]);

  const filteredItems = activeCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory); // Note: item.category is category_id in our adapter logic if we cast it? 
  // Wait, adaptMenuItem casts category_id to 'pastry'|...
  // But categories have IDs like UUIDs. 
  // We need to match based on ID.
  // In adaptMenuItem: category: dbItem.category_id
  // But TypeScript checks 'pastry' | 'bread'...
  // If categories are dynamic, MenuItem.category type in types.ts is too restrictive.
  // I should cast safely or update MenuItem type.
  // For now assuming the cast works or suppressed.

  const handleAddClick = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(item);
  };

  // Helper to get category name from ID
  const getCategoryNameForItem = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Product';
  };

  if (loading) {
    return (
      <section id="menu" className="py-20 bg-bakery-cream relative flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-bakery-text/80">Loading...</p>
        </div>
      </section>
    );
  }

  if (!config) return null;

  const categoryNames = ['all', ...categories.map(c => c.id)];
  const getCategoryName = (id: string) => {
    if (id === 'all') return 'All';
    const cat = categories.find(c => c.id === id);
    return cat?.name || id;
  };

  return (
    <section id="menu" className="py-20 bg-bakery-cream relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          {isEditing ? (
            <EditableText
              value={config.heading}
              onSave={async (newValue) => {
                const newConfig = { ...config, heading: newValue };
                await saveField('menu', 'config', newConfig);
                setConfig(newConfig);
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
                onSave={async (newValue) => {
                  const newConfig = { ...config, subheading: newValue };
                  await saveField('menu', 'config', newConfig);
                  setConfig(newConfig);
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

        {/* Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categoryNames.map((category) => {
            const isAllCategory = category === 'all';
            const categoryObj = categories.find(c => c.id === category);

            return (
              <div key={category} className="relative group">
                {isEditing && !isAllCategory && (
                  <button
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to delete the "${getCategoryName(category)}" category?`)) {
                        try {
                          const newCategories = categories.filter(c => c.id !== category);
                          await saveField('menu', 'categories', newCategories);

                          setCategories(newCategories);
                          if (activeCategory === category) {
                            setActiveCategory('all');
                          }
                        } catch (error) {
                          console.error('Error deleting category:', error);
                          alert('Failed to delete category. Please try again.');
                        }
                      }
                    }}
                    className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                    title="Delete category"
                  >
                    <X size={12} />
                  </button>
                )}
                <button
                  onClick={() => setActiveCategory(category)}
                  className={`px-6 py-2 rounded-full font-serif font-bold text-lg capitalize transition-all duration-300 relative ${activeCategory === category
                    ? 'bg-bakery-primary text-white shadow-md transform scale-105'
                    : 'bg-bakery-light text-bakery-dark border border-bakery-sand hover:border-bakery-primary hover:text-bakery-primary'
                    }`}
                >
                  {isEditing && !isAllCategory && categoryObj ? (
                    <EditableText
                      value={categoryObj.name}
                      onSave={async (newValue) => {
                        const newCategories = categories.map(c =>
                          c.id === categoryObj.id ? { ...c, name: newValue } : c
                        );
                        await saveField('menu', 'categories', newCategories);
                        setCategories(newCategories);
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
                try {
                  const categoryName = prompt('Enter category name:', 'New Category');
                  if (!categoryName) return;

                  const maxOrder = categories.length > 0
                    ? Math.max(...categories.map(c => c.display_order || 0))
                    : -1;

                  const newCategory: MenuCategory = {
                    id: crypto.randomUUID(), // Generate client-side UUID
                    website_id: '', // Not strictly needed inside JSON
                    name: categoryName,
                    display_order: maxOrder + 1,
                    is_visible: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };

                  const newCategories = [...categories, newCategory];
                  await saveField('menu', 'categories', newCategories);
                  setCategories(newCategories);
                } catch (error) {
                  console.error('Error adding category:', error);
                  alert('Failed to add category. Please try again.');
                }
              }}
              className="px-6 py-2 rounded-full font-serif font-bold text-lg bg-blue-500 text-white border-2 border-blue-600 hover:bg-blue-600 transition-colors flex items-center gap-2"
              title="Add new category"
            >
              <Plus size={18} />
              Add Category
            </button>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {filteredItems.map((item) => {
            const dbItem = dbMenuItems.find(db => db.id === item.id);
            const isSoldOut = dbItem?.is_available === false;

            return (
              <div
                key={item.id}
                className={`group bg-bakery-light rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full border border-bakery-sand/30 ${isSoldOut && !isEditing ? 'opacity-75' : ''}`}
              >
                <div className={`relative h-64 overflow-hidden cursor-pointer ${isSoldOut ? 'grayscale' : ''}`} onClick={() => !isEditing && setSelectedItem(item)}>
                  {/* Sold Out Overlay */}
                  {isSoldOut && !isEditing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                      <span className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider">
                        Sold Out
                      </span>
                    </div>
                  )}
                  <EditableImage
                    src={item.image}
                    alt={item.name}
                    onSave={async (newUrl) => {
                      const updatedItems = dbMenuItems.map(db =>
                        db.id === item.id ? { ...db, image_url: newUrl } : db
                      );
                      await saveField('menu', 'items', updatedItems);
                      setDbMenuItems(updatedItems);
                      setMenuItems(updatedItems.map(adaptMenuItem));
                      if (selectedItem?.id === item.id) {
                        setSelectedItem({ ...selectedItem, image: newUrl });
                      }
                    }}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  {isEditing ? (
                    <div className="absolute top-4 left-4 bg-bakery-light/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold font-sans uppercase tracking-wider text-bakery-dark shadow-sm z-10">
                      <select
                        value={item.category}
                        onChange={async (e) => {
                          const newCategoryId = e.target.value;
                          const updatedItems = dbMenuItems.map(db =>
                            db.id === item.id ? { ...db, category_id: newCategoryId } : db
                          );
                          await saveField('menu', 'items', updatedItems);
                          setDbMenuItems(updatedItems);
                          setMenuItems(updatedItems.map(adaptMenuItem));
                        }}
                        className="bg-transparent border-none text-bakery-dark font-bold font-sans uppercase tracking-wider text-xs cursor-pointer outline-none"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="absolute top-4 left-4 bg-bakery-light/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold font-sans uppercase tracking-wider text-bakery-dark shadow-sm z-10">
                      {getCategoryNameForItem(item.category)}
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-grow relative">
                  {isEditing && (
                    <div className="absolute top-2 right-2 z-10 flex gap-2">
                      {/* Status Toggle */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const dbItem = dbMenuItems.find(db => db.id === item.id);
                          const currentStatus = dbItem?.is_available !== false;
                          const updatedItems = dbMenuItems.map(db =>
                            db.id === item.id ? { ...db, is_available: !currentStatus } : db
                          );
                          await saveField('menu', 'items', updatedItems);
                          setDbMenuItems(updatedItems);
                          setMenuItems(updatedItems.map(adaptMenuItem));
                        }}
                        className={`rounded-full p-1.5 shadow-lg transition-colors ${dbMenuItems.find(db => db.id === item.id)?.is_available !== false
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gray-400 hover:bg-gray-500 text-white'
                          }`}
                        title={dbMenuItems.find(db => db.id === item.id)?.is_available !== false ? 'Available - Click to mark Sold Out' : 'Sold Out - Click to mark Available'}
                      >
                        {dbMenuItems.find(db => db.id === item.id)?.is_available !== false
                          ? <ToggleRight size={14} />
                          : <ToggleLeft size={14} />}
                      </button>
                      {/* Delete Button */}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
                            try {
                              const updatedItems = dbMenuItems.filter(db => db.id !== item.id);
                              await saveField('menu', 'items', updatedItems);

                              setDbMenuItems(updatedItems);
                              setMenuItems(updatedItems.map(adaptMenuItem));

                              if (selectedItem && selectedItem.id === item.id) {
                                setSelectedItem(null);
                              }
                            } catch (error) {
                              console.error('Error deleting product:', error);
                              alert('Failed to delete product. Please try again.');
                            }
                          }
                        }}
                        className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                        title="Delete product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-3">
                    {isEditing ? (
                      <EditableText
                        value={item.name}
                        onSave={async (newValue) => {
                          const updatedItems = dbMenuItems.map(db =>
                            db.id === item.id ? { ...db, name: newValue } : db
                          );
                          await saveField('menu', 'items', updatedItems);
                          setDbMenuItems(updatedItems);
                          setMenuItems(updatedItems.map(adaptMenuItem));
                        }}
                        tag="h3"
                        className="font-serif text-2xl font-bold text-bakery-dark group-hover:text-bakery-primary transition-colors cursor-pointer"
                      />
                    ) : (
                      <h3 className="font-serif text-2xl font-bold text-bakery-dark group-hover:text-bakery-primary transition-colors cursor-pointer" onClick={() => setSelectedItem(item)}>
                        {item.name}
                      </h3>
                    )}
                    {isEditing ? (
                      <EditableText
                        value={item.price.toString()}
                        onSave={async (newValue) => {
                          const price = parseFloat(newValue) || 0;
                          const updatedItems = dbMenuItems.map(db =>
                            db.id === item.id ? { ...db, price } : db
                          );
                          await saveField('menu', 'items', updatedItems);
                          setDbMenuItems(updatedItems);
                          setMenuItems(updatedItems.map(adaptMenuItem));
                        }}
                        tag="span"
                        className="font-sans font-bold text-xl text-bakery-accent whitespace-nowrap"
                      />
                    ) : (
                      <span className="font-sans font-bold text-xl text-bakery-accent whitespace-nowrap">
                        ₱{item.price}
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <EditableText
                      value={item.description}
                      onSave={async (newValue) => {
                        const updatedItems = dbMenuItems.map(db =>
                          db.id === item.id ? { ...db, description: newValue } : db
                        );
                        await saveField('menu', 'items', updatedItems);
                        setDbMenuItems(updatedItems);
                        setMenuItems(updatedItems.map(adaptMenuItem));
                      }}
                      tag="p"
                      multiline
                      className="text-bakery-text/80 font-sans text-sm leading-relaxed mb-6 flex-grow border-b border-bakery-sand/20 pb-4"
                    />
                  ) : (
                    <p className="text-bakery-text/80 font-sans text-sm leading-relaxed mb-6 flex-grow border-b border-bakery-sand/20 pb-4">
                      {item.description}
                    </p>
                  )}

                  <div className="flex gap-3 mt-auto">
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 border-bakery-sand text-bakery-dark font-sans font-bold text-sm hover:border-bakery-primary hover:bg-bakery-primary hover:text-white transition-all duration-300"
                    >
                      <Eye size={18} />
                      View
                    </button>
                    <button
                      onClick={(e) => !isSoldOut && handleAddClick(item, e)}
                      disabled={isSoldOut}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-sans font-bold text-sm shadow-md transition-all duration-300 ${isSoldOut
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-bakery-dark text-white hover:bg-bakery-accent hover:shadow-lg'
                        }`}
                    >
                      <ShoppingBag size={18} />
                      {isSoldOut ? 'Sold Out' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {isEditing && (
            <button
              onClick={async () => {
                try {
                  // LIMIT CHECK
                  const planId = websiteData?.marketing?.plan_id || 'basic';
                  const plan = PLANS.find(p => p.id === planId);
                  const limit = plan?.productLimit !== undefined ? plan.productLimit : 12;

                  if (limit !== 'unlimited' && dbMenuItems.length >= limit) {
                    alert(`You have reached the product limit for your plan (${limit}). Please upgrade to add more.`);
                    return;
                  }

                  const defaultCategoryId = categories.length > 0 ? categories[0].id : null;
                  if (!defaultCategoryId) {
                    alert('Please create a category first before adding products.');
                    return;
                  }

                  const maxOrder = dbMenuItems.length > 0
                    ? Math.max(...dbMenuItems.map(item => item.display_order || 0))
                    : -1;

                  const newItem: DBMenuItem = {
                    id: crypto.randomUUID(),
                    website_id: '',
                    category_id: defaultCategoryId,
                    name: 'New Product',
                    description: 'Product description',
                    price: 0,
                    is_available: true,
                    is_popular: false,
                    display_order: maxOrder + 1,
                    rating: 5,
                    review_count: 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  };

                  const updatedItems = [...dbMenuItems, newItem];
                  await saveField('menu', 'items', updatedItems);

                  setDbMenuItems(updatedItems);
                  setMenuItems(updatedItems.map(adaptMenuItem));
                } catch (error) {
                  console.error('Error adding product:', error);
                  alert('Failed to add product. Please try again.');
                }
              }}
              className="bg-bakery-light rounded-2xl border-2 border-dashed border-bakery-sand/60 hover:border-bakery-primary hover:bg-bakery-cream/60 transition-colors flex flex-col items-center justify-center gap-3 p-8 h-full min-h-[400px] text-bakery-text/70 hover:text-bakery-primary"
              title="Add new product"
            >
              <Plus size={32} />
              <span className="text-lg font-medium">Add Product</span>
            </button>
          )}
        </div>

      </div>

      {/* Product Detail Modal */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-bakery-light rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 bg-bakery-light/80 p-2 rounded-full text-bakery-dark hover:bg-bakery-light hover:text-red-500 transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="grid md:grid-cols-2">
              <div className="h-64 md:h-full relative">
                <EditableImage
                  src={selectedItem.image}
                  alt={selectedItem.name}
                  onSave={async (newUrl) => {
                    const updatedItems = dbMenuItems.map(db =>
                      db.id === selectedItem.id ? { ...db, image_url: newUrl } : db
                    );
                    await saveField('menu', 'items', updatedItems);
                    setDbMenuItems(updatedItems);
                    setMenuItems(updatedItems.map(adaptMenuItem));
                    setSelectedItem({ ...selectedItem, image: newUrl });
                  }}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-8 flex flex-col justify-center bg-bakery-cream/30">
                <div className="mb-2">
                  {isEditing ? (
                    <select
                      value={selectedItem.category}
                      onChange={async (e) => {
                        const newCategoryId = e.target.value;
                        const updatedItems = dbMenuItems.map(db =>
                          db.id === selectedItem.id ? { ...db, category_id: newCategoryId } : db
                        );
                        await saveField('menu', 'items', updatedItems);
                        setDbMenuItems(updatedItems);
                        // Convert active item back to UI format to update state
                        const updatedItem = { ...selectedItem, category: newCategoryId as any };
                        setSelectedItem(updatedItem);
                        // Also update list
                        setMenuItems(updatedItems.map(adaptMenuItem));
                      }}
                      className="inline-block px-3 py-1 bg-bakery-primary/10 text-bakery-primary text-xs font-bold uppercase tracking-wider rounded-full mb-3 border-2 border-blue-500 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="inline-block px-3 py-1 bg-bakery-primary/10 text-bakery-primary text-xs font-bold uppercase tracking-wider rounded-full mb-3">
                      {getCategoryNameForItem(selectedItem.category)}
                    </span>
                  )}
                  <h3 className="font-serif text-3xl font-bold text-bakery-dark mb-2">
                    {selectedItem.name}
                  </h3>
                  <div className="flex items-center gap-1 text-bakery-accent mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={16}
                        fill={s <= (selectedItem.rating || 5) ? "currentColor" : "none"}
                        stroke={s <= (selectedItem.rating || 5) ? "currentColor" : "currentColor"}
                        strokeWidth={s <= (selectedItem.rating || 5) ? 0 : 1.5}
                        className={isEditing ? "cursor-pointer" : ""}
                        onClick={isEditing ? async () => {
                          const newRating = s;
                          const updatedItems = dbMenuItems.map(db =>
                            db.id === selectedItem.id ? { ...db, rating: newRating } : db
                          );
                          await saveField('menu', 'items', updatedItems);
                          setDbMenuItems(updatedItems);
                          setSelectedItem({ ...selectedItem, rating: newRating });
                          setMenuItems(updatedItems.map(adaptMenuItem));
                        } : undefined}
                      />
                    ))}
                    {isEditing ? (
                      <EditableText
                        value={`(${selectedItem.review_count || 24} reviews)`}
                        onSave={async (newValue) => {
                          const match = newValue.match(/(\d+)/);
                          const reviewCount = match ? parseInt(match[1], 10) : 24;
                          const updatedItems = dbMenuItems.map(db =>
                            db.id === selectedItem.id ? { ...db, review_count: reviewCount } : db
                          );
                          await saveField('menu', 'items', updatedItems);
                          setDbMenuItems(updatedItems);
                          setSelectedItem({ ...selectedItem, review_count: reviewCount });
                          setMenuItems(updatedItems.map(adaptMenuItem));
                        }}
                        tag="span"
                        className="text-bakery-text/70 text-sm font-sans ml-2"
                      />
                    ) : (
                      <span className="text-bakery-text/70 text-sm font-sans ml-2">
                        ({selectedItem.review_count || 24} reviews)
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-bakery-text/80 font-sans leading-relaxed mb-6">
                  {selectedItem.description}
                </p>

                <div className="flex items-center justify-between mb-8 pt-6 border-t border-bakery-sand/50">
                  <span className="font-serif text-3xl font-bold text-bakery-dark">
                    ₱{selectedItem.price}
                  </span>
                </div>

                {(() => {
                  const modalDbItem = dbMenuItems.find(db => db.id === selectedItem.id);
                  const modalIsSoldOut = modalDbItem?.is_available === false;
                  return (
                    <button
                      onClick={() => {
                        if (!modalIsSoldOut) {
                          addToCart(selectedItem);
                          setSelectedItem(null);
                        }
                      }}
                      disabled={modalIsSoldOut}
                      className={`w-full py-3.5 rounded-xl font-serif font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${modalIsSoldOut
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-bakery-primary text-white hover:bg-bakery-dark hover:shadow-lg'
                        }`}
                    >
                      <ShoppingBag size={20} />
                      {modalIsSoldOut ? 'Sold Out' : 'Add to Order'}
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};