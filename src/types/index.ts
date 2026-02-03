export * from './database.types';
export * from './auth.types';
export * from './supabase.types';

import { MenuItem } from './database.types';

export interface CartItem extends MenuItem {
    quantity: number;
}
