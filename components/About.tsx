import React, { useEffect, useState } from "react";
import {
  Heart,
  Wheat,
  Clock,
  Award,
  CheckCircle,
  Users,
  Leaf,
  ChefHat,
  Star,
  Shield,
  Sparkles,
  Flame,
  Coffee,
  Cake,
  Cookie,
  Utensils,
  ShoppingBag,
  Truck,
  Gift,
  Ribbon,
  Crown,
  Zap,
  Target,
  TrendingUp,
  ThumbsUp,
  Smile,
  Plus,
  X,
} from "lucide-react";
import type { AboutContent } from "../src/types/database.types";
import { EditableText } from "../src/components/editor/EditableText";
import { EditableImage } from "../src/components/editor/EditableImage";
import { IconPicker } from "../src/components/editor/IconPicker";
import { useEditor } from "../src/contexts/EditorContext";
import { useWebsite } from "../src/contexts/WebsiteContext";
import { ConfirmationModal } from "../src/components/ConfirmationModal";
import { useToast } from "../src/components/Toast";

// Icon mapping - handles both kebab-case and camelCase
const iconMap: Record<string, any> = {
  heart: Heart,
  wheat: Wheat,
  clock: Clock,
  award: Award,
  "check-circle": CheckCircle,
  checkcircle: CheckCircle,
  users: Users,
  leaf: Leaf,
  "chef-hat": ChefHat,
  chefhat: ChefHat,
  star: Star,
  shield: Shield,
  sparkles: Sparkles,
  flame: Flame,
  coffee: Coffee,
  cake: Cake,
  cookie: Cookie,
  utensils: Utensils,
  "shopping-bag": ShoppingBag,
  shoppingbag: ShoppingBag,
  truck: Truck,
  gift: Gift,
  ribbon: Ribbon,
  crown: Crown,
  zap: Zap,
  target: Target,
  "trending-up": TrendingUp,
  trendingup: TrendingUp,
  "thumbs-up": ThumbsUp,
  thumbsup: ThumbsUp,
  smile: Smile,
};

