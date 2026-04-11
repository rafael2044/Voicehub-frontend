"use client";

import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link"; 
import Image from "@tiptap/extension-image"; // 1. NOVA EXTENSÃO DE IMAGEM
import { 
  Megaphone, Edit, FileText, Bold, Italic, Strikethrough, 
  Heading2, List, ListOrdered, Undo, Redo, 
  Link as LinkIcon, Unlink, X, Image as ImageIcon, Paperclip, Loader2
} from "lucide-react";
import { UserData } from "@/hooks/useVoiceHub";
import { MuralData } from "@/types";
import { muralService } from "@/services/muralService";
import { api } from "@/services/api"; // Importando a API para o upload
import AlertModal from "@/components/AlertModal";

// --- BARRA DE FERRAMENTAS DO EDITOR ---
const MenuBar = ({ editor }: { editor: any }) => {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const btnClass = (isActive: boolean) =>
    `p-2 rounded-md transition-colors ${
      isActive 
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" 
        : "text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
    }`;

  // Lógica de Links
  const openLinkModal = () => {
    const previousUrl = editor.getAttributes('link').href;
    setLinkInput(previousUrl || "");
    setIsLinkModalOpen(true);
  };

  const applyLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkInput.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const validUrl = /^https?:\/\//i.test(linkInput.trim()) ? linkInput.trim() : `https://${linkInput.trim()}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href: validUrl }).run();
    }
    setIsLinkModalOpen(false);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setIsLinkModalOpen(false);
  };

  // 2. LÓGICA DE UPLOAD DE IMAGEM
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImg(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      // Adiciona a base da URL caso a API retorne apenas o caminho relativo
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
      const fullUrl = response.data.url.startsWith("http") ? response.data.url : baseUrl + response.data.url;
      
      editor.chain().focus().setImage({ src: fullUrl }).run();
    } catch (error) {
      console.error("Erro no upload da imagem:", error);
      alert("Erro ao enviar a imagem.");
    } finally {
      setIsUploadingImg(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  // 3. LÓGICA DE UPLOAD DE DOCUMENTO (Anexo)
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
      const fullUrl = response.data.url.startsWith("http") ? response.data.url : baseUrl + response.data.url;
      
      // MUDANÇA: Injetamos o HTML do link já construído. 
      // Isso força o Tiptap a reconhecer como um hiperlink ativo imediatamente.
      editor.chain().focus()
        .insertContent(` &nbsp; 📎 <a href="${fullUrl}" target="_blank" rel="noopener noreferrer">${file.name}</a> &nbsp; `)
        .run();

    } catch (error) {
      console.error("Erro no upload do documento:", error);
      alert("Erro ao enviar o documento.");
    } finally {
      setIsUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = "";
    }
  };
  
  return (
    <>
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-t-lg transition-colors relative">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))} title="Negrito">
          <Bold size={18} />
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))} title="Itálico">
          <Italic size={18} />
        </button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive("strike"))} title="Tachado">
          <Strikethrough size={18} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1 self-center"></div>
        
        <button onClick={openLinkModal} className={btnClass(editor.isActive("link"))} title="Inserir/Editar Link">
          <LinkIcon size={18} />
        </button>

        {/* NOVOS BOTÕES DE UPLOAD */}
        <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        <button onClick={() => imageInputRef.current?.click()} disabled={isUploadingImg} className={`${btnClass(false)} disabled:opacity-50`} title="Inserir Imagem">
          {isUploadingImg ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
        </button>

        <input type="file" ref={docInputRef} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" onChange={handleDocUpload} />
        <button onClick={() => docInputRef.current?.click()} disabled={isUploadingDoc} className={`${btnClass(false)} disabled:opacity-50`} title="Anexar Documento">
          {isUploadingDoc ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
        </button>

        <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1 self-center"></div>
        
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive("heading", { level: 2 }))} title="Título">
          <Heading2 size={18} />
        </button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))} title="Lista">
          <List size={18} />
        </button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))} title="Lista Numerada">
          <ListOrdered size={18} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1 self-center"></div>
        
        <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-100 disabled:opacity-30">
          <Undo size={18} />
        </button>
        <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-100 disabled:opacity-30">
          <Redo size={18} />
        </button>
      </div>

      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 animate-in fade-in transition-colors">
          <div className="bg-white dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 transition-colors">
            
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 transition-colors">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                <LinkIcon size={20} className="text-blue-500" />
                Inserir Link
              </h3>
              <button onClick={() => setIsLinkModalOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={applyLink} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">URL de Destino</label>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="ex: https://www.google.com"
                  value={linkInput} 
                  onChange={e => setLinkInput(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors" 
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                {editor.isActive("link") && (
                  <button 
                    type="button" 
                    onClick={removeLink} 
                    className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Remover Link"
                  >
                    <Unlink size={20} />
                  </button>
                )}
                <div className="flex-1"></div>
                <button type="button" onClick={() => setIsLinkModalOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">
                  Aplicar
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
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
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-sm my-4 border border-gray-200 dark:border-slate-700',
        },
      }),
      Link.configure({
        openOnClick: false, 
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 underline cursor-pointer hover:text-blue-800 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1',
          target: '_blank', 
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content: editorContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert max-w-none focus:outline-none min-h-[200px] p-4 text-gray-700 dark:text-slate-200 transition-colors",
      },
    },
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML());
    },
  });

  useEffect(() => {
    const fetchMural = async () => {
      try {
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
      await muralService.updateMural(editorContent); 
      setAlertInfo({ isOpen: true, type: "success", title: "Sucesso!", message: "Mural atualizado com sucesso!" });      
      setIsEditing(false);
      
      setMural({
        id: Date.now(),
        content: editorContent,
        updated_by_id: currentUser.id, 
        timestamp: new Date().toISOString(),
        updater: { name: currentUser.name } 
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "Erro ao conectar com o servidor.";
      setAlertInfo({ isOpen: true, type: "error", title: "Ops!", message: errorMsg });    
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500 dark:text-slate-500 flex-1 flex items-center justify-center">Carregando avisos...</div>;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
      
      {/* Cabeçalho */}
      <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 transition-colors">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800 dark:text-slate-100">
          <Megaphone className="text-amber-500" size={24} />
          Avisos Gerais
        </h2>
        
        {currentUser.role === "user_admin" && (
          <button
            onClick={() => {
              setIsEditing(!isEditing);
              if (!isEditing && editor) editor.commands.setContent(editorContent);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Edit size={16} />
            {isEditing ? "Cancelar Edição" : "Editar Mural"}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isEditing ? (
          <div className="space-y-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-2">
            
            <div className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all relative">
              <MenuBar editor={editor} />
              <div className="max-h-[400px] overflow-y-auto bg-white dark:bg-slate-800 cursor-text transition-colors" onClick={() => editor?.commands.focus()}>
                <EditorContent editor={editor} />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                Salvar e Publicar
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {!mural || !mural.content || mural.content === "<p></p>" ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-slate-500">
                <FileText size={48} className="mb-4 opacity-30" />
                <p>Nenhum aviso fixado no momento.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div
                  className="prose dark:prose-invert max-w-none text-gray-800 dark:text-slate-200 transition-colors"
                  dangerouslySetInnerHTML={{ __html: mural.content }}
                />
                <div className="text-xs text-gray-400 dark:text-slate-500 pt-6 border-t border-gray-100 dark:border-slate-700 flex items-center gap-1 uppercase tracking-wider font-semibold transition-colors">
                  Atualizado por <span className="text-gray-600 dark:text-slate-300">{mural.updater.name || "Administrador"}</span> em{" "}
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