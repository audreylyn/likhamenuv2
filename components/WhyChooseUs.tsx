import React, { useEffect, useState } from "react";
import {
  Leaf,
  Users,
  ChefHat,
  Clock,
  Heart,
  Award,
  CheckCircle,
  Wheat,
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
import type { WhyChooseUsContent } from "../src/types/database.types";
import { EditableText } from "../src/components/editor/EditableText";
import { IconPicker } from "../src/components/editor/IconPicker";
import { useEditor } from "../src/contexts/EditorContext";
import { useWebsite } from "../src/contexts/WebsiteContext";
import { ConfirmationModal } from "../src/components/ConfirmationModal";
import { useToast } from "../src/components/Toast";

// Icon mapping - handles both kebab-case and camelCase
const iconMap: Record<string, any> = {
  "chef-hat": ChefHat,
  chefhat: ChefHat,
  leaf: Leaf,
  users: Users,
  clock: Clock,
  heart: Heart,
  award: Award,
  "check-circle": CheckCircle,
  checkcircle: CheckCircle,
  wheat: Wheat,
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

// Default content
const DEFAULT_WHY_CHOOSE_US: WhyChooseUsContent = {
  id: "why-choose-us",
  website_id: "",
  heading: "Why Choose Us",
  subheading: "OUR PROMISE",
  reasons: [
    {
      icon: "chef-hat",
      title: "Master Chefs",
      description: "Our culinary experts bring years of experience and passion to every dish.",
    },
    {
      icon: "leaf",
      title: "Fresh Ingredients",
      description: "We source only the freshest, high-quality ingredients from local farmers.",
    },
    {
      icon: "users",
      title: "Great Service",
      description: "Our friendly staff is dedicated to providing you with an exceptional dining experience.",
    },
  ],
  background_style: "light",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const WhyChooseUs: React.FC = () => {
  const [content, setContent] = useState<WhyChooseUsContent | null>(null);
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
      if (websiteData?.content?.whyChooseUs) {
        setContent(websiteData.content.whyChooseUs as WhyChooseUsContent);
      } else {
        setContent(DEFAULT_WHY_CHOOSE_US);
      }
    }
  }, [websiteData?.content?.whyChooseUs, websiteLoading, contentVersion]);

  if (loading) {
    return (
      <section
        id="whyChooseUs"
        className="py-24 bg-bakery-beige relative flex items-center justify-center min-h-[400px]"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-bakery-text/80">Loading...</p>
        </div>
      </section>
    );
  }

  if (!content) return null;

  const reasons = (content.reasons as any[]) || [];

  return (
    <section id="whyChooseUs" className="py-24 bg-bakery-beige relative">
      {/* Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          {content.subheading &&
            (isEditing ? (
              <EditableText
                value={content.subheading}
                onSave={async (newValue) => {
                  await saveField(
                    "whyChooseUs",
                    "subheading",
                    newValue,
                    content.id,
                  );
                  setContent({ ...content, subheading: newValue });
                }}
                tag="span"
                className="font-sans font-bold text-bakery-primary tracking-widest uppercase text-sm block mb-2"
              />
            ) : (
              <span className="font-sans font-bold text-bakery-primary tracking-widest uppercase text-sm block mb-2">
                {content.subheading}
              </span>
            ))}
          {isEditing ? (
            <EditableText
              value={content.heading}
              onSave={async (newValue) => {
                await saveField(
                  "whyChooseUs",
                  "heading",
                  newValue,
                  content.id,
                );
                setContent({ ...content, heading: newValue });
              }}
              tag="h2"
              className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark mb-4"
            />
          ) : (
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark mb-4">
              {content.heading}
            </h2>
          )}
          <div className="w-24 h-1 bg-bakery-primary mx-auto rounded-full mt-6" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {reasons.map((reason, index) => {
            const IconComponent = iconMap[reason.icon] || ChefHat;

            const handleDeleteReason = async () => {
              setConfirmModal({
                isOpen: true,
                title: "Delete Reason",
                message: "Are you sure you want to delete this reason?",
                onConfirm: async () => {
                  try {
                    const updatedReasons = reasons.filter((_, i) => i !== index);
                    await saveField(
                      "whyChooseUs",
                      "reasons",
                      updatedReasons,
                      content.id,
                    );
                    setContent({ ...content, reasons: updatedReasons as any });
                    setConfirmModal(null);
                  } catch (error) {
                    setConfirmModal(null);
                    console.error("Error deleting reason:", error);
                    showToast("Failed to delete reason. Please try again.", "error");
                  }
                }
              });
            };

            return (
              <div
                key={index}
                className="bg-bakery-light p-10 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-bakery-sand/30 group relative"
              >
                {isEditing && (
                  <button
                    onClick={handleDeleteReason}
                    className="absolute -top-2 -right-2 z-10 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                    title="Delete reason"
                  >
                    <X size={16} />
                  </button>
                )}
                <div
                  className={`w-20 h-20 bg-bakery-cream rounded-full flex items-center justify-center text-bakery-primary mb-8 mx-auto group-hover:scale-110 transition-transform duration-300 ${isEditing ? "cursor-pointer hover:ring-2 hover:ring-blue-500" : ""}`}
                  onClick={
                    isEditing
                      ? () => {
                        setEditingIconIndex(index);
                        setIconPickerOpen(true);
                      }
                      : undefined
                  }
                  title={isEditing ? "Click to change icon" : ""}
                >
                  <IconComponent size={32} strokeWidth={1.5} />
                </div>
                {isEditing ? (
                  <EditableText
                    value={reason.title}
                    onSave={async (newValue) => {
                      const updatedReasons = [...reasons];
                      updatedReasons[index] = {
                        ...updatedReasons[index],
                        title: newValue,
                      };
                      await saveField(
                        "whyChooseUs",
                        "reasons",
                        updatedReasons,
                        content.id,
                      );
                      setContent({
                        ...content,
                        reasons: updatedReasons as any,
                      });
                    }}
                    tag="h3"
                    className="font-serif text-2xl font-bold text-bakery-dark mb-4 text-center group-hover:text-bakery-primary transition-colors"
                  />
                ) : (
                  <h3 className="font-serif text-2xl font-bold text-bakery-dark mb-4 text-center group-hover:text-bakery-primary transition-colors">
                    {reason.title}
                  </h3>
                )}
                {isEditing ? (
                  <EditableText
                    value={reason.description}
                    onSave={async (newValue) => {
                      const updatedReasons = [...reasons];
                      updatedReasons[index] = {
                        ...updatedReasons[index],
                        description: newValue,
                      };
                      await saveField(
                        "whyChooseUs",
                        "reasons",
                        updatedReasons,
                        content.id,
                      );
                      setContent({
                        ...content,
                        reasons: updatedReasons as any,
                      });
                    }}
                    tag="p"
                    multiline
                    className="font-sans text-bakery-text/80 text-center leading-relaxed"
                  />
                ) : (
                  <p className="font-sans text-bakery-text/80 text-center leading-relaxed">
                    {reason.description}
                  </p>
                )}
              </div>
            );
          })}
          {isEditing && (
            <button
              onClick={async () => {
                try {
                  const newReason = {
                    icon: "chef-hat",
                    title: "New Reason",
                    description: "Reason description",
                  };
                  const updatedReasons = [...reasons, newReason];
                  await saveField(
                    "whyChooseUs",
                    "reasons",
                    updatedReasons,
                    content.id,
                  );
                  setContent({ ...content, reasons: updatedReasons as any });
                } catch (error) {
                  console.error("Error adding reason:", error);
                  showToast("Failed to add reason. Please try again.", "error");
                }
              }}
              className="flex flex-col items-center justify-center gap-2 p-10 border-2 border-dashed border-bakery-sand/60 rounded-2xl hover:border-bakery-primary hover:bg-bakery-cream/60 transition-colors text-bakery-text/70 hover:text-bakery-primary bg-bakery-light"
              title="Add new reason"
            >
              <Plus size={32} />
              <span className="text-sm font-medium">Add Reason</span>
            </button>
          )}
        </div>
      </div>

      {/* Icon Picker Modal */}
      <IconPicker
        isOpen={iconPickerOpen}
        onClose={() => {
          setIconPickerOpen(false);
          setEditingIconIndex(null);
        }}
        onSelect={async (iconName: string) => {
          if (editingIconIndex === null) return;
          try {
            const updatedReasons = [...reasons];
            updatedReasons[editingIconIndex] = {
              ...updatedReasons[editingIconIndex],
              icon: iconName,
            };
            await saveField(
              "whyChooseUs",
              "reasons",
              updatedReasons,
              content.id,
            );
            setContent({ ...content, reasons: updatedReasons as any });
          } catch (error) {
            console.error("Error saving icon:", error);
            showToast("Failed to save icon. Please try again.", "error");
          }
        }}
        currentIcon={
          editingIconIndex !== null ? reasons[editingIconIndex]?.icon : undefined
        }
        availableIcons={[
          "ChefHat",
          "Leaf",
          "Users",
          "Clock",
          "Heart",
          "Award",
          "CheckCircle",
          "Wheat",
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