// Default about content
const DEFAULT_ABOUT: AboutContent = {
  id: "1",
  website_id: "",
  heading: "About Our Bakery",
  subheading: "Crafted with Love & Quality Ingredients",
  description:
    "Welcome to The Golden Crumb, where tradition meets innovation. Since our founding, we've been dedicated to baking the finest breads, pastries, and cakes using only the highest quality ingredients.",
  image_url:
    "https://lanecove.s3.ap-southeast-2.amazonaws.com/wp-content/uploads/2016/05/04233634/bakers-delight-goods.jpg",
  image_position: "left",
  features: [
    {
      icon: "wheat",
      title: "Premium Ingredients",
      description: "Only the finest organic flour and ingredients",
    },
    {
      icon: "heart",
      title: "Made with Love",
      description: "Every item baked with care and passion",
    },
  ],
  stats: [
    { label: "Years in Business", value: "25+" },
    { label: "Daily Fresh Bakes", value: "500+" },
  ],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const About: React.FC = () => {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [editingIconIndex, setEditingIconIndex] = useState<number | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const { isEditing, saveField } = useEditor();
  const { websiteData, loading: websiteLoading, contentVersion } = useWebsite();
  const { showToast } = useToast();

  useEffect(() => {
    if (!websiteLoading) {
      setLoading(false);
      if (websiteData?.content?.about) {
        setContent(websiteData.content.about as AboutContent);
      } else {
        setContent(DEFAULT_ABOUT);
      }
    }
  }, [websiteData?.content?.about, websiteLoading, contentVersion]);

  if (loading) {
    return (
      <section
        id="about"
        className="py-24 bg-bakery-light relative overflow-hidden flex items-center justify-center min-h-[400px]"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-bakery-text/80">Loading...</p>
        </div>
      </section>
    );
  }

  if (!content) return null;

  const features = (content.features as any[]) || [];
  const stats = (content.stats as any[]) || [];

  const handleIconSelect = async (iconName: string) => {
    if (editingIconIndex === null || !content) return;
    try {
      const updatedFeatures = [...features];
      updatedFeatures[editingIconIndex] = {
        ...updatedFeatures[editingIconIndex],
        icon: iconName,
      };
      await saveField("about", "features", updatedFeatures, content.id);
      setContent({ ...content, features: updatedFeatures as any });
    } catch (error) {
      console.error("Error saving icon:", error);
      showToast("Failed to save icon. Please try again.", "error");
    }
  };

  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-bakery-cream rounded-bl-full -z-10 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-bakery-beige rounded-tr-full -z-10 opacity-50"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-16">
          {/* Image Collage */}
          <div className="w-full md:w-1/2 relative">
            <div className="relative z-10">
              <EditableImage
                src={
                  content.image_url ||
                  "https://lanecove.s3.ap-southeast-2.amazonaws.com/wp-content/uploads/2016/05/04233634/bakers-delight-goods.jpg"
                }
                alt={content.heading}
                onSave={async (newUrl) => {
                  await saveField("about", "image_url", newUrl, content.id);
                  setContent({ ...content, image_url: newUrl });
                }}
                className="rounded-lg shadow-2xl w-[85%] border-4 border-white mx-auto block"
              />
            </div>
            <div className="absolute -bottom-10 -right-4 z-20 w-[60%]">
              {(() => {
                // Get secondary image from stats (stored as special entry with type 'secondary_image')
                const secondaryImageStat = stats.find(
                  (s: any) => s.type === "secondary_image",
                );
                const secondaryImageUrl =
                  secondaryImageStat?.value ||
                  "https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80";

                return (
                  <EditableImage
                    src={secondaryImageUrl}
                    alt="Fresh loaves"
                    onSave={async (newUrl) => {
                      // Update or add secondary image to stats
                      const updatedStats = [...stats];
                      const existingIndex = updatedStats.findIndex(
                        (s: any) => s.type === "secondary_image",
                      );
                      if (existingIndex >= 0) {
                        updatedStats[existingIndex] = {
                          type: "secondary_image",
                          value: newUrl,
                        };
                      } else {
                        updatedStats.push({
                          type: "secondary_image",
                          value: newUrl,
                        });
                      }
                      await saveField(
                        "about",
                        "stats",
                        updatedStats,
                        content.id,
                      );
                      setContent({
                        ...content,
                        stats: updatedStats as any,
                      });
                    }}
                    className="rounded-lg shadow-xl border-4 border-white"
                  />
                );
              })()}
            </div>
            {/* Badge - Removed per user request */}
          </div>

          {/* Content */}
          <div className="w-full md:w-1/2 mt-12 md:mt-0">
            {content.subheading &&
              (isEditing ? (
                <EditableText
                  value={content.subheading}
                  onSave={async (newValue) => {
                    await saveField(
                      "about",
                      "subheading",
                      newValue,
                      content.id,
                    );
                    setContent({ ...content, subheading: newValue });
                  }}
                  tag="span"
                  className="font-sans font-bold text-bakery-primary tracking-widest uppercase text-sm block"
                />
              ) : (
                <span className="font-sans font-bold text-bakery-primary tracking-widest uppercase text-sm">
                  {content.subheading}
                </span>
              ))}
            {isEditing ? (
              <EditableText
                value={content.heading}
                onSave={async (newValue) => {
                  await saveField(
                    "about",
                    "heading",
                    newValue,
                    content.id,
                  );
                  setContent({ ...content, heading: newValue });
                }}
                tag="h2"
                className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark mt-3 mb-6"
              />
            ) : (
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark mt-3 mb-6">
                {content.heading}
              </h2>
            )}
            {isEditing ? (
              <EditableText
                value={content.description}
                onSave={async (newValue) => {
                  await saveField(
                    "about",
                    "description",
                    newValue,
                    content.id,
                  );
                  setContent({ ...content, description: newValue });
                }}
                tag="p"
                multiline
                className="font-sans text-lg text-bakery-text/80 mb-8 leading-relaxed whitespace-pre-line"
              />
            ) : (
              <p className="font-sans text-lg text-bakery-text/80 mb-8 leading-relaxed whitespace-pre-line">
                {content.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-6 mb-8">
              {features.map((feature, index) => {
                const IconComponent = iconMap[feature.icon] || Heart;
                const handleIconClick = () => {
                  setEditingIconIndex(index);
                  setIconPickerOpen(true);
                };

                const handleDeleteFeature = async () => {
                  setConfirmModal({
                    isOpen: true,
                    title: "Delete Feature",
                    message: "Are you sure you want to delete this feature?",
                    onConfirm: async () => {
                      try {
                        const updatedFeatures = features.filter(
                          (_, i) => i !== index,
                        );
                        await saveField(
                          "about",
                          "features",
                          updatedFeatures,
                          content.id,
                        );
                        setContent({
                          ...content,
                          features: updatedFeatures as any,
                        });
                        setConfirmModal(null);
                      } catch (error) {
                        setConfirmModal(null);
                        console.error("Error deleting feature:", error);
                        showToast("Failed to delete feature. Please try again.", "error");
                      }
                    }
                  });
                };

                return (
                  <div key={index} className="flex flex-col gap-2 relative">
                    {isEditing && (
                      <button
                        onClick={handleDeleteFeature}
                        className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                        title="Delete feature"
                      >
                        <X size={16} />
                      </button>
                    )}
                    <div
                      className={`text-bakery-primary ${isEditing ? "cursor-pointer hover:ring-2 hover:ring-blue-500 rounded-lg p-1 transition-all" : ""}`}
                      onClick={isEditing ? handleIconClick : undefined}
                      title={isEditing ? "Click to change icon" : ""}
                    >
                      <IconComponent size={32} strokeWidth={1.5} />
                    </div>
                    {isEditing ? (
                      <EditableText
                        value={feature.title}
                        onSave={async (newValue) => {
                          const updatedFeatures = [...features];
                          updatedFeatures[index] = {
                            ...updatedFeatures[index],
                            title: newValue,
                          };
                          await saveField(
                            "about",
                            "features",
                            updatedFeatures,
                            content.id,
                          );
                          setContent({
                            ...content,
                            features: updatedFeatures as any,
                          });
                        }}
                        tag="h4"
                        className="font-serif font-bold text-bakery-dark text-lg"
                      />
                    ) : (
                      <h4 className="font-serif font-bold text-bakery-dark text-lg">
                        {feature.title}
                      </h4>
                    )}
                    {isEditing ? (
                      <EditableText
                        value={feature.description}
                        onSave={async (newValue) => {
                          const updatedFeatures = [...features];
                          updatedFeatures[index] = {
                            ...updatedFeatures[index],
                            description: newValue,
                          };
                          await saveField(
                            "about",
                            "features",
                            updatedFeatures,
                            content.id,
                          );
                          setContent({
                            ...content,
                            features: updatedFeatures as any,
                          });
                        }}
                        tag="p"
                        className="text-sm text-gray-500 font-sans"
                      />
                    ) : (
                      <p className="text-sm text-gray-500 font-sans">
                        {feature.description}
                      </p>
                    )}
                  </div>
                );
              })}
              {isEditing && (
                <button
                  onClick={async () => {
                    try {
                      const newFeature = {
                        icon: "heart",
                        title: "New Feature",
                        description: "Feature description",
                      };
                      const updatedFeatures = [...features, newFeature];
                      await saveField(
                        "about",
                        "features",
                        updatedFeatures,
                        content.id,
                      );
                      setContent({
                        ...content,
                        features: updatedFeatures as any,
                      });
                    } catch (error) {
                      console.error("Error adding feature:", error);
                      showToast("Failed to add feature. Please try again.", "error");
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-500 hover:text-blue-600"
                  title="Add new feature"
                >
                  <Plus size={32} />
                  <span className="text-sm font-medium">Add Feature</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <IconPicker
        isOpen={iconPickerOpen}
        onClose={() => {
          setIconPickerOpen(false);
          setEditingIconIndex(null);
        }}
        onSelect={handleIconSelect}
        currentIcon={
          editingIconIndex !== null
            ? features[editingIconIndex]?.icon
            : undefined
        }
        availableIcons={[
          "Heart",
          "Wheat",
          "Clock",
          "Award",
          "CheckCircle",
          "Users",
          "Leaf",
          "ChefHat",
          "Star",
          "Shield",
          "Sparkles",
          "Flame",
          "Coffee",
          "Cake",
          "Cookie",
          "Utensils",
          "ShoppingBag",
          "Truck",
          "Gift",
          "Ribbon",
          "Crown",
          "Zap",
          "Target",
          "TrendingUp",
          "ThumbsUp",
          "Smile",
        ]}
      />

      <ConfirmationModal
        isOpen={!!confirmModal?.isOpen}
        title={confirmModal?.title}
        message={confirmModal?.message || ""}
        onClose={() => setConfirmModal(null)}
        onConfirm={confirmModal?.onConfirm || (() => { })}
      />
    </section>
  );
};
