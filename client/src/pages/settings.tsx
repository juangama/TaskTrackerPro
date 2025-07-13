import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Camera, Edit, Trash2 } from "lucide-react";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

interface SettingsProps {
  user: User;
}

export default function Settings({ user }: SettingsProps) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "#1976D2",
    type: "expense",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    role: user?.role || "employee",
  });

  const [systemSettings, setSystemSettings] = useState({
    defaultCurrency: "USD",
    timezone: "America/Bogota",
    darkMode: false,
    emailNotifications: true,
    telegramNotifications: true,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      const response = await apiRequest("POST", "/api/categories", categoryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoría creada",
        description: "La categoría se ha creado exitosamente",
      });
      setIsCategoryModalOpen(false);
      resetCategoryForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoría actualizada",
        description: "La categoría se ha actualizado exitosamente",
      });
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      resetCategoryForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoría eliminada",
        description: "La categoría se ha eliminado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
        variant: "destructive",
      });
    },
  });

  const resetCategoryForm = () => {
    setNewCategory({
      name: "",
      color: "#1976D2",
      type: "expense",
    });
  };

  const handleSaveProfile = () => {
    // Implementation for saving profile
    toast({
      title: "Perfil actualizado",
      description: "Los cambios en tu perfil se han guardado exitosamente",
    });
    setIsEditingProfile(false);
  };

  const handleSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingresa un nombre para la categoría",
        variant: "destructive",
      });
      return;
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        data: newCategory,
      });
    } else {
      createCategoryMutation.mutate(newCategory);
    }
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      color: category.color,
      type: category.type,
    });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const predefinedColors = [
    "#1976D2", "#388E3C", "#F57C00", "#D32F2F", "#7B1FA2",
    "#00796B", "#455A64", "#E64A19", "#303F9F", "#689F38"
  ];

  const expenseCategories = categories.filter((cat: any) => cat.type === "expense");
  const incomeCategories = categories.filter((cat: any) => cat.type === "income");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Profile Settings */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Perfil de Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <span className="text-white text-2xl font-semibold">
                  {user?.fullName?.split(' ').map(name => name[0]).join('').slice(0, 2) || "U"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white border border-gray-300 hover:bg-gray-50"
                >
                  <Camera size={12} />
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                value={profileData.fullName}
                onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                disabled={!isEditingProfile}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                disabled={!isEditingProfile}
              />
            </div>
            
            <div>
              <Label htmlFor="role">Rol</Label>
              <Input
                id="role"
                value={profileData.role}
                onChange={(e) => setProfileData(prev => ({ ...prev, role: e.target.value }))}
                disabled={!isEditingProfile}
              />
            </div>
            
            <div className="flex space-x-2">
              {isEditingProfile ? (
                <>
                  <Button onClick={handleSaveProfile} className="flex-1">
                    Guardar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditingProfile(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Configuración del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currency">Moneda por defecto</Label>
              <select
                id="currency"
                value={systemSettings.defaultCurrency}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, defaultCurrency: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="COP">COP - Peso Colombiano</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="timezone">Zona horaria</Label>
              <select
                id="timezone"
                value={systemSettings.timezone}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="America/Bogota">America/Bogota</option>
                <option value="America/New_York">America/New_York</option>
                <option value="Europe/Madrid">Europe/Madrid</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="darkMode">Modo oscuro</Label>
                <p className="text-sm text-gray-500">Cambiar entre tema claro y oscuro</p>
              </div>
              <input
                type="checkbox"
                id="darkMode"
                checked={systemSettings.darkMode}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, darkMode: e.target.checked }))}
                className="w-4 h-4 text-primary"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Notificaciones por email</Label>
                <p className="text-sm text-gray-500">Recibir alertas por correo electrónico</p>
              </div>
              <input
                type="checkbox"
                id="emailNotifications"
                checked={systemSettings.emailNotifications}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="w-4 h-4 text-primary"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="telegramNotifications">Notificaciones de Telegram</Label>
                <p className="text-sm text-gray-500">Recibir alertas en Telegram</p>
              </div>
              <input
                type="checkbox"
                id="telegramNotifications"
                checked={systemSettings.telegramNotifications}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, telegramNotifications: e.target.checked }))}
                className="w-4 h-4 text-primary"
              />
            </div>
            
            <Button className="w-full">
              Guardar Configuración
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Estadísticas Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">12</div>
              <p className="text-sm text-gray-600">Transacciones este mes</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">$2,450</div>
              <p className="text-sm text-gray-600">Ingresos totales</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">$1,230</div>
              <p className="text-sm text-gray-600">Gastos totales</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">$1,220</div>
              <p className="text-sm text-gray-600">Balance neto</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Management */}
      <Card className="card-shadow">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-800">Gestión de Categorías</CardTitle>
          <Button onClick={() => setIsCategoryModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Categoría
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expense Categories */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Categorías de Gastos</h3>
              <div className="space-y-2">
                {expenseCategories.map((category: any) => (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {expenseCategories.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No hay categorías de gastos</p>
                )}
              </div>
            </div>

            {/* Income Categories */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Categorías de Ingresos</h3>
              <div className="space-y-2">
                {incomeCategories.map((category: any) => (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {incomeCategories.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No hay categorías de ingresos</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitCategory} className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Nombre</Label>
              <Input
                id="categoryName"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Alimentación"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="categoryType">Tipo</Label>
              <select
                id="categoryType"
                value={newCategory.type}
                onChange={(e) => setNewCategory(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="expense">Gasto</option>
                <option value="income">Ingreso</option>
              </select>
            </div>
            
            <div>
              <Label>Color</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      newCategory.color === color ? "border-gray-800" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button type="submit" className="flex-1">
                {editingCategory ? "Actualizar" : "Crear"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                  resetCategoryForm();
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
