import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { authApi, User } from "@/lib/auth";
import { Plus, Edit, Trash2, Camera } from "lucide-react";

export default function Settings() {
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

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => authApi.getCurrentUser(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
  });

  const [profileData, setProfileData] = useState({
    fullName: authData?.user?.fullName || "",
    email: authData?.user?.email || "",
    role: authData?.user?.role || "employee",
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
                  {authData?.user?.fullName?.split(' ').map(name => name[0]).join('').slice(0, 2) || "U"}
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
              <Select value={profileData.role} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="employee">Empleado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isEditingProfile ? (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 bg-primary text-white hover:bg-blue-800"
                >
                  Guardar
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsEditingProfile(true)}
                className="w-full bg-primary text-white hover:bg-blue-800"
              >
                Editar Perfil
              </Button>
            )}
          </CardContent>
        </Card>

        {/* System Preferences */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Preferencias del Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div>
              <Label htmlFor="currency">Moneda predeterminada</Label>
              <Select value={systemSettings.defaultCurrency} onValueChange={(value) => 
                setSystemSettings(prev => ({ ...prev, defaultCurrency: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="timezone">Zona horaria</Label>
              <Select value={systemSettings.timezone} onValueChange={(value) => 
                setSystemSettings(prev => ({ ...prev, timezone: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Bogota">America/Bogota (UTC-5)</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                  <SelectItem value="Europe/Madrid">Europe/Madrid (UTC+1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="darkMode"
                  checked={systemSettings.darkMode}
                  onCheckedChange={(checked) => 
                    setSystemSettings(prev => ({ ...prev, darkMode: checked as boolean }))
                  }
                />
                <Label htmlFor="darkMode" className="text-sm font-medium text-gray-700">
                  Modo oscuro
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="emailNotifications"
                  checked={systemSettings.emailNotifications}
                  onCheckedChange={(checked) => 
                    setSystemSettings(prev => ({ ...prev, emailNotifications: checked as boolean }))
                  }
                />
                <Label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                  Notificaciones por email
                </Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="telegramNotifications"
                  checked={systemSettings.telegramNotifications}
                  onCheckedChange={(checked) => 
                    setSystemSettings(prev => ({ ...prev, telegramNotifications: checked as boolean }))
                  }
                />
                <Label htmlFor="telegramNotifications" className="text-sm font-medium text-gray-700">
                  Notificaciones de Telegram
                </Label>
              </div>
            </div>
            
            <Button className="w-full bg-secondary text-white hover:bg-green-700">
              Guardar Preferencias
            </Button>
          </CardContent>
        </Card>

        {/* Categories Management */}
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-800">Categorías</CardTitle>
              <Button
                onClick={() => {
                  setEditingCategory(null);
                  resetCategoryForm();
                  setIsCategoryModalOpen(true);
                }}
                className="bg-secondary text-white hover:bg-green-700"
                size="sm"
              >
                <Plus className="mr-1" size={16} />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Gastos</h4>
                <div className="space-y-2">
                  {expenseCategories.map((category: any) => (
                    <div key={category.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-medium text-gray-800">{category.name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditCategory(category)}
                          className="text-primary hover:text-blue-800"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-error hover:text-red-800"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {incomeCategories.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Ingresos</h4>
                  <div className="space-y-2">
                    {incomeCategories.map((category: any) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="font-medium text-gray-800">{category.name}</span>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditCategory(category)}
                            className="text-primary hover:text-blue-800"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-error hover:text-red-800"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmitCategory} className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Nombre de la categoría</Label>
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
              <Select 
                value={newCategory.type} 
                onValueChange={(value) => setNewCategory(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Gasto</SelectItem>
                  <SelectItem value="income">Ingreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Color</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewCategory(prev => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newCategory.color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex space-x-4 pt-4">
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
              <Button
                type="submit"
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                className="flex-1 bg-primary text-white hover:bg-blue-800"
              >
                {createCategoryMutation.isPending || updateCategoryMutation.isPending 
                  ? "Guardando..." 
                  : editingCategory ? "Actualizar" : "Crear"
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
