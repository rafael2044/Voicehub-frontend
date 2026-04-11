"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Users, Plus, Edit, Trash2, Shield, User as UserIcon } from "lucide-react";
import AlertModal from "./AlertModal";
import ConfirmModal from "./ConfirmModal";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modais de Estado
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  const [alertInfo, setAlertInfo] = useState({ isOpen: false, type: "success" as "success" | "error", title: "", message: "" });

  // Formulário
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "user_default", is_active: true });

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/users");
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openNewUserModal = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", password: "", role: "user_default", is_active: true });
    setIsFormOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: "", role: user.role, is_active:user.is_active });
    setIsFormOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Editando (PUT)
        await api.put(`/api/users/${editingUser.id}`, formData);
        setAlertInfo({ isOpen: true, type: "success", title: "Sucesso!", message: "Usuário atualizado com sucesso." });
      } else {
        // Criando (POST)
        if (!formData.password) {
          setAlertInfo({ isOpen: true, type: "error", title: "Erro", message: "A senha é obrigatória para novos usuários." });
          return;
        }
        await api.post("/api/users", formData);
        setAlertInfo({ isOpen: true, type: "success", title: "Sucesso!", message: "Usuário cadastrado com sucesso." });
      }
      setIsFormOpen(false);
      fetchUsers();
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Erro ao salvar usuário.";
      setAlertInfo({ isOpen: true, type: "error", title: "Ops!", message: msg });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/api/users/${userToDelete.id}`);
      setAlertInfo({ isOpen: true, type: "success", title: "Excluído", message: "Usuário removido com sucesso." });
      fetchUsers();
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Erro ao excluir usuário.";
      setAlertInfo({ isOpen: true, type: "error", title: "Ops!", message: msg });
    } finally {
      setUserToDelete(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
      <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
          <Users className="text-blue-500" size={24} />
          Gestão de Usuários
        </h2>
        <button 
          onClick={openNewUserModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <p className="text-center text-gray-400 mt-10">Carregando usuários...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                  <th className="p-4 font-medium">Nome</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Nível de Acesso</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">{user.name}</td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.role === 'user_admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {user.role === 'user_admin' ? <Shield size={12} /> : <UserIcon size={12} />}
                        {user.role === 'user_admin' ? 'Administrador' : 'Usuário Padrão'}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Ativo</span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Desativado</span>
                      )}
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => setUserToDelete(user)}
                        disabled={!user.is_active}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={user.is_active ? "Desativar Usuário" : "Usuário já desativado"}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Formulário (Criar/Editar) */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-800">{editingUser ? "Editar Usuário" : "Novo Usuário"}</h3>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha {editingUser && <span className="text-xs text-gray-400 font-normal">(Deixe em branco para não alterar)</span>}
                </label>
                <input type="password" required={!editingUser} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nível de Acesso</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="user_default">Usuário Padrão</option>
                  <option value="user_admin">Administrador</option>
                </select>
              </div>
                <div className="flex items-center gap-2 pt-2">
                    <input 
                        type="checkbox" 
                        id="isActiveCheckbox"
                        checked={formData.is_active} 
                        onChange={e => setFormData({...formData, is_active: e.target.checked})} 
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="isActiveCheckbox" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                        Conta Ativa (Permitir acesso ao sistema)
                    </label>
                </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-2 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!userToDelete} title="Excluir Usuário?" message={`Tem certeza que deseja desativar ${userToDelete?.name}?`} onCancel={() => setUserToDelete(null)} onConfirm={handleDeleteUser} />
      <AlertModal isOpen={alertInfo.isOpen} type={alertInfo.type} title={alertInfo.title} message={alertInfo.message} onClose={() => setAlertInfo({ ...alertInfo, isOpen: false })} />
    </div>
  );
}