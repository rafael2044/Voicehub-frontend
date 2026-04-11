import { LogOut, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        
        {/* Cabeçalho e Ícone */}
        <div className="p-6 flex flex-col items-center text-center relative bg-gray-50/50 border-b border-gray-100">
          <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
          
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-50 text-red-500">
            <LogOut size={32} className="ml-1" />
          </div>
          
          <h3 className="text-xl font-bold mb-2 text-gray-800">
            {title}
          </h3>
          <p className="text-gray-600">
            {message}
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="p-4 bg-gray-50 flex gap-3 justify-center">
          <button 
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
          >
            Sair do Sistema
          </button>
        </div>

      </div>
    </div>
  );
}