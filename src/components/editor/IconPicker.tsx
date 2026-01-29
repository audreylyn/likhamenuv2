/**
 * Icon Picker Component
 * Visual icon selector using Lucide React icons
 */

import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface IconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  currentIcon?: string;
  availableIcons?: string[];
}

// Common icons for bakery/food websites
const commonIcons = [
  'Heart', 'Wheat', 'Clock', 'Award', 'CheckCircle', 'Users', 'Leaf',
  'ChefHat', 'Star', 'Shield', 'Sparkles', 'Flame', 'Coffee', 'Cake',
  'Cookie', 'Utensils', 'ShoppingBag', 'Truck', 'MapPin', 'Phone', 'Mail',
  'Instagram', 'Facebook', 'Twitter', 'Linkedin', 'Youtube', 'Gift',
  'Ribbon', 'Crown', 'Zap', 'Target', 'TrendingUp', 'ThumbsUp', 'Smile',
  'Sun', 'Moon', 'Cloud', 'Droplet', 'Flower', 'Tree', 'Mountain'
];

export const IconPicker: React.FC<IconPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentIcon,
  availableIcons,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Use provided icons or common icons
  const iconsToShow = availableIcons || commonIcons;

  // Filter icons based on search
  const filteredIcons = iconsToShow.filter(iconName =>
    iconName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleIconClick = (iconName: string) => {
    // Convert PascalCase to kebab-case for storage
    const iconKey = iconName
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
    onSelect(iconKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Select an Icon</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-4">
            {filteredIcons.map((iconName) => {
              // Get icon component from Lucide
              const IconComponent = (LucideIcons as any)[iconName];
              
              if (!IconComponent) return null;

              const iconKey = iconName
                .replace(/([A-Z])/g, '-$1')
                .toLowerCase()
                .replace(/^-/, '');
              
              const isSelected = currentIcon?.toLowerCase() === iconKey.toLowerCase();

              return (
                <button
                  key={iconName}
                  onClick={() => handleIconClick(iconName)}
                  className={`p-4 rounded-lg border-2 transition-all hover:scale-110 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                  title={iconName}
                >
                  <IconComponent
                    size={24}
                    className={`mx-auto ${
                      isSelected ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {filteredIcons.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No icons found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

