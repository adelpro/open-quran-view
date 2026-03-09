import { useRef, useEffect } from "react";
import type { SelectedTafseer } from "../types/tafseer";

type Props = {
  selectedTafseer: SelectedTafseer | null;
  theme: "light" | "dark";
  onClose: () => void;
};

export function TafseerDialog({ selectedTafseer, theme, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (selectedTafseer) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [selectedTafseer]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      onClose();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={`tafseer-dialog ${theme}`}
      onClick={handleBackdropClick}
    >
      {selectedTafseer && (
        <div className="tafseer-content">
          <div className="tafseer-header">
            <span className="tafseer-surah">سورة {selectedTafseer.surah}</span>
            {selectedTafseer.position && (
              <span className="tafseer-position">
                الموقع - {selectedTafseer.position}
              </span>
            )}
            <span className="tafseer-verse">آية {selectedTafseer.verse}</span>
          </div>
          {selectedTafseer.text && (
            <div className="tafseer-word">{selectedTafseer.text}</div>
          )}
          <div className="tafseer-text">{selectedTafseer.tafseer}</div>
          <div className="tafseer-actions">
            <button onClick={onClose} className="tafseer-close">
              إغلاق
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
