import React, { useEffect, useState, useRef } from "react";
import { MenuItem } from "../types";
import {
    ShoppingBag,
    Star,
    ArrowRight,
    Sparkles,
    TrendingUp,
    Package,
    X,
    ChevronLeft,
    ChevronRight,
    ToggleLeft,
    ToggleRight,
    Plus,
    Trash2,
    Eye,
} from "lucide-react";
import { PLANS } from "../src/lib/plans";

import type {
    Product,
    FeaturedProductsConfig,
} from "../src/types/database.types";
import { EditableText } from "../src/components/editor/EditableText";
import { EditableImage } from "../src/components/editor/EditableImage";
import { useEditor } from "../src/contexts/EditorContext";
import { useWebsite } from "../src/contexts/WebsiteContext";
import { ConfirmationModal } from "../src/components/ConfirmationModal";
import { useToast } from "../src/components/Toast";

// Simple ID generator to avoid uuid dependency
const generateId = () => Math.random().toString(36).substring(2, 9);

// Adapter to convert DB product to UI menu item
const adaptProduct = (dbProduct: Product): MenuItem & { originalId: string } => ({
    id: parseInt(dbProduct.id.slice(0, 8), 16) || Math.floor(Math.random() * 10000000),
    originalId: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description || "",
    price: Number(dbProduct.price),
    category: (dbProduct.category as any) || "product",
    image: dbProduct.image_url || "https://picsum.photos/seed/product/800/800",
});

interface CatalogueProps {
    // No addToCart prop needed for Catalogue
}

// Default content
const DEFAULT_CATALOGUE_CONFIG: FeaturedProductsConfig = {
    id: "catalogue-config",
    website_id: "",
    heading: "Our Catalogue",
    subheading: "BROWSE OUR SELECTION",
    max_items: 6,
    layout: "grid",
    show_add_to_cart: false,
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
        badges: ["Top Pick"],
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
        badges: ["Best Seller"],
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
        badges: ["New"],
        nutritional_info: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

// =====================================================
// BADGE COMPONENT
// =====================================================
interface ProductBadgeProps {
    badge: string;
}

const ProductBadge: React.FC<ProductBadgeProps> = ({ badge }) => {
    const badgeConfig: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
        "Top Pick": {
            icon: <Star size={14} className="fill-current" />,
            bg: "bg-bakery-accent",
            text: "text-white",
        },
        "Best Seller": {
            icon: <TrendingUp size={14} />,
            bg: "bg-green-500",
            text: "text-white",
        },
        "New": {
            icon: <Sparkles size={14} />,
            bg: "bg-blue-500",
            text: "text-white",
        },
        "Sold Out": {
            icon: <Package size={14} />,
            bg: "bg-gray-500",
            text: "text-white",
        },
    };

    const config = badgeConfig[badge] || {
        icon: <Star size={14} />,
        bg: "bg-bakery-primary",
        text: "text-white",
    };

    return (
        <div className={`${config.bg} ${config.text} backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm`}>
            {config.icon}
            <span className="text-xs font-bold font-sans tracking-wide uppercase">
                {badge}
            </span>
        </div>
    );
};

