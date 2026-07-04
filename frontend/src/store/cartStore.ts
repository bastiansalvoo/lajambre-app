import { create } from 'zustand';

// 1. Definimos cómo luce un Extra
export interface ExtraItem {
  id: number;
  name: string;
  price: number;
}

// 2. Modificamos el producto del carrito
export interface CartItem {
  cartItemId: string; // NUEVO: Identificador único (ej: "1-extras-2")
  id: number;         // ID real del producto en la DB
  name: string;
  price: number;      // Precio base
  image: string | null;
  quantity: number;
  extras: ExtraItem[]; // NUEVO: Lista de extras elegidos
}

interface CartState {
  items: CartItem[];
  // Ahora pedimos los extras al agregar (opcional por si compran bebidas sin extras)
  addItem: (product: Omit<CartItem, 'quantity' | 'cartItemId' | 'extras'>, extras?: ExtraItem[]) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  items: [],

  addItem: (product, extras = []) =>
    set((state) => {
      // 1. Creamos una "huella digital" para agrupar productos exactamente iguales
      // Si es la hamburguesa 1 sin extras, su cartItemId será "1-"
      // Si tiene el extra 2, será "1-2"
      const extrasKey = extras.map((e) => e.id).sort().join('-');
      const cartItemId = `${product.id}-${extrasKey}`;

      const existingItem = state.items.find((item) => item.cartItemId === cartItemId);
      
      if (existingItem) {
        // Si ya existe ESE producto con ESOS extras exactos, sumamos 1
        return {
          items: state.items.map((item) =>
            item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
          ),
        };
      }
      
      // Si es una combinación nueva, la agregamos
      return { items: [...state.items, { ...product, cartItemId, extras, quantity: 1 }] };
    }),

  removeItem: (cartItemId) =>
    set((state) => ({
      items: state.items.filter((item) => item.cartItemId !== cartItemId),
    })),

  updateQuantity: (cartItemId, quantity) =>
    set((state) => ({
      items: quantity === 0
        ? state.items.filter((item) => item.cartItemId !== cartItemId)
        : state.items.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity } : item)),
    })),

  clearCart: () => set({ items: [] }),
}));
