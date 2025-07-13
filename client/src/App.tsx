import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { authApi } from "./lib/auth";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Transactions from "@/pages/transactions";
import Accounts from "@/pages/accounts";
import Analytics from "@/pages/analytics";
import Telegram from "@/pages/telegram";
import Settings from "@/pages/settings";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import NotFound from "@/pages/not-found";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthData {
  user: User;
}

function AppContent() {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Función para verificar autenticación manualmente
  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const data = await authApi.getCurrentUser();
      setAuthData(data);
      setIsAuthenticated(true);
    } catch (error) {
      setAuthData(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para manejar login exitoso
  const handleLoginSuccess = (data: AuthData) => {
    setAuthData(data);
    setIsAuthenticated(true);
  };

  // Función para manejar logout
  const handleLogout = () => {
    setAuthData(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar páginas de login/registro
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/login" component={() => <Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/register" component={() => <Register onLoginSuccess={handleLoginSuccess} />} />
        <Route component={() => <Login onLoginSuccess={handleLoginSuccess} />} />
      </Switch>
    );
  }

  // Si está autenticado, mostrar la aplicación principal
  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header user={authData!.user} />
        <div className="flex-1 overflow-auto p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/accounts" component={Accounts} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/telegram" component={Telegram} />
            <Route path="/settings" component={() => <Settings user={authData!.user} />} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
