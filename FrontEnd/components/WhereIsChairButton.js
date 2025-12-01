import { useEffect, useRef } from "react";
import homeStyles from "../styles/Home.module.css";

function WhereIsChairButton({ shopRef, onReveal, show }) {
  const wIsChairRef = useRef(null);

  useEffect(() => {
    const handleCollision = () => {
      const WIC = wIsChairRef.current;
      const btnShop = shopRef.current;

      if (WIC && btnShop && show) {
        const WIClimit = WIC.getBoundingClientRect();
        const btnShopLimit = btnShop.getBoundingClientRect();

        const isOverlapping = !(
          WIClimit.bottom < btnShopLimit.top ||
          WIClimit.top > btnShopLimit.bottom ||
          WIClimit.right < btnShopLimit.left ||
          WIClimit.left > btnShopLimit.right
        );

        if (isOverlapping) {
          const distMin = window.innerHeight - btnShopLimit.bottom + 1;
          WIC.style.top = `${distMin}px`;
        } else {
          WIC.style.top = "63%";
        }
      }
    };

    handleCollision();
    window.addEventListener("resize", handleCollision);
    return () => window.removeEventListener("resize", handleCollision);
  }, []);

  return (
    <div 
      ref={wIsChairRef} 
      data-component="WhereIsChairButtonContainer"
      className={homeStyles.divWhereIsChair}
    >
      <button 
        data-component="WhereIsChairButton"
        className={homeStyles.svgButton} 
        onClick={onReveal}
      >
        <img
          data-component="WhereIsChairButtonIcon"
          className={homeStyles.whereIsChair}
          src="/EcrisIcon/whereischair.svg"
          alt="Where is Chair Easter Egg"
        />
      </button>
    </div>
  );
}

export default WhereIsChairButton;