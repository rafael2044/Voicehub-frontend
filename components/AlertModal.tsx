import { AlertCircle, CheckCircle2, X } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  type: "success" | "error";
  title: string;
  message: string;
  onClose: () => void;
}

export default function AlertModal({ isOpen, type, title, message, onClose }: AlertModalProps) {
  if (!isOpen) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in transition-colors">
      <div className="bg-white dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 transition-colors">
        
        <div className={`p-6 flex flex-col items-center text-center relative transition-colors ${
          isSuccess 
            ? 'bg-green-50/50 dark:bg-green-900/10' 
            : 'bg-red-50/50 dark:bg-red-900/10'
        }`}>
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
            <X size={20} />
          </button>
          
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
            isSuccess 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          }`}>
            {isSuccess ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
          </div>
          
          <h3 className={`text-xl font-bold mb-2 transition-colors ${
            isSuccess 
              ? 'text-green-800 dark:text-green-400' 
              : 'text-red-800 dark:text-red-400'
          }`}>
            {title}
          </h3>
          <p className="text-gray-600 dark:text-slate-300 transition-colors">
            {message}
          </p>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-transparent dark:border-slate-700 flex justify-center transition-colors">
          <button 
            onClick={onClose}
            className={`w-full py-2.5 rounded-lg font-medium text-white transition-all shadow-sm hover:scale-[1.02] ${
              isSuccess 
                ? 'bg-green-600 dark:bg-green-500 hover:bg-green-700 dark:hover:bg-green-600' 
                : 'bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600'
            }`}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}