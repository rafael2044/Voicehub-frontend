import { LogOut, AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string; // NOVO: Permite mudar o texto do botão vermelho
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, message, confirmText = "Confirmar", onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null;

  // Lógica simples para mudar o ícone dependendo se é um aviso de saída ou exclusão
  const isLogout = title.toLowerCase().includes("sair");

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in transition-colors">
      <div className="bg-white dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 transition-colors">
        
        {/* Cabeçalho e Ícone */}
        <div className="p-6 flex flex-col items-center text-center relative bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700 transition-colors">
          <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
            <X size={20} />
          </button>
          
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 transition-colors">
            {isLogout ? <LogOut size={32} className="ml-1" /> : <AlertTriangle size={32} />}
          </div>
          
          <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-slate-100 transition-colors">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-slate-300 transition-colors">
            {message}
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-transparent dark:border-slate-700 flex gap-3 justify-center transition-colors">
          <button 
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg font-medium text-white bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 transition-colors shadow-sm"
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}