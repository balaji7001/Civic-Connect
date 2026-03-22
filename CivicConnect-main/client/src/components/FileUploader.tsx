import { useEffect, useState } from "react";
import { FiAlertCircle, FiImage } from "react-icons/fi";

const maxFileSizeBytes = 5 * 1024 * 1024;
const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];

interface FileUploaderProps {
  onChange: (file: File | null) => void;
}

const FileUploader = ({ onChange }: FileUploaderProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900/60">
      <label className="block cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-sm font-semibold text-slate-700 transition hover:border-civic-teal hover:text-civic-teal dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
        Upload evidence image
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] || null;

            if (!file) {
              onChange(null);
              setError("");
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }
              return;
            }

            if (!acceptedTypes.includes(file.type)) {
              onChange(null);
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }
              setError("Only JPG, JPEG, PNG, and WebP files are supported.");
              event.target.value = "";
              return;
            }

            if (file.size > maxFileSizeBytes) {
              onChange(null);
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }
              setError("Please upload an image smaller than 5 MB.");
              event.target.value = "";
              return;
            }

            onChange(file);
            setError("");
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(URL.createObjectURL(file));
          }}
        />
      </label>
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">Accepted: JPG, JPEG, PNG, WebP up to 5 MB</p>
      {error ? (
        <p className="mt-3 flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-200">
          <FiAlertCircle size={14} />
          {error}
        </p>
      ) : null}
      {previewUrl ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
          <img src={previewUrl} alt="Complaint preview" className="h-48 w-full object-cover" />
          <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
            <FiImage size={14} />
            Preview of the image that will be uploaded
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default FileUploader;
