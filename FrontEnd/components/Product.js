import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useStore } from "react-redux";
import { setCartFromServer, addOneToGuestCart } from "../reducers/shop";
import { fetchWithAuth } from "../lib/api";

import prodStyles from "../styles/Product.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCartShopping, faXmark } from "@fortawesome/free-solid-svg-icons";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function Product() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value || state.user);
  const store = useStore();
  const products = useSelector((state) => state.shop.products);
  const [showAddedAnimation, setShowAddedAnimation] = useState(false);
  const [jumpAddIndex, setJumpAddIndex] = useState(null);
  const [jumpLikeIndex, setJumpLikeIndex] = useState(null);

  function toUICart(serverCart = []) {
    return serverCart
      .filter((i) => i?.productId)
      .map((i) => ({ ...i.productId, quantity: i.quantity }));
  }

  async function handleAdd(product, idx) {
    const productId = product._id || product.id;
    if (!productId) return alert("ID produit manquant");

    const accessToken = user?.accessToken;
    if (accessToken) {
      try {
        // console.log('AT len:', user?.accessToken?.length, 'AT head:', user?.accessToken?.slice(0,20));
        const res = await fetchWithAuth("/shop/cart/add", {
          method: "POST",
          body: { productId, quantity: 1 },
          getState: store.getState,
          dispatch,
        });

        if (res.ok && res.data?.success) {
          const uiCart = (res.data.cart || [])
            .filter((i) => i?.productId)
            .map((i) => ({ ...i.productId, quantity: i.quantity }));
          dispatch(setCartFromServer(uiCart));
        } else if (!user?.accessToken) {
          dispatch(addOneToGuestCart({ ...product, quantity: 1 }));
        }
      } catch (e) {
        return alert("Erreur réseau sur ajout panier");
      }
    } else {
      const key = "guestCart";
      const arr = JSON.parse(localStorage.getItem(key) || "[]");
      const i = arr.findIndex(
        (it) => String(it.productId) === String(productId)
      );
      if (i >= 0) arr[i].quantity += 1;
      else arr.push({ productId, quantity: 1 });
      localStorage.setItem(key, JSON.stringify(arr));
      dispatch(addOneToGuestCart({ ...product, quantity: 1 }));
    }

    setShowAddedAnimation(idx);
    setJumpAddIndex(idx);
    setTimeout(() => setJumpAddIndex(null), 300);
    setTimeout(() => setShowAddedAnimation(null), 1210);
  }

  // console.log("products:", products)

  return (
    <div 
      data-component="ProductGrid"
      className={prodStyles.body}
    >
      {products
        .filter((data) => data.category !== "Deposit")
        .map((data, i) => {
          return (
            <div
              key={data._id || data.id}
              data-component="ProductCard"
              data-product-id={data._id || data.id}
              data-product-index={i}
              className={prodStyles.containerProducts}
            >
              <div 
                data-component="ProductCardWrapper"
                className={prodStyles.Product}
              >
                <div 
                  data-component="ProductImageContainer"
                  className={prodStyles.imgDiv}
                >
                  <img
                    data-component="ProductImage"
                    src={data.img ? `/Artwork/${data.img}` : "/placeholder.jpg"}
                    className={prodStyles.img}
                    alt={data.name}
                  />

                  <div 
                    data-component="ProductDetailsPanel"
                    className={prodStyles.infos}
                  >
                    <div 
                      data-component="ProductName"
                      className={prodStyles.descriptionDiv}
                    >
                      {data.name}
                    </div>

                    <div 
                      data-component="ProductDescription"
                      className={prodStyles.descriptionDiv}
                    >
                      {data.description}
                    </div>

                    <div 
                      data-component="ProductSize"
                      className={prodStyles.descriptionDiv}
                    >
                      {data.size}
                    </div>

                    <div 
                      data-component="ProductPrice"
                      className={prodStyles.descriptionDiv}
                    >
                      {data.price}€
                    </div>

                    <div 
                      data-component="ProductCategory"
                      className={prodStyles.descriptionDiv}
                    >
                      {data.category}
                    </div>

                    <div 
                      data-component="ProductStockQuantity"
                      className={prodStyles.descriptionDiv}
                    >
                      {data.quantity}
                    </div>

                    <div 
                      data-component="ProductDateOnline"
                      className={prodStyles.descriptionDiv}
                    >
                      {data.dateOnline}
                    </div>

                    <div 
                      data-component="ProductPromotion"
                      className={prodStyles.descriptionDiv}
                    >
                      {data.promotion}
                    </div>

                    <div 
                      data-component="ProductActionsContainer"
                      className={prodStyles.btns}
                    >
                      <div
                        data-component="ProductDiscount"
                        className={prodStyles.btnAddToCart}
                      >
                        -3
                      </div>

                      <div 
                        data-component="AddToCartButtonWrapper"
                        className={prodStyles.btnAndanimDiv}
                      >
                        {showAddedAnimation === i && (
                          <div 
                            data-component="AddedAnimation"
                            className={prodStyles.AddedAnimDiv}
                          >
                            <img
                              data-component="AddedAnimationGif"
                              src="/Anim/AddedAnimation.gif"
                              className={prodStyles.AddedAnim}
                              alt="Added animation"
                            />
                          </div>
                        )}
                        <FontAwesomeIcon
                          data-component="AddToCartButton"
                          data-product-id={data._id || data.id}
                          icon={faCartShopping}
                          className={
                            prodStyles.btnAddToCart +
                            (jumpAddIndex === i ? " " + prodStyles.btnJump : "")
                          }
                          onClick={() => handleAdd(data, i)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

export default Product;