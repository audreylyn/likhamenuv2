import React, { useEffect, useState } from "react";
import { MenuItem } from "../types";
import {
  ShoppingBag,
  Star,
  ArrowRight,
} from "lucide-react";
import type {
  Product,
  FeaturedProductsConfig,
} from "../src/types/database.types";
import { EditableText } from "../src/components/editor/EditableText";
import { EditableImage } from "../src/components/editor/EditableImage";
import { useEditor } from "../src/contexts/EditorContext";
import { useWebsite } from "../src/contexts/WebsiteContext";

// Simple ID generator to avoid uuid dependency
const generateId = () => Math.random().toString(36).substring(2, 9);

// Adapter to convert DB product to UI menu item
const adaptProduct = (dbProduct: Product): MenuItem => ({
  // Use a hash of the UUID or just parse int if possible, or use a consistent way.
  // Original code tried parsing int from hex slice, which is risky for collisions but maybe okay for UI keys.
  // Better to use string IDs in UI if possible, but MenuItem interface likely expects number id.
  // Let's stick to the existing logic for compatibility but handle string IDs safely if needed.
  id: parseInt(dbProduct.id.slice(0, 8), 16) || Math.floor(Math.random() * 10000000),
  name: dbProduct.name,
  description: dbProduct.description || "",
  price: Number(dbProduct.price),
  // Cast category to any to satisfy MenuItem strict type, or ensure DB categories match
  category: (dbProduct.category as any) || "product",
  image:
    dbProduct.image_url || "https://picsum.photos/seed/product/800/800",
});

interface FeaturedProductsProps {
  addToCart: (item: MenuItem) => void;
}

