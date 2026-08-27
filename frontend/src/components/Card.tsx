import type { CSSProperties, Dispatch, MouseEvent, SetStateAction } from "react";

type CardProps = {
  enginePlayerHand: Array<{ id: number; name?: string }>;
  selectedCard: number[];
  setSelectedCard: Dispatch<SetStateAction<number[]>>;
};

function updateCardTilt(event: MouseEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  const bottomBoost = y > 0 ? 1.85 : 1;

  event.currentTarget.style.setProperty("--pointer-rotate-x", `${y * -22 * bottomBoost}deg`);
  event.currentTarget.style.setProperty("--pointer-rotate-y", `${x * 22}deg`);
}

function resetCardTilt(event: MouseEvent<HTMLElement>) {
  event.currentTarget.style.setProperty("--pointer-rotate-x", "0deg");
  event.currentTarget.style.setProperty("--pointer-rotate-y", "0deg");
}

export default function Card({ enginePlayerHand, selectedCard, setSelectedCard }: CardProps) {




  return (
    <>
      {enginePlayerHand.map((el, index) => {
        const id = String(el.id).padStart(2, "0");
        const cardLink = `https://tda-back.onrender.com/cards/${id}_theme1.png`;
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


        
        const cardStyle = {
          "--card-transform": `${translateY()} ${rotate()}`,
          "--card-rand": `${((index * 37) % 100) / 100}`,
        } as CSSProperties;
        const isSelected = selectedCard.includes(el.id);
        const hasSelection = selectedCard.length > 0;

        return (
          <div
            key={`${el.id}-${index}`}
            className={`
              playerCardWrapper
              ${hasSelection ? "handHasSelection" : ""}
              ${isSelected ? "cardIsSelected" : ""}
            `}
            style={cardStyle}
            onMouseMove={updateCardTilt}
            onMouseLeave={resetCardTilt}
          >
            <img
              src={cardLink}
              alt={el.name}
              className={isSelected ? "cardImg cardSelected" : "cardImg"}
              onClick={() => {
                if (isSelected) {
                  setSelectedCard(selectedCard.filter((id) => id !== el.id));
                } else {
                  setSelectedCard([...selectedCard, el.id]);
                }
              }}
            />
          </div>
        );
      })}
    </>
  );
}
