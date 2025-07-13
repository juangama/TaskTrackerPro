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
import { Calendar, DollarSign, CreditCard, Building2 } from "lucide-react";

const formatCurrency = (amount: string | number) => {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  mode?: 'create' | 'edit';
}

export default function LoanModal({ isOpen, onClose, initialData, mode = 'create' }: LoanModalProps) {
  const [formData, setFormData] = useState({
    type: "loan", // "loan" or "credit"
    name: "",
    amount: "",
    description: "",
    destinationType: "account", // "account" or "expense"
    destinationAccountId: "",
    destinationExpenseId: "",
    interestRate: "",
    termMonths: "",
    startDate: new Date().toISOString().split('T')[0],
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ["/api/accounts"],
    enabled: isOpen,
  });

  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ["/api/transactions"],
    enabled: isOpen && formData.destinationType === "expense",
  });

  useEffect(() => {
    if (initialData && mode === 'edit') {
      // Extraer el monto total del accountNumber (formato: LOAN-amount-timestamp)
      const accountNumberParts = initialData.accountNumber?.split('-') || [];
      const totalAmount = accountNumberParts.length >= 2 ? accountNumberParts[1] : initialData.balance;
      
      setFormData({
        type: initialData.type || "loan",
        name: initialData.name || "",
        amount: totalAmount || "",
        description: initialData.bankName || "",
        destinationType: "account", // Por defecto para edición
        destinationAccountId: "",
        destinationExpenseId: "",
        interestRate: "", // No tenemos este campo en la BD
        termMonths: "", // No tenemos este campo en la BD
        startDate: initialData.createdAt ? initialData.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        notes: "", // No tenemos este campo en la BD
      });
    } else {
      setFormData({
        type: "loan",
        name: "",
        amount: "",
        description: "",
        destinationType: "account",
        destinationAccountId: "",
        destinationExpenseId: "",
        interestRate: "",
        termMonths: "",
        startDate: new Date().toISOString().split('T')[0],
        notes: "",
      });
    }
  }, [initialData, isOpen, mode]);

  const createLoanMutation = useMutation({
    mutationFn: async (data: any) => {
      if (mode === 'edit' && initialData?.id) {
        // Para edición, actualizar todos los campos del préstamo
        const updateData = {
          name: data.name,
          bankName: data.description,
          // Actualizar el balance si el monto cambió
          balance: data.amount,
          // Actualizar el accountNumber con el nuevo monto
          accountNumber: `${data.type.toUpperCase()}-${data.amount}-${Date.now()}`,
        };
        
        const response = await apiRequest("PUT", `/api/accounts/${initialData.id}`, updateData);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }
        return response.json();
      } else {
        // Crear cuenta de préstamo o crédito
        const loanAccountData = {
          name: data.name,
          type: data.type, // "loan" o "credit"
          balance: data.amount, // Balance inicial igual al monto total (pendiente)
          bankName: data.description,
          accountNumber: `${data.type.toUpperCase()}-${data.amount}-${Date.now()}`, // Incluir monto total en accountNumber
        };
        
        const accountResponse = await apiRequest("POST", "/api/accounts", loanAccountData);
        if (!accountResponse.ok) {
          const errorText = await accountResponse.text();
          throw new Error(`API Error: ${accountResponse.status} - ${errorText}`);
        }
        
        const loanAccount = await accountResponse.json();
        
        // Si es para una cuenta específica, agregar el dinero
        if (data.destinationType === "account" && data.destinationAccountId) {
          const destinationAccount = accounts.find(acc => acc.id.toString() === data.destinationAccountId);
          if (destinationAccount) {
            const newBalance = parseFloat(destinationAccount.balance) + parseFloat(data.amount);
            await apiRequest("PUT", `/api/accounts/${data.destinationAccountId}`, {
              balance: newBalance.toFixed(2)
            });
          }
        }
        
        // Si es para pagar un gasto, crear una transacción de ingreso
        if (data.destinationType === "expense" && data.destinationExpenseId) {
          const expenseTransaction = transactions.find(t => t.id.toString() === data.destinationExpenseId);
          if (expenseTransaction) {
            const paymentTransaction = {
              type: "income",
              amount: data.amount,
              description: `Pago de préstamo: ${data.name}`,
              thirdParty: "Préstamo",
              categoryId: 1, // Categoría por defecto
              accountId: data.destinationAccountId || 1,
              paymentMethod: "transfer",
              notes: `Pago del gasto: ${expenseTransaction.description}`,
              transactionDate: data.startDate,
            };
            
            await apiRequest("POST", "/api/transactions", paymentTransaction);
          }
        }
        
        return loanAccount;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: mode === 'edit' ? `${formData.type === 'loan' ? 'Préstamo' : 'Crédito'} actualizado` : `${formData.type === 'loan' ? 'Préstamo' : 'Crédito'} creado`,
        description: mode === 'edit' ? `El ${formData.type === 'loan' ? 'préstamo' : 'crédito'} se ha actualizado exitosamente` : `El ${formData.type === 'loan' ? 'préstamo' : 'crédito'} se ha creado exitosamente`,
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `No se pudo guardar el ${formData.type === 'loan' ? 'préstamo' : 'crédito'}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    // Validar campos adicionales en modo creación
    if (mode === 'create') {
      if (!formData.amount) {
        toast({
          title: "Monto requerido",
          description: "Por favor ingresa el monto del préstamo",
          variant: "destructive",
        });
        return;
      }

      if (formData.destinationType === "account" && !formData.destinationAccountId) {
        toast({
          title: "Cuenta requerida",
          description: "Por favor selecciona una cuenta de destino",
          variant: "destructive",
        });
        return;
      }

      if (formData.destinationType === "expense" && !formData.destinationExpenseId) {
        toast({
          title: "Gasto requerido",
          description: "Por favor selecciona un gasto para pagar",
          variant: "destructive",
        });
        return;
      }
    }

    // Validar monto en modo edición también
    if (mode === 'edit' && !formData.amount) {
      toast({
        title: "Monto requerido",
        description: "Por favor ingresa el monto del préstamo",
        variant: "destructive",
      });
      return;
    }

    createLoanMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const bankAccounts = accounts.filter((account: any) => account.type !== "loan");
  const expenseTransactions = transactions.filter((transaction: any) => transaction.type === "expense");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            {mode === 'edit' ? `Editar ${formData.type === 'loan' ? 'Préstamo' : 'Crédito'}` : 'Nuevo Préstamo/Crédito'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Operación
              </Label>
              <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="loan">Préstamo</SelectItem>
                  <SelectItem value="credit">Crédito</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del {formData.type === 'loan' ? 'Préstamo' : 'Crédito'} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder={formData.type === 'loan' ? "Ej: Préstamo personal, Préstamo hipotecario" : "Ej: Crédito de tarjeta, Línea de crédito"}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="interestRate" className="block text-sm font-medium text-gray-700 mb-2">
                Tasa de Interés (%)
              </Label>
              <Input
                id="interestRate"
                type="number"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) => handleChange("interestRate", e.target.value)}
                placeholder="0.00"
              />
            </div>
            
            <div>
              <Label htmlFor="termMonths" className="block text-sm font-medium text-gray-700 mb-2">
                Plazo (meses)
              </Label>
              <Input
                id="termMonths"
                type="number"
                value={formData.termMonths}
                onChange={(e) => handleChange("termMonths", e.target.value)}
                placeholder="12"
              />
            </div>
          </div>
          
          {mode === 'edit' && initialData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-800 mb-2">Información del Préstamo</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Balance actual:</span>
                  <br />
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(parseFloat(initialData.balance))}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Fecha de creación:</span>
                  <br />
                  <span className="text-gray-800">
                    {new Date(initialData.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Descripción del préstamo o crédito"
              required
            />
          </div>

          {mode !== 'edit' && (
            <div>
              <Label htmlFor="destinationType" className="block text-sm font-medium text-gray-700 mb-2">
                Destino del Dinero
              </Label>
              <Select value={formData.destinationType} onValueChange={(value) => handleChange("destinationType", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="account">
                    <div className="flex items-center">
                      <Building2 className="mr-2" size={16} />
                      Agregar a una cuenta
                    </div>
                  </SelectItem>
                  <SelectItem value="expense">
                    <div className="flex items-center">
                      <CreditCard className="mr-2" size={16} />
                      Pagar un gasto completo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {mode !== 'edit' && formData.destinationType === "account" && (
            <div>
              <Label htmlFor="destinationAccountId" className="block text-sm font-medium text-gray-700 mb-2">
                Cuenta de Destino *
              </Label>
              <Select value={formData.destinationAccountId} onValueChange={(value) => handleChange("destinationAccountId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name} (${parseFloat(account.balance).toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {mode !== 'edit' && formData.destinationType === "expense" && (
            <div>
              <Label htmlFor="destinationExpenseId" className="block text-sm font-medium text-gray-700 mb-2">
                Gasto a Pagar *
              </Label>
              <Select value={formData.destinationExpenseId} onValueChange={(value) => handleChange("destinationExpenseId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar gasto" />
                </SelectTrigger>
                <SelectContent>
                  {expenseTransactions.map((transaction: any) => (
                    <SelectItem key={transaction.id} value={transaction.id.toString()}>
                      {transaction.description} - ${parseFloat(transaction.amount).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
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
          
          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createLoanMutation.isPending}
              className="flex-1 bg-orange-500 text-white hover:bg-orange-600"
            >
              {createLoanMutation.isPending
                ? "Guardando..."
                : (mode === 'edit' ? "Guardar Cambios" : `Crear ${formData.type === 'loan' ? 'Préstamo' : 'Crédito'}`)}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 