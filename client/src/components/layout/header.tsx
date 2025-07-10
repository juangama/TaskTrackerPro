import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";
import { User } from "@/lib/auth";
import { useState } from "react";
import TransactionModal from "@/components/modals/transaction-modal";

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  const getPageTitle = () => {
    const path = window.location.pathname;
    switch (path) {
      case "/":
      case "/dashboard":
        return "Dashboard Financiero";
      case "/transactions":
        return "Gestión de Transacciones";
      case "/accounts":
        return "Gestión de Cuentas";
      case "/analytics":
        return "Análisis Financiero";
      case "/telegram":
        return "Bot de Telegram";
      case "/settings":
        return "Configuración";
      default:
        return "Dashboard Financiero";
    }
  };

  const getPageDescription = () => {
    const path = window.location.pathname;
    switch (path) {
      case "/":
      case "/dashboard":
        return "Resumen general de la actividad financiera";
      case "/transactions":
        return "Administra todas tus transacciones e ingresos";
      case "/accounts":
        return "Gestiona tus cuentas bancarias y préstamos";
      case "/analytics":
        return "Análisis detallado de tus finanzas";
      case "/telegram":
        return "Configura el bot de Telegram para registros remotos";
      case "/settings":
        return "Configuración del sistema y perfil de usuario";
      default:
        return "Resumen general de la actividad financiera";
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{getPageTitle()}</h1>
            <p className="text-gray-600 mt-1">{getPageDescription()}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setIsTransactionModalOpen(true)}
              className="bg-primary text-white hover:bg-blue-800"
            >
              <Plus className="mr-2" size={16} />
              Nueva Transacción
            </Button>
            
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </Button>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="font-medium text-gray-800">{user.fullName}</p>
                <p className="text-sm text-gray-500 capitalize">{user.role}</p>
              </div>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user.fullName.split(' ').map(name => name[0]).join('').slice(0, 2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <TransactionModal 
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
      />
    </>
  );
}
