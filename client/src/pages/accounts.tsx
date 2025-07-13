import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, History, DollarSign, Trash2, AlertTriangle, ArrowRight } from "lucide-react";
import AccountModal from "@/components/modals/account-modal";
import LoanModal from "@/components/modals/loan-modal";
import TransferModal from "@/components/modals/transfer-modal";
import { useToast } from "@/hooks/use-toast";

interface Account {
  id: number;
  name: string;
  type: string;
  balance: string;
  bankName?: string;
  accountNumber?: string;
}

export default function Accounts() {
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Account | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const { toast } = useToast();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["/api/accounts"],
  }) as { data: Account[]; isLoading: boolean };

  const handleCreateAccount = () => {
    setModalMode('create');
    setSelectedAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setModalMode('edit');
    setSelectedAccount(account);
    setIsAccountModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAccountModalOpen(false);
    setSelectedAccount(null);
  };

  const handleCreateLoan = () => {
    setModalMode('create');
    setSelectedLoan(null);
    setIsLoanModalOpen(true);
  };

  const handleEditLoan = (loan: Account) => {
    setModalMode('edit');
    setSelectedLoan(loan);
    setIsLoanModalOpen(true);
  };

  const handleCloseLoanModal = () => {
    setIsLoanModalOpen(false);
    setSelectedLoan(null);
  };

  const handleOpenTransferModal = () => {
    setIsTransferModalOpen(true);
  };

  const handleCloseTransferModal = () => {
    setIsTransferModalOpen(false);
  };

  const handlePayLoan = async (loan: Account) => {
    const balance = parseFloat(loan.balance);
    const accountNumberParts = loan.accountNumber?.split('-') || [];
    const totalAmount = accountNumberParts.length >= 2 ? parseFloat(accountNumberParts[1]) : balance;
    
    if (balance <= 0) {
      toast({
        title: "Préstamo pagado",
        description: "Este préstamo ya está completamente pagado",
        variant: "destructive",
      });
      return;
    }

    // Por ahora, pagar el monto completo
    const amountToPay = balance;

    // Crear una transacción de pago
    const paymentTransaction = {
      type: "expense",
      amount: amountToPay.toString(),
      description: `Pago de ${loan.type === 'loan' ? 'préstamo' : 'crédito'}: ${loan.name}`,
      thirdParty: "Pago de deuda",
      categoryId: 1, // Categoría por defecto
      accountId: 1, // Cuenta principal
      paymentMethod: "transfer",
      notes: `Pago de ${loan.type === 'loan' ? 'préstamo' : 'crédito'}`,
      transactionDate: new Date().toISOString().split('T')[0],
    };

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentTransaction),
      });

      if (response.ok) {
        // Actualizar el balance del préstamo (pago completo)
        const updateResponse = await fetch(`/api/accounts/${loan.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            balance: "0"
          }),
        });

        if (updateResponse.ok) {
          toast({
            title: "Pago realizado",
            description: `Se ha pagado ${formatCurrency(amountToPay)} del ${loan.type === 'loan' ? 'préstamo' : 'crédito'}`,
          });
          // Refrescar los datos
          window.location.reload();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar el pago",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLoan = async (loan: Account) => {
    const balance = parseFloat(loan.balance);
    
    // Verificar si el préstamo tiene balance pendiente
    if (balance > 0) {
      toast({
        title: "No se puede eliminar",
        description: `No se puede eliminar el ${loan.type === 'loan' ? 'préstamo' : 'crédito'} porque tiene un balance pendiente de ${formatCurrency(balance)}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/accounts/${loan.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "Eliminado exitosamente",
          description: `El ${loan.type === 'loan' ? 'préstamo' : 'crédito'} "${loan.name}" ha sido eliminado`,
        });
        // Refrescar los datos
        window.location.reload();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message || "No se pudo eliminar el préstamo",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el préstamo",
        variant: "destructive",
      });
    }
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
      credit: "Crédito",
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
      case "credit":
        return "destructive";
      default:
        return "outline";
    }
  };

  const bankAccounts = accounts.filter((account: Account) => !["loan", "credit"].includes(account.type));
  const loans = accounts.filter((account: Account) => ["loan", "credit"].includes(account.type));

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
              <div className="flex space-x-2">
                <Button
                  onClick={handleOpenTransferModal}
                  className="bg-green-600 text-white hover:bg-green-700"
                  size="sm"
                >
                  <ArrowRight className="mr-1" size={16} />
                  Transferir
                </Button>
                <Button
                  onClick={handleCreateAccount}
                  className="bg-primary text-white hover:bg-blue-800"
                  size="sm"
                >
                  <Plus className="mr-1" size={16} />
                  Agregar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {bankAccounts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DollarSign size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No hay cuentas bancarias registradas</p>
                <Button
                  onClick={handleCreateAccount}
                  variant="outline"
                  className="mt-4"
                >
                  Crear primera cuenta
                </Button>
              </div>
            ) : (
              bankAccounts.map((account: Account) => (
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-blue-800"
                        onClick={() => handleEditAccount(account)}
                      >
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
                onClick={handleCreateLoan}
                className="bg-orange-500 text-white hover:bg-orange-600"
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
              loans.map((loan: Account) => {
                const balance = parseFloat(loan.balance);
                // Extraer el monto total del accountNumber (formato: LOAN-amount-timestamp)
                const accountNumberParts = loan.accountNumber?.split('-') || [];
                const totalAmount = accountNumberParts.length >= 2 ? parseFloat(accountNumberParts[1]) : balance;
                const pendingAmount = balance; // El pendiente es el balance actual
                const progress = totalAmount > 0 ? ((totalAmount - pendingAmount) / totalAmount) * 100 : 0;
                
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
                        <span className="font-bold text-error">{formatCurrency(pendingAmount)}</span>
                      </div>
                      <Progress value={progress} className="w-full h-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Progreso: {progress.toFixed(0)}%</span>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="bg-success text-white hover:bg-green-700"
                            onClick={() => handlePayLoan(loan)}
                          >
                            Pagar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:text-blue-800"
                            onClick={() => handleEditLoan(loan)}
                          >
                            <Edit size={16} />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                disabled={parseFloat(loan.balance) > 0}
                                title={parseFloat(loan.balance) > 0 ? `No se puede eliminar con balance pendiente de ${formatCurrency(parseFloat(loan.balance))}` : "Eliminar préstamo"}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-red-600" />
                                  Eliminar {loan.type === 'loan' ? 'Préstamo' : 'Crédito'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {parseFloat(loan.balance) > 0 ? (
                                    <>
                                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-3">
                                        <div className="flex items-center gap-2 text-yellow-800">
                                          <AlertTriangle className="h-4 w-4" />
                                          <strong>No se puede eliminar</strong>
                                        </div>
                                        <p className="text-sm text-yellow-700 mt-1">
                                          Este {loan.type === 'loan' ? 'préstamo' : 'crédito'} tiene un balance pendiente de {formatCurrency(parseFloat(loan.balance))}. 
                                          Debes pagarlo completamente antes de poder eliminarlo.
                                        </p>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      ¿Estás seguro de que quieres eliminar el {loan.type === 'loan' ? 'préstamo' : 'crédito'} "{loan.name}"?
                                      <br />
                                      <br />
                                      <div className="bg-gray-50 p-3 rounded-md">
                                        <div className="text-sm">
                                          <strong>Detalles del {loan.type === 'loan' ? 'préstamo' : 'crédito'}:</strong>
                                          <br />
                                          • Nombre: {loan.name}
                                          <br />
                                          • Balance actual: {formatCurrency(parseFloat(loan.balance))}
                                          <br />
                                          • Tipo: {getAccountTypeLabel(loan.type)}
                                        </div>
                                      </div>
                                      <br />
                                      <span className="font-semibold text-red-600">
                                        Esta acción no se puede deshacer.
                                      </span>
                                    </>
                                  )}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                {parseFloat(loan.balance) <= 0 && (
                                  <AlertDialogAction
                                    onClick={() => handleDeleteLoan(loan)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                )}
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={handleCloseModal}
        account={selectedAccount}
        mode={modalMode}
      />

      {/* Loan Modal */}
      <LoanModal
        isOpen={isLoanModalOpen}
        onClose={handleCloseLoanModal}
        initialData={selectedLoan}
        mode={modalMode}
      />

      {/* Transfer Modal */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={handleCloseTransferModal}
      />
    </div>
  );
}
