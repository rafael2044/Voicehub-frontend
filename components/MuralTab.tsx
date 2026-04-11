"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { 
  Megaphone, Edit, FileText, Bold, Italic, Strikethrough, 
  Heading2, List, ListOrdered, Undo, Redo 
} from "lucide-react";
import { UserData } from "@/hooks/useVoiceHub";
import { MuralData } from "@/types";
import { muralService } from "@/services/muralService";
import AlertModal from "@/components/AlertModal";

// CORRIGIDO: O MenuBar agora recebe o 'editor' corretamente via props
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const btnClass = (isActive: boolean) =>
    `p-2 rounded-md transition-colors ${
      isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))} title="Negrito">
        <Bold size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))} title="Itálico">
        <Italic size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive("strike"))} title="Tachado">
        <Strikethrough size={18} />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive("heading", { level: 2 }))} title="Título">
        <Heading2 size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))} title="Lista">
        <List size={18} />
      </button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))} title="Lista Numerada">
        <ListOrdered size={18} />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
      <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-2 text-gray-500 hover:text-gray-800 disabled:opacity-30">
        <Undo size={18} />
      </button>
      <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-2 text-gray-500 hover:text-gray-800 disabled:opacity-30">
        <Redo size={18} />
      </button>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function MuralTab({ currentUser }: { currentUser: UserData }) {
  const [mural, setMural] = useState<MuralData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorContent, setEditorContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [alertInfo, setAlertInfo] = useState<{isOpen: boolean, type: "success" | "error", title: string, message: string}>({ 
    isOpen: false, type: "success", title: "", message: "" 
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: editorContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none min-h-[200px] p-4 text-gray-700",
      },
    },
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML());
    },
  });

  useEffect(() => {
    const fetchMural = async () => {
      try {
        // O Axios injeta o Token automaticamente no cabeçalho
        const data = await muralService.getMural();
        
        setMural(data);
        const content = data?.content || "";
        setEditorContent(content);
        if (editor) editor.commands.setContent(content);
      } catch (err) {
        console.error("Erro ao buscar mural:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMural();
  }, [editor]);

  const handleSave = async () => {
    try {
      // Envia para o backend
      await muralService.updateMural(editorContent); 
      
      setAlertInfo({ isOpen: true, type: "success", title: "Sucesso!", message: "Mural atualizado com sucesso!" });      setIsEditing(false);
      
      // Atualiza o estado local usando os dados que já temos no frontend!
      setMural({
        id: Date.now(), // ID provisório apenas para o React não reclamar
        content: editorContent, // Pega o texto direto do editor
        updated_by_id: currentUser.id, 
        timestamp: new Date().toISOString(),
        updater: { name: currentUser.name } // Puxa o nome de quem acabou de salvar
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "Erro ao conectar com o servidor.";
      setAlertInfo({ isOpen: true, type: "error", title: "Ops!", message: errorMsg });    
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500 flex-1 flex items-center justify-center">Carregando avisos...</div>;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
          <Megaphone className="text-amber-500" size={24} />
          Avisos Gerais
        </h2>
        
        {/* MAGIA DA AUTENTICAÇÃO: Só exibe o botão se for Administrador */}
        {currentUser.role === "user_default" && (
          <button
            onClick={() => {
              setIsEditing(!isEditing);
              if (!isEditing && editor) editor.commands.setContent(editorContent);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Edit size={16} />
            {isEditing ? "Cancelar Edição" : "Editar Mural"}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isEditing ? (
          /* --- ÁREA DE EDIÇÃO --- */
          <div className="space-y-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2">
            
            <div className="bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
              <MenuBar editor={editor} />
              <div className="max-h-[400px] overflow-y-auto bg-white cursor-text" onClick={() => editor?.commands.focus()}>
                <EditorContent editor={editor} />
              </div>
            </div>

            {/* CAIXA DE SENHA (PIN) FOI REMOVIDA DAQUI */}
            <div className="flex justify-end mt-6">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Salvar e Publicar
              </button>
            </div>
          </div>
        ) : (
          /* --- ÁREA DE VISUALIZAÇÃO --- */
          <div className="max-w-4xl mx-auto">
            {!mural || !mural.content || mural.content === "<p></p>" ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FileText size={48} className="mb-4 opacity-30" />
                <p>Nenhum aviso fixado no momento.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div
                  className="prose max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: mural.content }}
                />
                <div className="text-xs text-gray-400 pt-6 border-t border-gray-100 flex items-center gap-1 uppercase tracking-wider font-semibold">
                  Atualizado por <span className="text-gray-600">{mural.updater.name || "Administrador"}</span> em{" "}
                  {new Date(mural.timestamp).toLocaleString("pt-BR")}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <AlertModal 
        isOpen={alertInfo.isOpen} 
        type={alertInfo.type} 
        title={alertInfo.title} 
        message={alertInfo.message} 
        onClose={() => setAlertInfo({ ...alertInfo, isOpen: false })} 
      />
    </div>
  );
}