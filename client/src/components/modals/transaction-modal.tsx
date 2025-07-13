import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CloudUpload } from "lucide-react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  mode?: 'create' | 'edit';
}

export default function TransactionModal({ isOpen, onClose, initialData, mode = 'create' }: TransactionModalProps) {
  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    description: "",
    thirdParty: "",
    categoryId: "",
    accountId: "",
    paymentMethod: "cash",
    notes: "",
    transactionDate: new Date().toISOString().split('T')[0], // Default to today
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || "expense",
        amount: initialData.amount?.toString() || "",
        description: initialData.description || "",
        thirdParty: initialData.thirdParty || "",
        categoryId: initialData.categoryId?.toString() || "",
        accountId: initialData.accountId?.toString() || "",
        paymentMethod: initialData.paymentMethod || "cash",
        notes: initialData.notes || "",
        transactionDate: initialData.transactionDate ? initialData.transactionDate.split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        type: "expense",
        amount: "",
        description: "",
        thirdParty: "",
        categoryId: "",
        accountId: "",
        paymentMethod: "cash",
        notes: "",
        transactionDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [initialData, isOpen]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
    enabled: isOpen,
  });

  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ["/api/accounts"],
    enabled: isOpen,
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      if (mode === 'edit' && initialData?.id) {
        // PUT para editar
        const response = await apiRequest("PUT", `/api/transactions/${initialData.id}`, data);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        return response.json();
      } else {
        // POST para crear
        const response = await apiRequest("POST", "/api/transactions", data);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: mode === 'edit' ? "Transacción actualizada" : "Transacción creada",
        description: mode === 'edit' ? "La transacción se ha actualizado exitosamente" : "La transacción se ha registrado exitosamente",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la transacción",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      type: "expense",
      amount: "",
      description: "",
      thirdParty: "",
      categoryId: "",
      accountId: "",
      paymentMethod: "cash",
      notes: "",
      transactionDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description || !formData.categoryId || !formData.accountId || !formData.transactionDate) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    const transactionData = {
      type: formData.type,
      amount: formData.amount,
      description: formData.description,
      thirdParty: formData.thirdParty,
      categoryId: parseInt(formData.categoryId),
      accountId: parseInt(formData.accountId),
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
      transactionDate: formData.transactionDate, // Enviar solo la fecha sin concatenar
    };

    console.log("Submitting transaction:", transactionData);
    createTransactionMutation.mutate(transactionData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const expenseCategories = categories.filter((cat: any) => cat.type === "expense");
  const incomeCategories = categories.filter((cat: any) => cat.type === "income");
  const availableCategories = formData.type === "expense" ? expenseCategories : incomeCategories;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            {mode === 'edit' ? 'Editar Transacción' : 'Nueva Transacción'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Transacción
              </Label>
              <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
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
              <Label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Transacción *
              </Label>
              <Input
                id="transactionDate"
                type="date"
                value={formData.transactionDate}
                onChange={(e) => handleChange("transactionDate", e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Monto *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </Label>
              <Select value={formData.categoryId} onValueChange={(value) => handleChange("categoryId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-2">
                Cuenta *
              </Label>
              <Select value={formData.accountId} onValueChange={(value) => handleChange("accountId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} (${parseFloat(account.balance).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago
              </Label>
              <Select value={formData.paymentMethod} onValueChange={(value) => handleChange("paymentMethod", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                  <SelectItem value="debit_card">Tarjeta de Débito</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Descripción de la transacción"
              required
            />
          </div>

          <div>
            <Label htmlFor="thirdParty" className="block text-sm font-medium text-gray-700 mb-2">
              Tercero {formData.type === "expense" ? "(Proveedor/Beneficiario)" : "(Cliente/Pagador)"}
            </Label>
            <Input
              id="thirdParty"
              value={formData.thirdParty}
              onChange={(e) => handleChange("thirdParty", e.target.value)}
              placeholder={formData.type === "expense" ? "Nombre del proveedor o beneficiario" : "Nombre del cliente o quien paga"}
            />
          </div>
          
          <div>
            <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notas adicionales
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Notas adicionales (opcional)"
              rows={3}
            />
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-2">
              Recibo/Factura
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
              <CloudUpload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-600">Arrastra y suelta archivos aquí o</p>
              <Button type="button" variant="link" className="text-primary hover:text-blue-800 font-medium p-0">
                selecciona archivos
              </Button>
              <input type="file" accept="image/*,.pdf" className="hidden" />
              <p className="text-xs text-gray-500 mt-2">PNG, JPG, PDF hasta 10MB</p>
            </div>
          </div>
          
          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createTransactionMutation.isPending}
              className="flex-1 bg-primary text-white hover:bg-blue-800"
            >
              {createTransactionMutation.isPending
                ? (mode === 'edit' ? "Guardando..." : "Guardando...")
                : (mode === 'edit' ? "Guardar Cambios" : "Guardar Transacción")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
