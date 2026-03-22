interface LoaderProps {
  label?: string;
  className?: string;
}

const Loader = ({ label = "Loading...", className = "py-16" }: LoaderProps) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-civic-teal border-t-transparent"></div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-300">{label}</p>
    </div>
  );
};

export default Loader;
