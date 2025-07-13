import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  ArrowRightLeft, 
  Building2, 
  PieChart, 
  MessageSquare, 
  Settings,
  LogOut,
  ChartLine
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface SidebarProps {
  onLogout?: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Transacciones", href: "/transactions", icon: ArrowRightLeft },
  { name: "Cuentas", href: "/accounts", icon: Building2 },
  { name: "Análisis", href: "/analytics", icon: PieChart },
  { name: "Bot Telegram", href: "/telegram", icon: MessageSquare },
];

export default function Sidebar({ onLogout }: SidebarProps) {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
      // Llamar a la función callback si existe
      if (onLogout) {
        onLogout();
      }
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <ChartLine className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Finanzas Pro</h1>
            <p className="text-sm text-gray-500">Empresa</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <ul className="space-y-2">
          <li>
            <Link
              href="/settings"
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                location === "/settings"
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Settings size={20} />
              <span className="font-medium">Configuración</span>
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 w-full text-left"
              disabled={logoutMutation.isPending}
            >
              <LogOut size={20} />
              <span className="font-medium">
                {logoutMutation.isPending ? "Cerrando..." : "Cerrar sesión"}
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
