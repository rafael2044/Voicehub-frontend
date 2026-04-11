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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        
        <div className={`p-6 flex flex-col items-center text-center relative ${isSuccess ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
          
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {isSuccess ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
          </div>
          
          <h3 className={`text-xl font-bold mb-2 ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>
            {title}
          </h3>
          <p className="text-gray-600">
            {message}
          </p>
        </div>

        <div className="p-4 bg-gray-50 flex justify-center">
          <button 
            onClick={onClose}
            className={`w-full py-2.5 rounded-lg font-medium text-white transition-colors ${isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}