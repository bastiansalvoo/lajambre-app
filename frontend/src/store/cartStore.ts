import { create } from 'zustand';

// 1. Definimos cómo luce un producto dentro del carrito
export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
}

// 2. Definimos las acciones que nuestro carrito puede hacer
interface CartState {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
}

// 3. Creamos la tienda (store)
export const useCartStore = create<CartState>((set) => ({
  items: [], // El carrito empieza vacío

  addItem: (product) =>
    set((state) => {
      // Revisamos si la hamburguesa ya está en el carrito
      const existingItem = state.items.find((item) => item.id === product.id);
      
      if (existingItem) {
        // Si ya existe, le sumamos 1 a la cantidad
        return {
          items: state.items.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      // Si es nueva, la agregamos con cantidad 1
      return { items: [...state.items, { ...product, quantity: 1 }] };
    }),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  updateQuantity: (id, quantity) =>
    set((state) => ({
      items: quantity === 0
        // Si la cantidad llega a 0, la eliminamos del carrito
        ? state.items.filter((item) => item.id !== id)
        // Si no, actualizamos su número
        : state.items.map((item) => (item.id === id ? { ...item, quantity } : item)),
    })),

  clearCart: () => set({ items: [] }),
}));