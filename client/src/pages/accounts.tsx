import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, History, DollarSign } from "lucide-react";

export default function Accounts() {
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "checking",
    balance: "",
    bankName: "",
    accountNumber: "",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["/api/accounts"],
  });

  const createAccountMutation = useMutation({
    mutationFn: async (accountData: any) => {
      const response = await apiRequest("POST", "/api/accounts", accountData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      toast({
        title: "Cuenta creada",
        description: "La cuenta se ha creado exitosamente",
      });
      setIsAccountModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la cuenta",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewAccount({
      name: "",
      type: "checking",
      balance: "",
      bankName: "",
      accountNumber: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAccount.name || !newAccount.balance) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    createAccountMutation.mutate({
      ...newAccount,
      balance: parseFloat(newAccount.balance),
    });
  };

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getAccountTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      checking: "Corriente",
      savings: "Ahorros",
      loan: "Préstamo",
    };
    return types[type] || type;
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "checking":
        return "default";
      case "savings":
        return "secondary";
      case "loan":
        return "destructive";
      default:
        return "outline";
    }
  };

  const bankAccounts = accounts.filter((account: any) => account.type !== "loan");
  const loans = accounts.filter((account: any) => account.type === "loan");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando cuentas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bank Accounts */}
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-800">Cuentas Bancarias</CardTitle>
              <Button
                onClick={() => setIsAccountModalOpen(true)}
                className="bg-primary text-white hover:bg-blue-800"
                size="sm"
              >
                <Plus className="mr-1" size={16} />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {bankAccounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No hay cuentas bancarias registradas</p>
                <Button
                  onClick={() => setIsAccountModalOpen(true)}
                  variant="outline"
                  className="mt-4"
                >
                  Crear primera cuenta
                </Button>
              </div>
            ) : (
              bankAccounts.map((account: any) => (
                <div key={account.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">{account.name}</h4>
                    <Badge variant={getBadgeVariant(account.type)}>
                      {getAccountTypeLabel(account.type)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-800">
                      {formatCurrency(account.balance)}
                    </span>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="text-primary hover:text-blue-800">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
                        <History size={16} />
                      </Button>
                    </div>
                  </div>
                  {account.bankName && (
                    <p className="text-sm text-gray-500 mt-1">
                      {account.bankName} • {account.accountNumber || "****0000"}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Loans and Credits */}
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-800">Préstamos y Créditos</CardTitle>
              <Button
                onClick={() => {
                  setNewAccount(prev => ({ ...prev, type: "loan" }));
                  setIsAccountModalOpen(true);
                }}
                className="bg-warning text-white hover:bg-orange-600"
                size="sm"
              >
                <Plus className="mr-1" size={16} />
                Agregar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loans.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No hay préstamos registrados</p>
              </div>
            ) : (
              loans.map((loan: any) => {
                const balance = parseFloat(loan.balance);
                const totalAmount = Math.abs(balance) * 2; // Mock calculation for demo
                const progress = ((totalAmount - Math.abs(balance)) / totalAmount) * 100;
                
                return (
                  <div key={loan.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{loan.name}</h4>
                      <Badge variant="destructive">Activo</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-medium">{formatCurrency(totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Pendiente:</span>
                        <span className="font-bold text-error">{formatCurrency(Math.abs(balance))}</span>
                      </div>
                      <Progress value={progress} className="w-full h-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Progreso: {progress.toFixed(0)}%</span>
                        <Button
                          size="sm"
                          className="bg-success text-white hover:bg-green-700"
                        >
                          Pagar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Account Modal */}
      <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {newAccount.type === "loan" ? "Nuevo Préstamo" : "Nueva Cuenta Bancaria"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre de la cuenta *</Label>
              <Input
                id="name"
                value={newAccount.name}
                onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ej: Cuenta Corriente Principal"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="type">Tipo de cuenta</Label>
              <Select 
                value={newAccount.type} 
                onValueChange={(value) => setNewAccount(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Corriente</SelectItem>
                  <SelectItem value="savings">Ahorros</SelectItem>
                  <SelectItem value="loan">Préstamo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="balance">
                {newAccount.type === "loan" ? "Monto del préstamo *" : "Saldo inicial *"}
              </Label>
              <Input
                id="balance"
                type="number"
                step="0.01"
                value={newAccount.balance}
                onChange={(e) => setNewAccount(prev => ({ ...prev, balance: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            
            {newAccount.type !== "loan" && (
              <>
                <div>
                  <Label htmlFor="bankName">Banco</Label>
                  <Input
                    id="bankName"
                    value={newAccount.bankName}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="Nombre del banco"
                  />
                </div>
                
                <div>
                  <Label htmlFor="accountNumber">Número de cuenta</Label>
                  <Input
                    id="accountNumber"
                    value={newAccount.accountNumber}
                    onChange={(e) => setNewAccount(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="****1234"
                  />
                </div>
              </>
            )}
            
            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAccountModalOpen(false);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createAccountMutation.isPending}
                className="flex-1 bg-primary text-white hover:bg-blue-800"
              >
                {createAccountMutation.isPending ? "Creando..." : "Crear Cuenta"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
