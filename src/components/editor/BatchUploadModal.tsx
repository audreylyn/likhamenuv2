import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileSpreadsheet, AlertCircle, CheckCircle, Trash2, Download, Plus } from 'lucide-react';
import type { MenuItem as DBMenuItem, MenuCategory } from '../../types/database.types';

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (items: DBMenuItem[]) => void;
  categories: MenuCategory[];
  existingItemCount: number;
  productLimit: number | 'unlimited';
}

interface ParsedItem {
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  is_available: boolean;
  valid: boolean;
  errors: string[];
}

const CSV_HEADERS = ['name', 'description', 'price', 'category', 'image_url'] as const;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string, categories: MenuCategory[]): ParsedItem[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  // Detect if first line is a header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = CSV_HEADERS.some(h => firstLine.includes(h));
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const categoryMap = new Map<string, string>();
  categories.forEach(c => {
    categoryMap.set(c.name.toLowerCase(), c.id);
    categoryMap.set(c.id.toLowerCase(), c.id);
  });

  const defaultCategoryId = categories.length > 0 ? categories[0].id : '';

  return dataLines.map(line => {
    const cols = parseCSVLine(line);
    const errors: string[] = [];

    const name = cols[0]?.trim() || '';
    const description = cols[1]?.trim() || '';
    const priceStr = cols[2]?.trim() || '0';
    const categoryStr = cols[3]?.trim() || '';
    const image_url = cols[4]?.trim() || '';

    if (!name) errors.push('Name is required');

    const price = parseFloat(priceStr);
    if (isNaN(price) || price < 0) errors.push('Invalid price');

    let category_id = defaultCategoryId;
    if (categoryStr) {
      const matched = categoryMap.get(categoryStr.toLowerCase());
      if (matched) {
        category_id = matched;
      } else {
        errors.push(`Unknown category "${categoryStr}"`);
      }
    }

    return {
      name,
      description,
      price: isNaN(price) ? 0 : price,
      category_id,
      image_url,
      is_available: true,
      valid: errors.length === 0,
      errors,
    };
  }).filter(item => item.name || item.description || item.price > 0);
}

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  categories,
  existingItemCount,
  productLimit,
}) => {
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [pasteText, setPasteText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingSlots = productLimit === 'unlimited'
    ? Infinity
    : productLimit - existingItemCount;

  const validItems = parsedItems.filter(i => i.valid);
  const overLimit = productLimit !== 'unlimited' && validItems.length > remainingSlots;

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const items = parseCSV(text, categories);
        setParsedItems(items);
      }
    };
    reader.readAsText(file);
  }, [categories]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'text/plain')) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleParsePaste = useCallback(() => {
    if (pasteText.trim()) {
      const items = parseCSV(pasteText, categories);
      setParsedItems(items);
    }
  }, [pasteText, categories]);

  const removeItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ParsedItem, value: string | number) => {
    setParsedItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      // Re-validate
      const errors: string[] = [];
      if (!updated.name) errors.push('Name is required');
      if (isNaN(Number(updated.price)) || Number(updated.price) < 0) errors.push('Invalid price');
      if (updated.category_id && !categories.some(c => c.id === updated.category_id)) {
        errors.push('Invalid category');
      }
      updated.errors = errors;
      updated.valid = errors.length === 0;
      return updated;
    }));
  };

  const handleConfirm = async () => {
    const itemsToAdd = validItems.slice(0, productLimit === 'unlimited' ? undefined : remainingSlots);
    if (itemsToAdd.length === 0) return;

    setUploading(true);
    try {
      const now = new Date().toISOString();
      const dbItems: DBMenuItem[] = itemsToAdd.map((item, idx) => ({
        id: crypto.randomUUID(),
        website_id: '',
        category_id: item.category_id,
        name: item.name,
        description: item.description || undefined,
        price: item.price,
        image_url: item.image_url || undefined,
        is_available: item.is_available,
        is_popular: false,
        display_order: existingItemCount + idx,
        rating: 5,
        review_count: 0,
        created_at: now,
        updated_at: now,
      }));

      onConfirm(dbItems);
      resetState();
    } catch {
      // error is handled by parent
    } finally {
      setUploading(false);
    }
  };

  const resetState = () => {
    setParsedItems([]);
    setPasteText('');
    setInputMode('file');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const downloadTemplate = () => {
    const categoryNames = categories.map(c => c.name).join(' | ');
    const header = 'name,description,price,category,image_url';
    const example1 = `Example Product,"A delicious item",150,${categories[0]?.name || 'Category'},https://example.com/image.jpg`;
    const example2 = `Another Product,"Another description",200,${categories[1]?.name || categories[0]?.name || 'Category'},`;
    const csv = `${header}\n${example1}\n${example2}\n\n# Categories available: ${categoryNames}\n# Price should be a number\n# image_url is optional`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'menu-items-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Upload size={20} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Batch Upload Products</h2>
              <p className="text-sm text-gray-500">
                Upload a CSV file or paste data to add multiple products at once
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {parsedItems.length === 0 ? (
            /* Upload / Paste Area */
            <div className="space-y-4">
              {/* Mode Tabs */}
              <div className="flex gap-2 bg-gray-100 rounded-lg p-1 w-fit">
                <button
                  onClick={() => setInputMode('file')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    inputMode === 'file'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FileSpreadsheet size={14} className="inline mr-1.5" />
                  Upload CSV
                </button>
                <button
                  onClick={() => setInputMode('paste')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    inputMode === 'paste'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Plus size={14} className="inline mr-1.5" />
                  Paste Data
                </button>
              </div>

              {inputMode === 'file' ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                  }`}
                >
                  <Upload size={40} className="mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-700 font-medium mb-1">
                    Drop your CSV file here or <span className="text-purple-600">browse</span>
                  </p>
                  <p className="text-gray-400 text-sm">Supports .csv and .txt files</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={`Paste CSV data here. One product per line:\n\nname,description,price,category,image_url\nChocolate Cake,"Rich chocolate cake",350,${categories[0]?.name || 'Category One'},https://...\nVanilla Cupcake,"Sweet vanilla cupcake",120,${categories[0]?.name || 'Category One'},`}
                    className="w-full h-48 p-4 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <button
                    onClick={handleParsePaste}
                    disabled={!pasteText.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Parse Data
                  </button>
                </div>
              )}

              {/* CSV Format Guide */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-700 text-sm mb-2">CSV Format</h4>
                <div className="text-xs text-gray-500 space-y-1">
                  <p><span className="font-mono bg-gray-200 px-1 rounded">name</span> (required), <span className="font-mono bg-gray-200 px-1 rounded">description</span>, <span className="font-mono bg-gray-200 px-1 rounded">price</span>, <span className="font-mono bg-gray-200 px-1 rounded">category</span>, <span className="font-mono bg-gray-200 px-1 rounded">image_url</span></p>
                  <p className="mt-2">
                    <strong>Categories:</strong> {categories.map(c => c.name).join(', ') || 'No categories yet'}
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="mt-3 text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                >
                  <Download size={12} />
                  Download Template CSV
                </button>
              </div>

              {/* Limits Info */}
              {productLimit !== 'unlimited' && (
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>
                    Your plan allows <strong>{productLimit}</strong> products. You have <strong>{existingItemCount}</strong> currently.
                    You can add up to <strong>{Math.max(0, remainingSlots)}</strong> more.
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Preview Table */
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle size={14} />
                    {validItems.length} valid
                  </span>
                  {parsedItems.filter(i => !i.valid).length > 0 && (
                    <span className="flex items-center gap-1.5 text-red-600">
                      <AlertCircle size={14} />
                      {parsedItems.filter(i => !i.valid).length} with errors
                    </span>
                  )}
                  {overLimit && (
                    <span className="flex items-center gap-1.5 text-amber-600">
                      <AlertCircle size={14} />
                      Only {remainingSlots} can be added (plan limit)
                    </span>
                  )}
                </div>
                <button
                  onClick={resetState}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear & Start Over
                </button>
              </div>

              {/* Items Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-3 font-medium text-gray-600 w-8">#</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 w-24">Price</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 w-36">Category</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 w-10">Status</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedItems.map((item, idx) => (
                        <tr
                          key={idx}
                          className={`border-b border-gray-100 last:border-0 ${
                            !item.valid ? 'bg-red-50/50' : ''
                          } ${
                            overLimit && item.valid && validItems.indexOf(item) >= remainingSlots
                              ? 'opacity-40'
                              : ''
                          }`}
                        >
                          <td className="px-4 py-2.5 text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-2.5">
                            <input
                              value={item.name}
                              onChange={(e) => updateItem(idx, 'name', e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none py-0.5 text-gray-900"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              value={item.description}
                              onChange={(e) => updateItem(idx, 'description', e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none py-0.5 text-gray-600"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none py-0.5 text-gray-900"
                              min="0"
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <select
                              value={item.category_id}
                              onChange={(e) => updateItem(idx, 'category_id', e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none py-0.5 text-gray-700 cursor-pointer"
                            >
                              {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {item.valid ? (
                              <CheckCircle size={16} className="text-green-500 mx-auto" />
                            ) : (
                              <div className="group relative">
                                <AlertCircle size={16} className="text-red-500 mx-auto cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                    {item.errors.join(', ')}
                                  </div>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <button
                              onClick={() => removeItem(idx)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                              title="Remove"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          {parsedItems.length > 0 && (
            <button
              onClick={handleConfirm}
              disabled={validItems.length === 0 || uploading}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Adding...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Add {Math.min(validItems.length, productLimit === 'unlimited' ? validItems.length : remainingSlots)} Products
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
