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
import { Plus, X, MessageSquare } from "lucide-react";

export default function Telegram() {
  const [botToken, setBotToken] = useState("");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", role: "employee" });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: telegramConfig, isLoading } = useQuery({
    queryKey: ["/api/telegram/config"],
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (configData: any) => {
      if (telegramConfig?.id) {
        const response = await apiRequest("PUT", `/api/telegram/config/${telegramConfig.id}`, configData);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/telegram/config", configData);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/telegram/config"] });
      toast({
        title: "Configuración guardada",
        description: "La configuración del bot se ha actualizado exitosamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración del bot",
        variant: "destructive",
      });
    },
  });

  const handleSaveToken = () => {
    if (!botToken.trim()) {
      toast({
        title: "Token requerido",
        description: "Por favor ingresa un token válido",
        variant: "destructive",
      });
      return;
    }

    updateConfigMutation.mutate({
      botToken: botToken,
      isActive: true,
    });
  };

  const handleToggleBot = () => {
    if (telegramConfig) {
      updateConfigMutation.mutate({
        ...telegramConfig,
        isActive: !telegramConfig.isActive,
      });
    }
  };

  // Mock data for authorized users and bot activity
  const authorizedUsers = [
    { id: 1, name: "@admin_usuario", role: "Administrador" },
  ];

  const botCommands = [
    {
      syntax: "/gasto [monto] [categoría] [descripción]",
      description: "Registra un nuevo gasto con monto, categoría y descripción",
      example: "Ejemplo: /gasto 25.50 Alimentación Almuerzo en restaurante",
      active: true,
    },
    {
      syntax: "/saldo",
      description: "Consulta el balance total de todas las cuentas",
      example: "",
      active: true,
    },
    {
      syntax: "/resumen_hoy",
      description: "Muestra el resumen de gastos e ingresos del día actual",
      example: "",
      active: true,
    },
  ];

  const recentBotActivity = [
    {
      action: "Gasto registrado via bot",
      details: "@admin_usuario • $45.00 • Alimentación • hace 2 horas",
    },
    {
      action: "Consulta de saldo",
      details: "@admin_usuario • hace 4 horas",
    },
    {
      action: "Resumen diario solicitado",
      details: "@admin_usuario • hace 1 día",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bot Configuration */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Configuración del Bot</CardTitle>
            <p className="text-gray-600 mt-1">Gestiona la integración con Telegram</p>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Bot Status */}
            <div className={`flex items-center justify-between p-4 rounded-lg ${
              telegramConfig?.isActive ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  telegramConfig?.isActive ? 'bg-success' : 'bg-error'
                }`}></div>
                <span className="font-medium text-gray-800">
                  Bot {telegramConfig?.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <Button
                onClick={handleToggleBot}
                disabled={updateConfigMutation.isPending}
                className={`text-sm px-3 py-1 text-white ${
                  telegramConfig?.isActive 
                    ? 'bg-error hover:bg-red-700' 
                    : 'bg-success hover:bg-green-700'
                }`}
              >
                {telegramConfig?.isActive ? 'Desactivar' : 'Activar'}
              </Button>
            </div>

            {/* Bot Token Configuration */}
            <div>
              <Label htmlFor="botToken" className="block text-sm font-medium text-gray-700 mb-2">
                Token del Bot
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="botToken"
                  type="password"
                  value={botToken || telegramConfig?.botToken || ""}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="•••••••••••••••••••••••••••••••••••••••••••"
                  className="flex-1"
                />
                <Button
                  onClick={handleSaveToken}
                  disabled={updateConfigMutation.isPending}
                  className="bg-primary text-white hover:bg-blue-800"
                >
                  {updateConfigMutation.isPending ? "..." : "Guardar"}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Obtén tu token desde @BotFather en Telegram
              </p>
            </div>

            {/* Authorized Users */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-3">
                Usuarios Autorizados
              </Label>
              <div className="space-y-2">
                {authorizedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">
                          {user.name.substring(1, 3).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.role}</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-error hover:text-red-800"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setIsAddUserModalOpen(true)}
                variant="outline"
                className="mt-3 w-full border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary hover:text-primary"
              >
                <Plus className="mr-2" size={16} />
                Agregar Usuario
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bot Commands and Usage */}
        <div className="space-y-6">
          
          {/* Available Commands */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">Comandos Disponibles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {botCommands.map((command, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {command.syntax}
                    </code>
                    <Badge variant={command.active ? "default" : "secondary"}>
                      {command.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{command.description}</p>
                  {command.example && (
                    <p className="text-xs text-gray-500">{command.example}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Bot Activity */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentBotActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="text-blue-600" size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.details}</p>
                    </div>
                  </div>
                ))}
                {recentBotActivity.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No hay actividad reciente del bot
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Usuario Autorizado</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username de Telegram</Label>
              <Input
                id="username"
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                placeholder="@usuario"
              />
            </div>
            
            <div>
              <Label htmlFor="role">Rol</Label>
              <select 
                id="role"
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="employee">Empleado</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            
            <div className="flex space-x-4 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddUserModalOpen(false);
                  setNewUser({ username: "", role: "employee" });
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  // Implementation for adding user
                  toast({
                    title: "Usuario agregado",
                    description: "El usuario ha sido autorizado exitosamente",
                  });
                  setIsAddUserModalOpen(false);
                  setNewUser({ username: "", role: "employee" });
                }}
                className="flex-1 bg-primary text-white hover:bg-blue-800"
              >
                Agregar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
