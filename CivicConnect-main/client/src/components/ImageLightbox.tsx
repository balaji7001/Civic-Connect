import { useEffect } from "react";
import { FiX } from "react-icons/fi";

interface ImageLightboxProps {
  imageUrl?: string;
  title?: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageLightbox = ({ imageUrl, title, isOpen, onClose }: ImageLightboxProps) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-slate-900" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-slate-950/75 text-white transition hover:bg-slate-950"
          aria-label="Close image preview"
        >
          <FiX size={20} />
        </button>
        <img src={imageUrl} alt={title || "Complaint image"} className="max-h-[90vh] w-full object-contain" />
      </div>
    </div>
  );
};

export default ImageLightbox;
