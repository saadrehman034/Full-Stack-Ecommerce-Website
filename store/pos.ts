import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type POSSession = {
  id: string;
  staffId: string;
  openedAt: string;
  openingCash: number;
}

interface POSState {
  session: POSSession | null;
  heldOrders: any[]; // we'll type this properly later
  
  startSession: (session: POSSession) => void;
  endSession: () => void;
  
  holdOrder: (order: any) => void;
  recallOrder: (orderId: string) => void;
  removeHeldOrder: (orderId: string) => void;
}

export const usePOSStore = create<POSState>()(
  persist(
    (set) => ({
      session: null,
      heldOrders: [],
      
      startSession: (session) => set({ session }),
      endSession: () => set({ session: null }),
      
      holdOrder: (order) => set((state) => ({
        heldOrders: [...state.heldOrders, { ...order, holdTime: new Date().toISOString() }]
      })),
      
      recallOrder: (orderId) => set((state) => ({
        heldOrders: state.heldOrders.filter(o => o.id !== orderId)
        // Note: calling recallOrder will also usually involve populating the active cart
      })),
      
      removeHeldOrder: (orderId) => set((state) => ({
        heldOrders: state.heldOrders.filter(o => o.id !== orderId)
      }))
    }),
    {
      name: 'vinzlu-pos',
    }
  )
)
