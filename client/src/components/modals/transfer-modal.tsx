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
import { ArrowRight, CreditCard, Building2, DollarSign } from "lucide-react";

const formatCurrency = (amount: string | number) => {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const [formData, setFormData] = useState({
    operationType: "transfer", // "transfer" or "payment"
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    description: "",
    notes: "",
    transactionDate: new Date().toISOString().split('T')[0],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery<any[]>({
    queryKey: ["/api/accounts"],
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        operationType: "transfer",
        fromAccountId: "",
        toAccountId: "",
        amount: "",
        description: "",
        notes: "",
        transactionDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [isOpen]);

  const transferMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.operationType === "transfer") {
        // Transferencia entre cuentas
        const fromAccount = accounts.find(acc => acc.id.toString() === data.fromAccountId);
        const toAccount = accounts.find(acc => acc.id.toString() === data.toAccountId);
        
        if (!fromAccount || !toAccount) {
          throw new Error("Cuentas no encontradas");
        }

        const amount = parseFloat(data.amount);
        const fromBalance = parseFloat(fromAccount.balance);
        
        if (fromBalance < amount) {
          throw new Error(`Saldo insuficiente. Saldo disponible: ${formatCurrency(fromBalance)}`);
        }

        // Crear transacción de salida
        const outgoingTransaction = {
          type: "expense",
          amount: data.amount,
          description: `Transferencia a ${toAccount.name}`,
          thirdParty: "Transferencia",
          categoryId: 1,
          accountId: data.fromAccountId,
          paymentMethod: "transfer",
          notes: data.notes || `Transferencia a ${toAccount.name}`,
          transactionDate: data.transactionDate,
        };

        // Crear transacción de entrada
        const incomingTransaction = {
          type: "income",
          amount: data.amount,
          description: `Transferencia desde ${fromAccount.name}`,
          thirdParty: "Transferencia",
          categoryId: 1,
          accountId: data.toAccountId,
          paymentMethod: "transfer",
          notes: data.notes || `Transferencia desde ${fromAccount.name}`,
          transactionDate: data.transactionDate,
        };

        // Ejecutar ambas transacciones
        const [outgoingResponse, incomingResponse] = await Promise.all([
          apiRequest("POST", "/api/transactions", outgoingTransaction),
          apiRequest("POST", "/api/transactions", incomingTransaction),
        ]);

        if (!outgoingResponse.ok || !incomingResponse.ok) {
          throw new Error("Error al procesar la transferencia");
        }

        return {
          outgoing: await outgoingResponse.json(),
          incoming: await incomingResponse.json(),
        };
      } else {
        // Pago a préstamo/crédito
        const fromAccount = accounts.find(acc => acc.id.toString() === data.fromAccountId);
        const toLoan = accounts.find(acc => acc.id.toString() === data.toAccountId);
        
        if (!fromAccount || !toLoan) {
          throw new Error("Cuenta o préstamo no encontrado");
        }

        if (toLoan.type !== "loan" && toLoan.type !== "credit") {
          throw new Error("La cuenta de destino debe ser un préstamo o crédito");
        }

        const amount = parseFloat(data.amount);
        const fromBalance = parseFloat(fromAccount.balance);
        const loanBalance = parseFloat(toLoan.balance);
        
        if (fromBalance < amount) {
          throw new Error(`Saldo insuficiente. Saldo disponible: ${formatCurrency(fromBalance)}`);
        }

        if (loanBalance <= 0) {
          throw new Error("Este préstamo ya está completamente pagado");
        }

        // Crear transacción de pago desde la cuenta
        const paymentTransaction = {
          type: "expense",
          amount: data.amount,
          description: `Pago de ${toLoan.type === 'loan' ? 'préstamo' : 'crédito'}: ${toLoan.name}`,
          thirdParty: "Pago de deuda",
          categoryId: 1,
          accountId: data.fromAccountId,
          paymentMethod: "transfer",
          notes: data.notes || `Pago de ${toLoan.type === 'loan' ? 'préstamo' : 'crédito'}`,
          transactionDate: data.transactionDate,
        };

        const paymentResponse = await apiRequest("POST", "/api/transactions", paymentTransaction);
        if (!paymentResponse.ok) {
          throw new Error("Error al procesar el pago");
        }

        // Actualizar el balance del préstamo
        const newLoanBalance = Math.max(0, loanBalance - amount);
        const updateLoanResponse = await apiRequest("PUT", `/api/accounts/${data.toAccountId}`, {
          balance: newLoanBalance.toFixed(2)
        });

        if (!updateLoanResponse.ok) {
          throw new Error("Error al actualizar el balance del préstamo");
        }

        return {
          payment: await paymentResponse.json(),
          updatedLoan: await updateLoanResponse.json(),
        };
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      
      if (variables.operationType === "transfer") {
        toast({
          title: "Transferencia exitosa",
          description: `Se ha transferido ${formatCurrency(variables.amount)} entre las cuentas`,
        });
      } else {
        toast({
          title: "Pago exitoso",
          description: `Se ha realizado el pago de ${formatCurrency(variables.amount)} al préstamo`,
        });
      }
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar la operación",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fromAccountId || !formData.toAccountId || !formData.amount) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    if (formData.fromAccountId === formData.toAccountId) {
      toast({
        title: "Cuentas iguales",
        description: "No puedes transferir a la misma cuenta",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      toast({
        title: "Monto inválido",
        description: "El monto debe ser mayor a 0",
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const bankAccounts = accounts.filter((account: any) => account.type !== "loan" && account.type !== "credit");
  const loansAndCredits = accounts.filter((account: any) => account.type === "loan" || account.type === "credit");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Transferencias y Pagos
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="operationType" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Operación
            </Label>
            <Select value={formData.operationType} onValueChange={(value) => handleChange("operationType", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transfer">
                  <div className="flex items-center">
                    <ArrowRight className="mr-2" size={16} />
                    Transferencia entre cuentas
                  </div>
                </SelectItem>
                <SelectItem value="payment">
                  <div className="flex items-center">
                    <CreditCard className="mr-2" size={16} />
                    Pago a préstamo/crédito
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="fromAccountId" className="block text-sm font-medium text-gray-700 mb-2">
                Cuenta de Origen *
              </Label>
              <Select value={formData.fromAccountId} onValueChange={(value) => handleChange("fromAccountId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account: any) => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{account.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {formatCurrency(account.balance)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="toAccountId" className="block text-sm font-medium text-gray-700 mb-2">
                {formData.operationType === "transfer" ? "Cuenta de Destino *" : "Préstamo/Crédito a Pagar *"}
              </Label>
              <Select value={formData.toAccountId} onValueChange={(value) => handleChange("toAccountId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={formData.operationType === "transfer" ? "Seleccionar cuenta" : "Seleccionar préstamo/crédito"} />
                </SelectTrigger>
                <SelectContent>
                  {formData.operationType === "transfer" ? (
                    bankAccounts.map((account: any) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{account.name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            {formatCurrency(account.balance)}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    loansAndCredits.map((loan: any) => {
                      const balance = parseFloat(loan.balance);
                      const accountNumberParts = loan.accountNumber?.split('-') || [];
                      const totalAmount = accountNumberParts.length >= 2 ? parseFloat(accountNumberParts[1]) : balance;
                      const pendingAmount = Math.max(0, totalAmount - (totalAmount - balance));
                      
                      return (
                        <SelectItem key={loan.id} value={loan.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{loan.name}</span>
                            <div className="text-sm text-gray-500 ml-2">
                              <div>Pendiente: {formatCurrency(pendingAmount)}</div>
                              <div>Total: {formatCurrency(totalAmount)}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <Label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha *
              </Label>
              <Input
                id="transactionDate"
                type="date"
                value={formData.transactionDate}
                onChange={(e) => handleChange("transactionDate", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder={formData.operationType === "transfer" ? "Descripción de la transferencia" : "Descripción del pago"}
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
              disabled={transferMutation.isPending}
              className="flex-1 bg-green-600 text-white hover:bg-green-700"
            >
              {transferMutation.isPending
                ? "Procesando..."
                : (formData.operationType === "transfer" ? "Realizar Transferencia" : "Realizar Pago")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 