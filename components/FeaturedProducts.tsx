import React, { useEffect, useState } from 'react';
import { MenuItem } from '../types';
import { ShoppingBag, Star, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { supabase, getWebsiteId } from '../src/lib/supabase';
import type { Product, FeaturedProductsConfig } from '../src/types/database.types';
import { EditableText } from '../src/components/editor/EditableText';
import { useEditor } from '../src/contexts/EditorContext';

// Adapter to convert DB product to UI menu item
const adaptProduct = (dbProduct: Product): MenuItem => ({
  id: parseInt(dbProduct.id.slice(0, 8), 16), // Convert UUID to number for cart compatibility
  name: dbProduct.name,
  description: dbProduct.description || '',
  price: Number(dbProduct.price),
  category: dbProduct.category || 'product',
  image: dbProduct.image_url || 'https://picsum.photos/seed/product/800/800'
});

interface FeaturedProductsProps {
  addToCart: (item: MenuItem) => void;
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ addToCart }) => {
  const [config, setConfig] = useState<FeaturedProductsConfig | null>(null);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { isEditing, saveField } = useEditor();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const websiteId = await getWebsiteId();
      if (!websiteId) return;

      // Fetch config
      const { data: configData, error: configError } = await supabase
        .from('featured_products_config')
        .select('*')
        .eq('website_id', websiteId)
        .single();

      if (configError) throw configError;
      setConfig(configData as FeaturedProductsConfig);

      // Fetch featured products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('website_id', websiteId)
        .eq('is_featured', true)
        .eq('is_available', true)
        .order('display_order')
        .limit(configData.max_items || 6);

      if (productsError) throw productsError;
      
      // Store DB products for editing
      setDbProducts(productsData as Product[]);
      
      // Convert DB products to UI items
      const adaptedProducts = (productsData as Product[]).map(adaptProduct);
      setProducts(adaptedProducts);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="featuredProducts" className="py-24 bg-white relative flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-gray-600">Loading...</p>
        </div>
      </section>
    );
  }

  if (!config || products.length === 0) return null;

  const handleImageChange = async (item: MenuItem) => {
    const dbProduct = dbProducts.find(db => db.name === item.name);
    if (!dbProduct) {
      alert('Product not found. Please refresh the page.');
      return;
    }
    
    const newImageUrl = prompt('Enter new image URL:', dbProduct.image_url || '');
    if (newImageUrl !== null && newImageUrl !== dbProduct.image_url) {
      try {
        await saveField('products', 'image_url', newImageUrl, dbProduct.id);
        setDbProducts(dbProducts.map(db => db.id === dbProduct.id ? { ...db, image_url: newImageUrl } : db));
        setProducts(products.map(p => p.id === item.id ? { ...p, image: newImageUrl } : p));
        alert('Image saved successfully!');
      } catch (error) {
        console.error('Error saving image:', error);
        alert('Failed to save image. Please try again.');
      }
    }
  };

  return (
    <section id="featuredProducts" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            {config.subheading && (
              isEditing ? (
                <EditableText
                  value={config.subheading}
                  onSave={async (newValue) => {
                    await saveField('featured_products_config', 'subheading', newValue, config.id);
                    setConfig({ ...config, subheading: newValue });
                  }}
                  tag="span"
                  className="font-sans font-bold text-bakery-primary tracking-widest uppercase text-sm block mb-2"
                />
              ) : (
                <span className="font-sans font-bold text-bakery-primary tracking-widest uppercase text-sm block mb-2">
                  {config.subheading}
                </span>
              )
            )}
            {isEditing ? (
              <EditableText
                value={config.heading}
                onSave={async (newValue) => {
                  await saveField('featured_products_config', 'heading', newValue, config.id);
                  setConfig({ ...config, heading: newValue });
                }}
                tag="h2"
                className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark"
              />
            ) : (
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark">
                {config.heading}
              </h2>
            )}
          </div>
          <div className="flex items-center gap-2 text-bakery-dark/70 font-sans font-medium hover:text-bakery-primary transition-colors cursor-pointer group">
             <span>See all categories</span>
             <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {products.map((item) => (
             <div key={item.id} className="group flex flex-col h-full">
                {/* Image Container */}
                <div className="aspect-[4/5] w-full rounded-2xl overflow-hidden mb-6 relative shadow-md hover:shadow-xl transition-all duration-500">
                   <img 
                     src={item.image} 
                     alt={item.name}
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                   />
                   
                   {/* Badge */}
                   <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm z-10">
                      <Star size={14} className="text-bakery-accent fill-bakery-accent" />
                      <span className="text-xs font-bold font-sans text-bakery-dark tracking-wide uppercase">Top Pick</span>
                   </div>
                   
                   {/* Change Image Button */}
                   {isEditing && (
                     <div 
                       className="absolute top-4 left-4 cursor-pointer z-50"
                       onClick={() => handleImageChange(item)}
                       title="Click to change image"
                     >
                       <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-lg hover:bg-white transition-colors border-2 border-blue-500">
                         <ImageIcon size={16} className="text-gray-700" />
                         <span className="text-gray-700 font-medium text-xs">Change Image</span>
                       </div>
                     </div>
                   )}
                   
                   {/* Hover Overlay & Button */}
                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                   
                   <div className="absolute inset-x-0 bottom-0 p-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <button 
                        onClick={() => addToCart(item)}
                        className="w-full bg-white text-bakery-dark font-serif font-bold py-3.5 rounded-xl shadow-lg hover:bg-bakery-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <ShoppingBag size={18} />
                        Add to Order
                      </button>
                   </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    {isEditing ? (
                      <EditableText
                        value={item.name}
                        onSave={async (newValue) => {
                          const dbProduct = dbProducts.find(db => db.name === item.name);
                          if (dbProduct) {
                            await saveField('products', 'name', newValue, dbProduct.id);
                            setDbProducts(dbProducts.map(db => db.id === dbProduct.id ? { ...db, name: newValue } : db));
                            setProducts(products.map(p => p.id === item.id ? { ...p, name: newValue } : p));
                          }
                        }}
                        tag="h3"
                        className="font-serif text-2xl font-bold text-bakery-dark group-hover:text-bakery-primary transition-colors"
                      />
                    ) : (
                      <h3 className="font-serif text-2xl font-bold text-bakery-dark group-hover:text-bakery-primary transition-colors">
                          {item.name}
                      </h3>
                    )}
                    {isEditing ? (
                      <EditableText
                        value={item.price.toString()}
                        onSave={async (newValue) => {
                          const price = parseFloat(newValue) || 0;
                          const dbProduct = dbProducts.find(db => db.name === item.name);
                          if (dbProduct) {
                            await saveField('products', 'price', price, dbProduct.id);
                            setDbProducts(dbProducts.map(db => db.id === dbProduct.id ? { ...db, price } : db));
                            setProducts(products.map(p => p.id === item.id ? { ...p, price } : p));
                          }
                        }}
                        tag="span"
                        className="font-serif text-xl font-bold text-bakery-accent"
                      />
                    ) : (
                      <span className="font-serif text-xl font-bold text-bakery-accent">
                          ₱{item.price}
                      </span>
                    )}
                  </div>
                  {isEditing ? (
                    <EditableText
                      value={item.description}
                      onSave={async (newValue) => {
                        const dbProduct = dbProducts.find(db => db.name === item.name);
                        if (dbProduct) {
                          await saveField('products', 'description', newValue, dbProduct.id);
                          setDbProducts(dbProducts.map(db => db.id === dbProduct.id ? { ...db, description: newValue } : db));
                          setProducts(products.map(p => p.id === item.id ? { ...p, description: newValue } : p));
                        }
                      }}
                      tag="p"
                      multiline
                      className="text-gray-600 font-sans text-sm leading-relaxed line-clamp-2"
                    />
                  ) : (
                    <p className="text-gray-600 font-sans text-sm leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
             </div>
          ))}
        </div>
      </div>
    </section>
  );
};