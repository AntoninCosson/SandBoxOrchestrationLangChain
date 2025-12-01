import { useState } from "react";
import homeStyles from "../styles/Home.module.css";

function ChairSavage({ chairRef, onFinish }) {
  const [chairClickCount, setChairClickCount] = useState(0);

  const getNoNoNoZone = () => {
    const safePortfolio = document.querySelector(`.${homeStyles.divPortfolio}`);
    const safeShop = document.querySelector(`.${homeStyles.divShop}`);
    const safeNextGuest = document.querySelector(`.${homeStyles.divNextGuest}`);
    return [safePortfolio, safeShop, safeNextGuest].map((el) =>
      el.getBoundingClientRect()
    );
  };

  const getYesYesYesZone = (zones) => {
    let x, y;
    let safe = false;

    while (!safe) {
      x = Math.floor(Math.random() * window.innerWidth);
      y = Math.floor(Math.random() * window.innerHeight);

      safe = zones.every((zone) => {
        const outside =
          x < zone.left || x > zone.right || y > zone.bottom || y < zone.top;
        return outside;
      });
    }
    return { x, y };
  };

  const handleChairClick = () => {
    const chairDiv = chairRef.current;
    if (!chairDiv) return;

    const chairImg = chairDiv.querySelector("img");
    if (!chairImg) return;

    chairImg.classList.add(homeStyles.animate);

    chairImg.addEventListener(
      "animationend",
      () => {
        chairImg.classList.remove(homeStyles.animate);

        setTimeout(() => {
          const NoNoNoZone = getNoNoNoZone();
          const { x, y } = getYesYesYesZone(NoNoNoZone);

          chairDiv.style.left = `${x}px`;
          chairDiv.style.top = `${y}px`;
          chairDiv.style.display = "block";

          const newCount = chairClickCount + 1;
          console.log("Click count:", newCount);
          setChairClickCount(newCount);

          if (newCount === 4) {
            chairDiv.style.display = "none";
            setTimeout(() => {
              onFinish();
            }, 100);
          }
        }, 50);
      },
      { once: true }
    );
  };

  return (
    <div
      ref={chairRef}
      data-component="ChairSavageContainer"
      className={`${homeStyles.divWhereIsChair} ${homeStyles.positionedChair}`}
    >
      <img
        onClick={handleChairClick}
        data-component="ChairSavageImage"
        className={homeStyles.Chair}
        src="/EcrisIcon/chair.svg"
        alt="Click the chair 4 times"
      />
    </div>
  );
}

export default ChairSavage;