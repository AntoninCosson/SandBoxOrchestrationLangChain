import shopStyle from "../styles/Shop.module.css";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";

import Product from "./Product";
import { setProducts } from "../reducers/shop";


import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Shop = ({}) => {

  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.value);

  useEffect(() => {

    fetch("http://localhost:3000/shop")
      .then((response) => response.json())
      .then((data) => {
        dispatch(setProducts(data.products));
      });


  }, [dispatch]);

  return (

    <div 
      data-component="ShopContainer"
      className={shopStyle.body}
    >
      <div 
        data-component="ShopProductsGrid"
        className={shopStyle.product}
      >
       <Product/>
      </div>
    </div>

  );
};

export default Shop;