import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  product_id: string
  name: string
  price: number
  image: string
  slug: string
  quantity: number
}

export interface Coupon {
  code: string
  type: 'percentage' | 'fixed'
  discount: number
}

interface CartStore {
  items: CartItem[]
  coupon: Coupon | null
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (product_id: string) => void
  updateQuantity: (product_id: string, quantity: number) => void
  clearCart: () => void
  applyCoupon: (coupon: Coupon) => void
  removeCoupon: () => void
  getItemCount: () => number
  getSubtotal: () => number
  getDiscount: () => number
  getTotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (newItem) => {
        const existing = get().items.find(i => i.product_id === newItem.product_id)
        if (existing) {
          set(state => ({
            items: state.items.map(i =>
              i.product_id === newItem.product_id ? { ...i, quantity: i.quantity + 1 } : i
            ),
            isOpen: true,
          }))
        } else {
          set(state => ({ items: [...state.items, { ...newItem, quantity: 1 }], isOpen: true }))
        }
      },

      removeItem: (product_id) =>
        set(state => ({ items: state.items.filter(i => i.product_id !== product_id) })),

      updateQuantity: (product_id, quantity) => {
        if (quantity < 1) {
          get().removeItem(product_id)
          return
        }
        set(state => ({
          items: state.items.map(i => i.product_id === product_id ? { ...i, quantity } : i),
        }))
      },

      clearCart: () => set({ items: [], coupon: null }),
      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      getDiscount: () => {
        const sub = get().getSubtotal()
        const c = get().coupon
        if (!c) return 0
        return Math.min(c.discount, sub)
      },

      getTotal: () => get().getSubtotal() - get().getDiscount(),
    }),
    {
      name: 'pantry-legend-cart',
      partialize: (state) => ({ items: state.items, coupon: state.coupon }),
    }
  )
)
