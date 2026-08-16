import type { CSSProperties, Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";

type CardProps = {
  enginePlayerHand: Array<{ id: number; name?: string }>;
  selectedCard: number[];
  setSelectedCard: Dispatch<SetStateAction<number[]>>;
};

export default function Card({ enginePlayerHand, selectedCard, setSelectedCard }: CardProps) {




  return (
    <>
      {enginePlayerHand.map((el, index) => {
        const id = String(el.id).padStart(2, "0");
        const cardLink = `https://tda-1.onrender.com/card/${id}_theme1.png`;
        const numberOfCards = enginePlayerHand.length;
        const weight = 2.9;

        const translateY = () => {
          if (Math.round(numberOfCards / 2) === index + 1) {
            return `translateY(${-weight * 1.2 * (numberOfCards - index - 1)}px)`;
          }
          if (index < Math.round(numberOfCards / 2)) {
            return `translateY(${-weight * (index + 1)}px)`;
          }
          return `translateY(${-weight * (numberOfCards - index)}px)`;
        };

        const rotate = () => {
          const center = (numberOfCards - 1) / 2;
          const angle = (index - center) * 1.5;
          return `rotate(${angle}deg)`;
        };


        
        return (
          <div key={index}>
            <img
              src={cardLink}
              alt={el.name}
              className={selectedCard.includes(el.id) ? "cardImg cardSelected" : "cardImg"}
              style={{ "--card-transform": `${translateY()} ${rotate()}` } as CSSProperties}
              onClick={() => {
                if (selectedCard.includes(el.id)) {
                  setSelectedCard(selectedCard.filter((id) => id !== el.id));
                } else {
                  setSelectedCard([...selectedCard, el.id]);
                }
              }}
                onMouseDown={() => {
                setIsDragging(true);
              }}
              onMouseUp={() => {
                setIsDragging(false);
              }}
            />
          </div>
        );
      })}
    </>
  );
}