// =====================================================
// QUICK VIEW MODAL
// =====================================================
interface QuickViewModalProps {
    product: Product | null;
    menuItem: MenuItem | null;
    isOpen: boolean;
    onClose: () => void;
    isEditing: boolean;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({
    product,
    menuItem,
    isOpen,
    onClose,
    isEditing,
}) => {
    if (!isOpen || !product || !menuItem) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="grid md:grid-cols-2 gap-0">
                    {/* Image */}
                    <div className="aspect-square bg-bakery-light">
                        <img
                            src={product.image_url || menuItem.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col">


                        <h2 className="font-serif text-2xl font-bold text-bakery-dark mb-2">
                            {product.name}
                        </h2>

                        <p className="text-bakery-text/70 font-sans mb-4 flex-grow">
                            {product.description}
                        </p>

                        {/* Category */}
                        {product.category && (
                            <p className="text-sm text-bakery-primary font-medium mb-4">
                                {product.category}
                            </p>
                        )}

                        {/* Nutritional Info */}
                        {product.nutritional_info && Object.keys(product.nutritional_info).length > 0 && (
                            <div className="mb-4 p-3 bg-bakery-light/50 rounded-lg">
                                <h4 className="text-sm font-bold text-bakery-dark mb-2">Nutritional Info</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs text-bakery-text/70">
                                    {Object.entries(product.nutritional_info).map(([key, value]) => (
                                        <div key={key}>
                                            <span className="font-medium capitalize">{key}:</span> {value}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Allergens */}
                        {product.allergens && product.allergens.length > 0 && (
                            <div className="mb-4">
                                <p className="text-xs text-red-500 font-medium">
                                    ⚠️ Allergens: {product.allergens.join(", ")}
                                </p>
                            </div>
                        )}

                        {/* Price (No Add to Cart) */}
                        <div className="flex items-center justify-between pt-4 border-t border-bakery-sand/30">
                            <span className="font-serif text-2xl font-bold text-bakery-accent">
                                ₱{product.price}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =====================================================
// MAIN COMPONENT
// =====================================================
export const Catalogue: React.FC<CatalogueProps> = () => {
    const [config, setConfig] = useState<FeaturedProductsConfig | null>(null);
    const [products, setProducts] = useState<(MenuItem & { originalId: string })[]>([]);
    const [dbProducts, setDbProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [quickViewProduct, setQuickViewProduct] = useState<{ product: Product; menuItem: MenuItem } | null>(null);
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; product: Product | null }>({ isOpen: false, product: null });
    const carouselRef = useRef<HTMLDivElement>(null);
    const { isEditing, saveField } = useEditor();
    const { websiteData, loading: websiteLoading, contentVersion } = useWebsite();
    const { showToast } = useToast();

    useEffect(() => {
        if (!websiteLoading) {
            setLoading(false);
            if (websiteData?.content?.catalogue) {
                setConfig(
                    websiteData.content.catalogue.config || DEFAULT_CATALOGUE_CONFIG,
                );
                const fetchedDbProducts =
                    websiteData.content.catalogue.products || [];
                setDbProducts(fetchedDbProducts);
                setProducts(fetchedDbProducts.map(adaptProduct));
            } else {
                setConfig(DEFAULT_CATALOGUE_CONFIG);
                setDbProducts(DEFAULT_PRODUCTS);
                setProducts(DEFAULT_PRODUCTS.map(adaptProduct));
            }
        }
    }, [websiteData?.content?.catalogue, websiteLoading, contentVersion]);

    const handleSeeAllClick = () => {
        // Navigate to full catalogue page if implemented, or scroll somewhere appropriate
        // defaulting to scroll to top for now or maybe duplicate behavior to scroll to menu?
        const menuSection = document.getElementById("menu");
        if (menuSection) {
            menuSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const scrollCarousel = (direction: "left" | "right") => {
        if (!carouselRef.current) return;
        const scrollAmount = carouselRef.current.clientWidth * 0.8;
        carouselRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    if (loading) {
        return (
            <section
                id="catalogue"
                className="py-24 bg-bakery-light relative flex items-center justify-center min-h-[400px]"
            >
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
                    <p className="font-sans text-bakery-text/80">Loading...</p>
                </div>
            </section>
        );
    }

    // Empty state
    if (!config || products.length === 0) {
        if (isEditing) {
            return (
                <section id="catalogue" className="py-24 bg-bakery-light relative">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="font-serif text-4xl font-bold text-bakery-dark mb-6">Catalogue</h2>
                        <p className="text-bakery-text/70 mb-8">No catalogue products configured yet.</p>
                        <p className="text-sm text-bakery-text/50">Add products in the Menu section and add them to catalogue.</p>
                    </div>
                </section>
            );
        }
        return null;
    }

    return (
        <section id="catalogue" className="py-24 bg-bakery-light relative">
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
                                            "catalogue", // Assuming saveField can handle nested 'catalogue.config' logic similarly to featuredProducts
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
                                    await saveField("catalogue", "config", updatedConfig);
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
                    <button
                        onClick={handleSeeAllClick}
                        className="flex items-center gap-2 text-bakery-dark/70 font-sans font-medium hover:text-bakery-primary transition-colors cursor-pointer group"
                    >
                    </button>
                </div>

                {/* Desktop Grid / Mobile Carousel */}
                <div className="relative">
                    {/* Carousel navigation - mobile only */}
                    <div className="md:hidden flex justify-between absolute top-1/2 -translate-y-1/2 left-0 right-0 z-10 px-2 pointer-events-none">
                        <button
                            onClick={() => scrollCarousel("left")}
                            className="pointer-events-auto p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={() => scrollCarousel("right")}
                            className="pointer-events-auto p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-colors"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    {/* Product Grid (desktop) / Carousel (mobile) */}
                    <div
                        ref={carouselRef}
                        className="flex md:grid md:grid-cols-3 gap-8 lg:gap-12 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide"
                    >
                        {products.map((item) => {
                            const dbProduct = dbProducts.find((db) => db.id === item.originalId);
                            // Default to available (not sold out) if is_available is undefined
                            const isSoldOut = dbProduct ? (dbProduct.is_available === false) : false;

                            return (
                                <div key={item.id} className="group flex flex-col h-full flex-shrink-0 w-[80vw] md:w-auto snap-center">
                                    {/* Image Container */}
                                    <div
                                        className={`aspect-[4/5] w-full rounded-2xl overflow-hidden mb-6 relative shadow-md hover:shadow-xl transition-all duration-500`}
                                    >
                                        <EditableImage
                                            src={item.image}
                                            alt={item.name}
                                            onSave={async (newUrl) => {
                                                if (!dbProduct) return;
                                                const updatedDbProducts = dbProducts.map((db) =>
                                                    db.id === dbProduct.id ? { ...db, image_url: newUrl } : db,
                                                );
                                                await saveField("catalogue", "products", updatedDbProducts);
                                                setDbProducts(updatedDbProducts);
                                                setProducts(updatedDbProducts.map(adaptProduct));
                                            }}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />





                                        {/* Status Toggle & Delete - Edit Mode Only */}
                                        {isEditing && dbProduct && (
                                            <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">

                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        setDeleteModalState({ isOpen: true, product: dbProduct });
                                                    }}
                                                    className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Hover Overlay - BUT NO ADD TO CART BUTTON */}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col flex-grow">
                                        <div className="flex justify-between items-start mb-2">
                                            {isEditing ? (
                                                <EditableText
                                                    value={item.name}
                                                    onSave={async (newValue) => {
                                                        const dbProduct = dbProducts.find(
                                                            (db) => db.id === item.originalId,
                                                        );
                                                        if (dbProduct) {
                                                            const updatedDbProducts = dbProducts.map((db) =>
                                                                db.id === dbProduct.id
                                                                    ? { ...db, name: newValue }
                                                                    : db,
                                                            );
                                                            await saveField(
                                                                "catalogue",
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
                                                            (db) => db.id === item.originalId,
                                                        );
                                                        if (dbProduct) {
                                                            const updatedDbProducts = dbProducts.map((db) =>
                                                                db.id === dbProduct.id ? { ...db, price } : db,
                                                            );
                                                            await saveField(
                                                                "catalogue",
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
                                                        (db) => db.id === item.originalId,
                                                    );
                                                    if (dbProduct) {
                                                        const updatedDbProducts = dbProducts.map((db) =>
                                                            db.id === dbProduct.id
                                                                ? { ...db, description: newValue }
                                                                : db,
                                                        );
                                                        await saveField(
                                                            "catalogue",
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
                        {isEditing && (
                            <button
                                onClick={async () => {
                                    // LIMIT CHECK
                                    const planId = websiteData?.marketing?.plan_id || 'basic'; // Default to basic if not found
                                    const plan = PLANS.find(p => p.id === planId);
                                    const limit = plan?.productLimit !== undefined ? plan.productLimit : 12; // Default to 12

                                    if (limit !== 'unlimited' && dbProducts.length >= limit) {
                                        showToast(`You have reached the product limit for your plan (${limit}). Please upgrade to add more.`, 'warning');
                                        return;
                                    }

                                    try {
                                        const newProduct: Product = {
                                            id: generateId(),
                                            website_id: "",
                                            name: "New Item",
                                            description: "Description",
                                            price: 0,
                                            is_available: true,
                                            is_featured: false,
                                            display_order: dbProducts.length + 1,
                                            badges: [],
                                            nutritional_info: {},
                                            created_at: new Date().toISOString(),
                                            updated_at: new Date().toISOString(),
                                        };
                                        const updatedDbProducts = [...dbProducts, newProduct];
                                        await saveField("catalogue", "products", updatedDbProducts);
                                        setDbProducts(updatedDbProducts);
                                        setProducts(updatedDbProducts.map(adaptProduct));
                                    } catch (error) {
                                        console.error("Error adding product:", error);
                                        showToast("Failed to add product.", "error");
                                    }
                                }}
                                className="group flex flex-col h-full flex-shrink-0 w-[80vw] md:w-auto snap-center items-center justify-center min-h-[400px] border-2 border-dashed border-bakery-sand rounded-2xl hover:border-bakery-primary hover:bg-bakery-cream/30 transition-all cursor-pointer"
                            >
                                <div className="bg-bakery-light p-4 rounded-full shadow-md group-hover:scale-110 transition-transform mb-4">
                                    <Plus size={32} className="text-bakery-primary" />
                                </div>
                                <span className="font-serif text-xl font-bold text-bakery-dark">Add Product</span>
                                <span className="text-sm text-bakery-text/60 mt-2">
                                    ({dbProducts.length} / {(() => {
                                        const planId = websiteData?.marketing?.plan_id || 'basic';
                                        const plan = PLANS.find(p => p.id === planId);
                                        return plan?.productLimit === 'unlimited' ? '∞' : (plan?.productLimit || 12);
                                    })()})
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick View Modal */}
            <QuickViewModal
                product={quickViewProduct?.product || null}
                menuItem={quickViewProduct?.menuItem || null}
                isOpen={!!quickViewProduct}
                onClose={() => setQuickViewProduct(null)}
                isEditing={isEditing}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalState.isOpen}
                title="Delete Product"
                message={
                    <span>
                        Are you sure you want to delete <span className="font-bold">"{deleteModalState.product?.name}"</span>? This action cannot be undone.
                    </span>
                }
                confirmLabel="Delete"
                variant="danger"
                onClose={() => setDeleteModalState({ isOpen: false, product: null })}
                onConfirm={async () => {
                    if (deleteModalState.product) {
                        const updatedDbProducts = dbProducts.filter((db) => db.id !== deleteModalState.product?.id);
                        // Update local state first for immediate feedback
                        setDbProducts(updatedDbProducts);
                        setProducts(updatedDbProducts.map(adaptProduct));
                        setDeleteModalState({ isOpen: false, product: null });

                        // Then save to DB
                        await saveField("catalogue", "products", updatedDbProducts);
                    }
                }}
            />
        </section>
    );
};
