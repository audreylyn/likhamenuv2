import React, { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { ShoppingBag, Eye, X, Star, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { supabase, getWebsiteId } from '../src/lib/supabase';
import type { MenuCategory, MenuItem as DBMenuItem, MenuSectionConfig } from '../src/types/database.types';
import { EditableText } from '../src/components/editor/EditableText';
import { useEditor } from '../src/contexts/EditorContext';
import { useWebsite } from '../src/contexts/WebsiteContext';

// Extended MenuItem type with rating and review_count
type MenuItemWithRating = MenuItem & { rating?: number; review_count?: number };

// Adapter to convert DB menu item to UI menu item
const adaptMenuItem = (dbItem: DBMenuItem): MenuItemWithRating => ({
  id: parseInt(dbItem.id.slice(0, 8), 16), // Convert UUID to number for cart compatibility
  name: dbItem.name,
  description: dbItem.description || '',
  price: Number(dbItem.price),
  category: dbItem.category_id as 'pastry' | 'bread' | 'cake' | 'beverage',
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
  const { contentVersion } = useWebsite();

  useEffect(() => {
    fetchMenuData();
  }, [contentVersion]); // Refetch when content version changes

  const fetchMenuData = async () => {
    try {
      const websiteId = await getWebsiteId();
      if (!websiteId) return;

      // Fetch all data in parallel (much faster!)
      const [configResult, categoriesResult, itemsResult] = await Promise.all([
        supabase
          .from('menu_section_config')
          .select('*')
          .eq('website_id', websiteId)
          .single(),
        supabase
          .from('menu_categories')
          .select('*')
          .eq('website_id', websiteId)
          .eq('is_visible', true)
          .order('display_order'),
        supabase
          .from('menu_items')
          .select('*')
          .eq('website_id', websiteId)
          .eq('is_available', true)
          .order('display_order')
      ]);

      if (configResult.error) throw configResult.error;
      setConfig(configResult.data as MenuSectionConfig);

      if (categoriesResult.error) throw categoriesResult.error;
      setCategories(categoriesResult.data as MenuCategory[]);

      if (itemsResult.error) throw itemsResult.error;
      
      // Store DB items for editing
      setDbMenuItems(itemsResult.data as DBMenuItem[]);
      
      // Convert DB items to UI items
      const adaptedItems = (itemsResult.data as DBMenuItem[]).map(adaptMenuItem);
      setMenuItems(adaptedItems);
    } catch (error) {
      console.error('Error fetching menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = activeCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  const handleAddClick = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(item);
  };

  // Helper to get category name from ID
  const getCategoryNameForItem = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Product';
  };

  const handleImageChange = async (item: MenuItem) => {
    // Find the DB item by matching the name (more reliable than ID conversion)
    const dbItem = dbMenuItems.find(db => db.name === item.name);
    if (!dbItem) {
      alert('Menu item not found. Please refresh the page.');
      return;
    }
    
    const newImageUrl = prompt('Enter new image URL:', dbItem.image_url || '');
    if (newImageUrl !== null && newImageUrl !== dbItem.image_url) {
      try {
        await saveField('menu_items', 'image_url', newImageUrl, dbItem.id);
        // Update both DB items and UI items
        setDbMenuItems(dbMenuItems.map(db => db.id === dbItem.id ? { ...db, image_url: newImageUrl } : db));
        setMenuItems(menuItems.map(p => p.name === item.name ? { ...p, image: newImageUrl } : p));
        alert('Image saved successfully!');
      } catch (error) {
        console.error('Error saving image:', error);
        alert('Failed to save image. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <section id="menu" className="py-20 bg-bakery-cream relative flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-gray-600">Loading...</p>
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
                await saveField('menu_section_config', 'heading', newValue, config.id);
                setConfig({ ...config, heading: newValue });
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
                  await saveField('menu_section_config', 'subheading', newValue, config.id);
                  setConfig({ ...config, subheading: newValue });
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
                          const { error } = await supabase
                            .from('menu_categories')
                            .delete()
                            .eq('id', category);
                          
                          if (error) throw error;
                          
                          // Remove category from local state
                          setCategories(categories.filter(c => c.id !== category));
                          // If this was the active category, switch to 'all'
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
                  className={`px-6 py-2 rounded-full font-serif font-bold text-lg capitalize transition-all duration-300 relative ${
                    activeCategory === category
                      ? 'bg-bakery-primary text-white shadow-md transform scale-105'
                      : 'bg-white text-bakery-dark border border-bakery-sand hover:border-bakery-primary hover:text-bakery-primary'
                  }`}
                >
                  {isEditing && !isAllCategory && categoryObj ? (
                    <EditableText
                      value={categoryObj.name}
                      onSave={async (newValue) => {
                        try {
                          await saveField('menu_categories', 'name', newValue, categoryObj.id);
                          setCategories(categories.map(c => c.id === categoryObj.id ? { ...c, name: newValue } : c));
                        } catch (error) {
                          console.error('Error saving category name:', error);
                          alert('Failed to save category name. Please try again.');
                        }
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
                  const websiteId = await getWebsiteId();
                  if (!websiteId) {
                    alert('No website ID found. Please refresh the page.');
                    return;
                  }

                  const categoryName = prompt('Enter category name:', 'New Category');
                  if (!categoryName) return;

                  // Get the highest display_order
                  const maxOrder = categories.length > 0 
                    ? Math.max(...categories.map(c => c.display_order || 0))
                    : -1;

                  // Insert new category
                  const { data: newCategory, error } = await supabase
                    .from('menu_categories')
                    .insert({
                      website_id: websiteId,
                      name: categoryName,
                      display_order: maxOrder + 1,
                      is_visible: true
                    } as any)
                    .select()
                    .single();

                  if (error) throw error;

                  // Add to local state
                  setCategories([...categories, newCategory as MenuCategory]);
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

        {/* Grid without Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col h-full border border-bakery-sand/30"
            >
              <div className="relative h-64 overflow-hidden cursor-pointer" onClick={() => !isEditing && setSelectedItem(item)}>
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                {/* Category Badge */}
                {isEditing ? (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold font-sans uppercase tracking-wider text-bakery-dark shadow-sm z-10">
                    <select
                      value={item.category}
                      onChange={async (e) => {
                        const newCategoryId = e.target.value;
                        const dbItem = dbMenuItems.find(db => db.name === item.name);
                        if (dbItem) {
                          try {
                            await saveField('menu_items', 'category_id', newCategoryId, dbItem.id);
                            // Update local state
                            setDbMenuItems(dbMenuItems.map(db => 
                              db.id === dbItem.id ? { ...db, category_id: newCategoryId } : db
                            ));
                            setMenuItems(menuItems.map(i => 
                              i.id === item.id ? { ...i, category: newCategoryId as any } : i
                            ));
                          } catch (error) {
                            console.error('Error updating category:', error);
                            alert('Failed to update category. Please try again.');
                          }
                        }
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
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold font-sans uppercase tracking-wider text-bakery-dark shadow-sm z-10">
                    {getCategoryNameForItem(item.category)}
                  </div>
                )}
                {/* Change Image Button */}
                {isEditing && (
                  <div 
                    className="absolute bottom-4 left-4 cursor-pointer z-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageChange(item);
                    }}
                    title="Click to change image"
                  >
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-lg hover:bg-white transition-colors border-2 border-blue-500">
                      <ImageIcon size={16} className="text-gray-700" />
                      <span className="text-gray-700 font-medium text-xs">Change Image</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 flex flex-col flex-grow relative">
                {isEditing && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
                        const dbItem = dbMenuItems.find(db => db.name === item.name);
                        if (dbItem) {
                          try {
                            const { error } = await supabase
                              .from('menu_items')
                              .delete()
                              .eq('id', dbItem.id);
                            
                            if (error) throw error;
                            
                            // Remove from local state
                            setDbMenuItems(dbMenuItems.filter(db => db.id !== dbItem.id));
                            setMenuItems(menuItems.filter(i => i.id !== item.id));
                            
                            // If this was the selected item, clear it
                            if (selectedItem && selectedItem.id === item.id) {
                              setSelectedItem(null);
                            }
                          } catch (error) {
                            console.error('Error deleting product:', error);
                            alert('Failed to delete product. Please try again.');
                          }
                        }
                      }
                    }}
                    className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                    title="Delete product"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <div className="flex justify-between items-start mb-3">
                  {isEditing ? (
                    <EditableText
                      value={item.name}
                      onSave={async (newValue) => {
                        const dbItem = dbMenuItems.find(db => db.name === item.name);
                        if (dbItem) {
                          await saveField('menu_items', 'name', newValue, dbItem.id);
                          setDbMenuItems(dbMenuItems.map(db => db.id === dbItem.id ? { ...db, name: newValue } : db));
                          setMenuItems(menuItems.map(i => i.id === item.id ? { ...i, name: newValue } : i));
                        }
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
                        const dbItem = dbMenuItems.find(db => db.name === item.name);
                        if (dbItem) {
                          await saveField('menu_items', 'price', price, dbItem.id);
                          setDbMenuItems(dbMenuItems.map(db => db.id === dbItem.id ? { ...db, price } : db));
                          setMenuItems(menuItems.map(i => i.id === item.id ? { ...i, price } : i));
                        }
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
                      const dbItem = dbMenuItems.find(db => db.name === item.name);
                      if (dbItem) {
                        await saveField('menu_items', 'description', newValue, dbItem.id);
                        setDbMenuItems(dbMenuItems.map(db => db.id === dbItem.id ? { ...db, description: newValue } : db));
                        setMenuItems(menuItems.map(i => i.id === item.id ? { ...i, description: newValue } : i));
                      }
                    }}
                    tag="p"
                    multiline
                    className="text-gray-600 font-sans text-sm leading-relaxed mb-6 flex-grow border-b border-bakery-sand/20 pb-4"
                  />
                ) : (
                  <p className="text-gray-600 font-sans text-sm leading-relaxed mb-6 flex-grow border-b border-bakery-sand/20 pb-4">
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
                    onClick={(e) => handleAddClick(item, e)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-bakery-dark text-white font-sans font-bold text-sm hover:bg-bakery-accent shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <ShoppingBag size={18} />
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
          {isEditing && (
            <button
              onClick={async () => {
                try {
                  const websiteId = await getWebsiteId();
                  if (!websiteId) {
                    alert('No website ID found. Please refresh the page.');
                    return;
                  }

                  // Get default category (first category or prompt)
                  const defaultCategoryId = categories.length > 0 ? categories[0].id : null;
                  if (!defaultCategoryId) {
                    alert('Please create a category first before adding products.');
                    return;
                  }

                  // Get the highest display_order
                  const maxOrder = dbMenuItems.length > 0 
                    ? Math.max(...dbMenuItems.map(item => item.display_order || 0))
                    : -1;

                  // Insert new menu item
                  const { data: newItem, error } = await supabase
                    .from('menu_items')
                    .insert({
                      website_id: websiteId,
                      category_id: defaultCategoryId,
                      name: 'New Product',
                      description: 'Product description',
                      price: 0,
                      is_available: true,
                      is_popular: false,
                      display_order: maxOrder + 1,
                      rating: 5,
                      review_count: 0
                    } as any)
                    .select()
                    .single();

                  if (error) throw error;

                  // Add to local state
                  const adaptedItem = adaptMenuItem(newItem as DBMenuItem);
                  setDbMenuItems([...dbMenuItems, newItem as DBMenuItem]);
                  setMenuItems([...menuItems, adaptedItem]);
                } catch (error) {
                  console.error('Error adding product:', error);
                  alert('Failed to add product. Please try again.');
                }
              }}
              className="bg-white rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-3 p-8 h-full min-h-[400px] text-gray-500 hover:text-blue-600"
              title="Add new product"
            >
              <Plus size={32} />
              <span className="text-lg font-medium">Add Product</span>
            </button>
          )}
        </div>

      </div>

      {/* Product Detail Modal without Animation */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 bg-white/80 p-2 rounded-full text-bakery-dark hover:bg-white hover:text-red-500 transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="grid md:grid-cols-2">
              <div className="h-64 md:h-full relative">
                <img 
                  src={selectedItem.image} 
                  alt={selectedItem.name} 
                  className="w-full h-full object-cover"
                />
                {isEditing && (
                  <div 
                    className="absolute bottom-4 left-4 cursor-pointer z-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImageChange(selectedItem);
                    }}
                    title="Click to change image"
                  >
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-lg hover:bg-white transition-colors border-2 border-blue-500">
                      <ImageIcon size={16} className="text-gray-700" />
                      <span className="text-gray-700 font-medium text-xs">Change Image</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-8 flex flex-col justify-center bg-bakery-cream/30">
                <div className="mb-2">
                  {isEditing ? (
                    <select
                      value={selectedItem.category}
                      onChange={async (e) => {
                        const newCategoryId = e.target.value;
                        const dbItem = dbMenuItems.find(db => db.name === selectedItem.name);
                        if (dbItem) {
                          try {
                            await saveField('menu_items', 'category_id', newCategoryId, dbItem.id);
                            // Update local state
                            setDbMenuItems(dbMenuItems.map(db => 
                              db.id === dbItem.id ? { ...db, category_id: newCategoryId } : db
                            ));
                            setSelectedItem({ ...selectedItem, category: newCategoryId as any });
                            setMenuItems(menuItems.map(i => 
                              i.id === selectedItem.id ? { ...i, category: newCategoryId as any } : i
                            ));
                          } catch (error) {
                            console.error('Error updating category:', error);
                            alert('Failed to update category. Please try again.');
                          }
                        }
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
                          const dbItem = dbMenuItems.find(db => db.name === selectedItem.name);
                          if (dbItem) {
                            try {
                              await saveField('menu_items', 'rating', newRating, dbItem.id);
                              setSelectedItem({ ...selectedItem, rating: newRating });
                              // Update in menuItems array too
                              setMenuItems(menuItems.map(item => 
                                item.id === selectedItem.id ? { ...item, rating: newRating } : item
                              ));
                            } catch (error) {
                              console.error('Error saving rating:', error);
                              alert('Failed to save rating. Please try again.');
                            }
                          }
                        } : undefined}
                      />
                    ))}
                    {isEditing ? (
                      <EditableText
                        value={`(${selectedItem.review_count || 24} reviews)`}
                        onSave={async (newValue) => {
                          // Extract number from string like "(24 reviews)"
                          const match = newValue.match(/(\d+)/);
                          const reviewCount = match ? parseInt(match[1], 10) : 24;
                          const dbItem = dbMenuItems.find(db => db.name === selectedItem.name);
                          if (dbItem) {
                            try {
                              await saveField('menu_items', 'review_count', reviewCount, dbItem.id);
                              setSelectedItem({ ...selectedItem, review_count: reviewCount });
                              // Update in menuItems array too
                              setMenuItems(menuItems.map(item => 
                                item.id === selectedItem.id ? { ...item, review_count: reviewCount } : item
                              ));
                            } catch (error) {
                              console.error('Error saving review count:', error);
                              alert('Failed to save review count. Please try again.');
                            }
                          }
                        }}
                        tag="span"
                        className="text-gray-500 text-sm font-sans ml-2"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm font-sans ml-2">
                        ({selectedItem.review_count || 24} reviews)
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 font-sans leading-relaxed mb-6">
                  {selectedItem.description}
                </p>

                <div className="flex items-center justify-between mb-8 pt-6 border-t border-bakery-sand/50">
                  <span className="font-serif text-3xl font-bold text-bakery-dark">
                    ₱{selectedItem.price}
                  </span>
                </div>

                <button 
                  onClick={() => {
                    addToCart(selectedItem);
                    setSelectedItem(null);
                  }}
                  className="w-full py-3.5 bg-bakery-primary text-white rounded-xl font-serif font-bold text-lg hover:bg-bakery-dark hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={20} />
                  Add to Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};