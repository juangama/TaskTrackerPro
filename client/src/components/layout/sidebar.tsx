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

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Transacciones", href: "/transactions", icon: ArrowRightLeft },
  { name: "Cuentas", href: "/accounts", icon: Building2 },
  { name: "Análisis", href: "/analytics", icon: PieChart },
  { name: "Bot Telegram", href: "/telegram", icon: MessageSquare },
];

export default function Sidebar() {
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
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <aside className="w-64 bg-white sidebar-shadow relative z-10">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <ChartLine className="text-white" size={24} />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">FINANZAS PRO</h2>
            <p className="text-xs text-gray-500">EMPRESA</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href === "/" && location === "/dashboard");
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <span 
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                      isActive 
                        ? "bg-blue-50 text-primary" 
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        
        <div className="mt-8 pt-4 border-t border-gray-200">
          <ul className="space-y-2">
            <li>
              <Link href="/settings">
                <span 
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                    location === "/settings" 
                      ? "bg-blue-50 text-primary" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Settings size={20} />
                  <span className="font-medium">Configuración</span>
                </span>
              </Link>
            </li>
            <li>
              <button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">
                  {logoutMutation.isPending ? "Cerrando..." : "Cerrar Sesión"}
                </span>
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}
