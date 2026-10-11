import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface ActionBtnProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;

  buttonName: string;
  buttonClass: string;
  children: React.ReactNode;
}

function ActionBtn({
  isOpen,
  onOpen,
  onClose,
  buttonName,
  buttonClass,
  children,
}: ActionBtnProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  // Ajustement de l'état pendant le rendu (au lieu d'un setState dans un effet)
  if (isOpen && !shouldRender) {
    setShouldRender(true);
  }
  if (!isOpen && isVisible) {
    setIsVisible(false);
  }

  useEffect(() => {
    if (isOpen) {
      const frame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    const timer = window.setTimeout(() => {
      setShouldRender(false);
    }, 280);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Le bouton qui ouvre */}
      <button
        type="button"
        className={buttonClass + " actionButtons"}
        onClick={onOpen}
      >
        {buttonName}
      </button>

      {/* Le menu */}
      {shouldRender &&
        createPortal(
          <div
            className={`actionOverlay ${isVisible ? "isOpen" : ""}`}
            onClick={onClose}
          >
            <div
              className={`actionMenu ${isVisible ? "isOpen" : ""}`}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="closeButton"
                onClick={onClose}
                aria-label="Fermer"
              >
                ×
              </button>
              <div className="actionMenuContent">{children}</div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export default ActionBtn;
