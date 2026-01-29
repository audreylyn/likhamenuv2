export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'pastry' | 'bread' | 'cake' | 'beverage';
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface ContactFormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ReservationFormState {
  date: string;
  time: string;
  guests: number;
  name: string;
  phone: string;
}

export interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}