// Default content
const DEFAULT_PRODUCTS_CONFIG: FeaturedProductsConfig = {
  id: "featured-config",
  website_id: "",
  heading: "Featured Delights",
  subheading: "FRESH FROM THE OVEN",
  max_items: 6,
  layout: "grid",
  show_add_to_cart: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: generateId(),
    website_id: "",
    name: "Sourdough Bread",
    description: "Traditional sourdough with a crispy crust and chewy center.",
    price: 250,
    image_url:
      "https://images.unsplash.com/photo-1585478402494-5465e349a8fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Bread",
    is_featured: true,
    is_available: true,
    display_order: 1,
    badges: [],
    nutritional_info: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    website_id: "",
    name: "Croissants",
    description: "Buttery, flaky, and golden brown croissants made fresh daily.",
    price: 120,
    image_url:
      "https://images.unsplash.com/photo-1555507036-ab1f4038808a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Pastry",
    is_featured: true,
    is_available: true,
    display_order: 2,
    badges: [],
    nutritional_info: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: generateId(),
    website_id: "",
    name: "Chocolate Cake",
    description: "Decadent chocolate cake with rich ganache frosting.",
    price: 1500,
    image_url:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Cake",
    is_featured: true,
    is_available: true,
    display_order: 3,
    badges: [],
    nutritional_info: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  addToCart,
}) => {
  const [config, setConfig] = useState<FeaturedProductsConfig | null>(null);
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { isEditing, saveField } = useEditor();
  const { websiteData, loading: websiteLoading, contentVersion } = useWebsite();

  useEffect(() => {
    if (!websiteLoading) {
      setLoading(false);
      if (websiteData?.content?.featuredProducts) {
        setConfig(
          websiteData.content.featuredProducts.config || DEFAULT_PRODUCTS_CONFIG,
        );
        const fetchedDbProducts =
          websiteData.content.featuredProducts.products || [];
        setDbProducts(fetchedDbProducts);
        setProducts(fetchedDbProducts.map(adaptProduct));
      } else {
        setConfig(DEFAULT_PRODUCTS_CONFIG);
        setDbProducts(DEFAULT_PRODUCTS);
        setProducts(DEFAULT_PRODUCTS.map(adaptProduct));
      }
    }
  }, [websiteData?.content?.featuredProducts, websiteLoading, contentVersion]);

  if (loading) {
    return (
      <section
        id="featuredProducts"
        className="py-24 bg-bakery-light relative flex items-center justify-center min-h-[400px]"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-bakery-text/80">Loading...</p>
        </div>
      </section>
    );
  }

  if (!config || products.length === 0) return null;

  return (
    <section id="featuredProducts" className="py-24 bg-bakery-light relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-16 gap-6">
          <div className="max-w-2xl">
            {config.subheading &&
              (isEditing ? (
                <EditableText
                  value={config.subheading}
                  onSave={async (newValue) => {
                    const updatedConfig = { ...config, subheading: newValue };
                    await saveField(
                      "featuredProducts",
                      "config",
                      updatedConfig,
                    );
                    setConfig(updatedConfig);
                  }}
                  tag="span"
                  className="font-sans font-bold text-bakery-primary tracking-widest uppercase text-sm block mb-2"
                />
              ) : (
                <span className="font-sans font-bold text-bakery-primary tracking-widest uppercase text-sm block mb-2">
                  {config.subheading}
                </span>
              ))}
            {isEditing ? (
              <EditableText
                value={config.heading}
                onSave={async (newValue) => {
                  const updatedConfig = { ...config, heading: newValue };
                  await saveField("featuredProducts", "config", updatedConfig);
                  setConfig(updatedConfig);
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
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {products.map((item) => {
            const dbProduct = dbProducts.find((db) => db.name === item.name);
            return (
            <div key={item.id} className="group flex flex-col h-full">
              {/* Image Container */}
              <div className="aspect-[4/5] w-full rounded-2xl overflow-hidden mb-6 relative shadow-md hover:shadow-xl transition-all duration-500">
                <EditableImage
                  src={item.image}
                  alt={item.name}
                  onSave={async (newUrl) => {
                    if (!dbProduct) return;
                    const updatedDbProducts = dbProducts.map((db) =>
                      db.id === dbProduct.id ? { ...db, image_url: newUrl } : db,
                    );
                    await saveField("featuredProducts", "products", updatedDbProducts);
                    setDbProducts(updatedDbProducts);
                    setProducts(updatedDbProducts.map(adaptProduct));
                  }}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Badge */}
                <div className="absolute top-4 left-4 bg-bakery-light/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm z-10">
                  <Star
                    size={14}
                    className="text-bakery-accent fill-bakery-accent"
                  />
                  <span className="text-xs font-bold font-sans text-bakery-dark tracking-wide uppercase">
                    Top Pick
                  </span>
                </div>

                {/* Hover Overlay & Button */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <button
                    onClick={() => addToCart(item)}
                    className="w-full bg-bakery-primary text-white font-serif font-bold py-3.5 rounded-xl shadow-lg hover:bg-bakery-dark transition-colors flex items-center justify-center gap-2"
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
                        const dbProduct = dbProducts.find(
                          (db) => db.name === item.name,
                        );
                        if (dbProduct) {
                          const updatedDbProducts = dbProducts.map((db) =>
                            db.id === dbProduct.id
                              ? { ...db, name: newValue }
                              : db,
                          );
                          await saveField(
                            "featuredProducts",
                            "products",
                            updatedDbProducts,
                          );
                          setDbProducts(updatedDbProducts);
                          setProducts(updatedDbProducts.map(adaptProduct));
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
                        const dbProduct = dbProducts.find(
                          (db) => db.name === item.name,
                        );
                        if (dbProduct) {
                          const updatedDbProducts = dbProducts.map((db) =>
                            db.id === dbProduct.id ? { ...db, price } : db,
                          );
                          await saveField(
                            "featuredProducts",
                            "products",
                            updatedDbProducts,
                          );
                          setDbProducts(updatedDbProducts);
                          setProducts(updatedDbProducts.map(adaptProduct));
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
                      const dbProduct = dbProducts.find(
                        (db) => db.name === item.name,
                      );
                      if (dbProduct) {
                        const updatedDbProducts = dbProducts.map((db) =>
                          db.id === dbProduct.id
                            ? { ...db, description: newValue }
                            : db,
                        );
                        await saveField(
                          "featuredProducts",
                          "products",
                          updatedDbProducts,
                        );
                        setDbProducts(updatedDbProducts);
                        setProducts(updatedDbProducts.map(adaptProduct));
                      }
                    }}
                    tag="p"
                    multiline
                    className="text-bakery-text/80 font-sans text-sm leading-relaxed line-clamp-2"
                  />
                ) : (
                  <p className="text-bakery-text/80 font-sans text-sm leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
          })}
        </div>
      </div>
    </section>
  );
};