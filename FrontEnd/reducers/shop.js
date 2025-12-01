// reducers/shop.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  products: [],
  cartList: [],      // source unique pour l’UI (guest OU serveur)
  cartTimeLeft: 0,
};

const shopSlice = createSlice({
  name: "shop",
  initialState,
  reducers: {
    setProducts: (s, a) => {
      s.products = Array.isArray(a.payload) ? a.payload : [];
    },

    addOneToGuestCart: (s, a) => {
      s.cartList.push(a.payload);
    },

    setCartFromServer: (s, a) => {
      s.cartList = Array.isArray(a.payload) ? a.payload : [];
    },

    setCartFromGuest: (s, a) => {
      s.cartList = Array.isArray(a.payload) ? a.payload : [];
    },
    removeFromCartByIndex: (s, a) => {
      s.cartList = s.cartList.filter((_, i) => i !== a.payload.index);
    },

    clearCart: (s) => { s.cartList = []; },
    setCartTimeLeft: (s, a) => { s.cartTimeLeft = a.payload ?? 0; },
    resetShop: () => initialState,
  },
});

export const {
  setProducts,
  addOneToGuestCart,
  setCartFromServer,
  setCartFromGuest,
  removeFromCartByIndex,
  clearCart,
  setCartTimeLeft,
  resetShop,
} = shopSlice.actions;

export default shopSlice.reducer;