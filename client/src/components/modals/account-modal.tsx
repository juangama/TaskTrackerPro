import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Save, X } from "lucide-react";

interface Account {
  id?: number;
  name: string;
  type: string;
  balance: string;
  bankName?: string;
  accountNumber?: string;
}

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account | null;
  mode: 'create' | 'edit';
}

export default function AccountModal({ isOpen, onClose, account, mode }: AccountModalProps) {
  const [formData, setFormData] = useState<Account>({
    name: "",
    type: "checking",
    balance: "",
    bankName: "",
    accountNumber: "",
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when modal opens/closes or account changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && account) {
        setFormData({
          name: account.name,
          type: account.type,
          balance: account.balance,
          bankName: account.bankName || "",
          accountNumber: account.accountNumber || "",
        });
      } else {
        setFormData({
          name: "",
          type: "checking",
          balance: "",
          bankName: "",
          accountNumber: "",
        });
      }
    }
  }, [isOpen, account, mode]);

  const createAccountMutation = useMutation({
    mutationFn: async (accountData: Account) => {
      console.log("Creating account with data:", {
        ...accountData,
        balance: String(accountData.balance), // Ensure balance is always a string
      });
      
      const response = await apiRequest("POST", "/api/accounts", {
        ...accountData,
        balance: String(accountData.balance), // Ensure balance is always a string
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Cuenta creada",
        description: "La cuenta se ha creado exitosamente",
      });
      onClose();
    },
    onError: (error: any) => {
      console.error("Create account error:", error);
      console.error("Error details:", {
        message: error?.message,
        response: error?.response,
        data: error?.response?.data,
        status: error?.response?.status
      });
      
      let message = "No se pudo crear la cuenta";
      
      if (error?.message?.includes("Unexpected token") || error?.message?.includes("<!DOCTYPE")) {
        message = "Error de conexión con el servidor. Verifica que el servidor esté corriendo.";
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        if (Array.isArray(errors)) {
          message = errors.map((err: any) => {
            const fieldName = err.field || 'campo';
            return `${fieldName}: ${err.message}`;
          }).join(", ");
        } else {
          message = "Error de validación en los datos";
        }
      } else if (error?.message?.includes("Expected string, received number")) {
        message = "Error: El saldo debe ser un texto (ej: '1000.00')";
      } else if (error?.message) {
        message = error.message;
      }
      
      toast({
        title: "Error al crear cuenta",
        description: message,
        variant: "destructive",
      });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async (accountData: Account) => {
      const response = await apiRequest("PUT", `/api/accounts/${account?.id}`, {
        ...accountData,
        balance: String(accountData.balance), // Ensure balance is always a string
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Cuenta actualizada",
        description: "La cuenta se ha actualizado exitosamente",
      });
      onClose();
    },
    onError: (error: any) => {
      console.error("Update account error:", error);
      
      let message = "No se pudo actualizar la cuenta";
      
      if (error?.message?.includes("Unexpected token") || error?.message?.includes("<!DOCTYPE")) {
        message = "Error de conexión con el servidor. Verifica que el servidor esté corriendo.";
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }
      
      toast({
        title: "Error al actualizar cuenta",
        description: message,
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/accounts/${account?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Cuenta eliminada",
        description: "La cuenta se ha eliminado exitosamente",
      });
      setShowDeleteDialog(false);
      onClose();
    },
    onError: (error: any) => {
      console.error("Delete account error:", error);
      
      let message = "No se pudo eliminar la cuenta";
      
      if (error?.message?.includes("Unexpected token") || error?.message?.includes("<!DOCTYPE")) {
        message = "Error de conexión con el servidor. Verifica que el servidor esté corriendo.";
      } else if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }
      
      toast({
        title: "Error al eliminar cuenta",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Campo requerido",
        description: "El nombre de la cuenta es obligatorio",
        variant: "destructive",
      });
      return;
    }

    if (!formData.balance || parseFloat(formData.balance) < 0) {
      toast({
        title: "Saldo inválido",
        description: "El saldo debe ser un número válido mayor o igual a 0",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'create') {
      createAccountMutation.mutate(formData);
    } else {
      updateAccountMutation.mutate(formData);
    }
  };

  const handleInputChange = (field: keyof Account, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isSubmitting = createAccountMutation.isPending || updateAccountMutation.isPending;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{mode === 'create' ? 'Crear Nueva Cuenta' : 'Editar Cuenta'}</span>
              {mode === 'edit' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre de la cuenta *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ej: Cuenta Corriente Principal"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Tipo de cuenta *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Cuenta Corriente</SelectItem>
                  <SelectItem value="savings">Cuenta de Ahorros</SelectItem>
                  <SelectItem value="loan">Préstamo/Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="balance">Saldo inicial *</Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => handleInputChange("balance", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="bankName">Banco (opcional)</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => handleInputChange("bankName", e.target.value)}
                placeholder="Ej: Banco Nacional"
              />
            </div>

            <div>
              <Label htmlFor="accountNumber">Número de cuenta (opcional)</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                placeholder="Ej: ****1234"
              />
            </div>

            <DialogFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Guardando..." : mode === 'create' ? "Crear Cuenta" : "Actualizar Cuenta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta "{account?.name}" y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAccountMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 