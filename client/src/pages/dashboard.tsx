import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendsChart, CategoriesChart } from "@/components/charts/financial-charts";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  HandCoins,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
  Fuel,
  Wifi,
  Minus,
  Plus
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary } = useQuery({
    queryKey: ["/api/analytics/summary"],
  });

  const { data: expensesByCategory = {} } = useQuery({
    queryKey: ["/api/analytics/expenses-by-category"],
  });

  const { data: monthlyTrends = [] } = useQuery({
    queryKey: ["/api/analytics/monthly-trends"],
  });

  const { data: recentTransactions = [] } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const getTransactionIcon = (categoryName: string, type: string) => {
    if (type === "income") return <ArrowDown className="text-success" />;
    
    switch (categoryName?.toLowerCase()) {
      case "suministros":
        return <ShoppingCart className="text-error" />;
      case "transporte":
        return <Fuel className="text-primary" />;
      case "servicios":
        return <Wifi className="text-purple-600" />;
      default:
        return <Minus className="text-error" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="space-y-8">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-shadow hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Balance Total</p>
                <p className="text-3xl font-bold text-gray-800">
                  {summary ? formatCurrency(summary.totalBalance) : "$0.00"}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUp className="text-success text-sm mr-1" size={16} />
                  <span className="text-success text-sm font-medium">+12.5%</span>
                  <span className="text-gray-500 text-sm ml-1">vs mes anterior</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="text-primary" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Ingresos del Mes</p>
                <p className="text-3xl font-bold text-gray-800">
                  {summary ? formatCurrency(summary.monthlyIncome) : "$0.00"}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUp className="text-success text-sm mr-1" size={16} />
                  <span className="text-success text-sm font-medium">+8.2%</span>
                  <span className="text-gray-500 text-sm ml-1">vs mes anterior</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="text-success" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Gastos del Mes</p>
                <p className="text-3xl font-bold text-gray-800">
                  {summary ? formatCurrency(summary.monthlyExpenses) : "$0.00"}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowUp className="text-error text-sm mr-1" size={16} />
                  <span className="text-error text-sm font-medium">+5.1%</span>
                  <span className="text-gray-500 text-sm ml-1">vs mes anterior</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="text-error" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Préstamos Pendientes</p>
                <p className="text-3xl font-bold text-gray-800">
                  {summary ? formatCurrency(summary.pendingLoans) : "$0.00"}
                </p>
                <div className="flex items-center mt-2">
                  <ArrowDown className="text-success text-sm mr-1" size={16} />
                  <span className="text-success text-sm font-medium">-15.3%</span>
                  <span className="text-gray-500 text-sm ml-1">vs mes anterior</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <HandCoins className="text-warning" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-800">Tendencia Mensual</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="bg-primary text-white">6M</Button>
                <Button variant="outline" size="sm">1A</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <TrendsChart data={monthlyTrends} />
            </div>
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-800">Gastos por Categoría</CardTitle>
              <select className="text-sm border border-gray-300 rounded-lg px-3 py-1">
                <option>Este Mes</option>
                <option>Últimos 3 Meses</option>
                <option>Este Año</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <CategoriesChart data={expensesByCategory} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="card-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-800">Transacciones Recientes</CardTitle>
                <Link href="/transactions">
                  <a className="text-primary hover:text-blue-800 text-sm font-medium">Ver todas</a>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.slice(0, 5).map((transaction: any) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        {getTransactionIcon(transaction.category?.name, transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{transaction.description}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.category?.name || "Sin categoría"} • {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${transaction.type === "income" ? "text-success" : "text-error"}`}>
                      {transaction.type === "income" ? "+" : "-"}{formatCurrency(parseFloat(transaction.amount))}
                    </span>
                  </div>
                ))}
                {recentTransactions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay transacciones recientes
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Top Categorías</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(expensesByCategory)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([category, amount], index) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ 
                            backgroundColor: [
                              'hsl(207, 90%, 54%)',
                              'hsl(142, 76%, 36%)',
                              'hsl(33, 100%, 48%)',
                              'hsl(0, 84.2%, 60.2%)',
                              'hsl(266, 85%, 58%)'
                            ][index % 5]
                          }}
                        ></div>
                        <span className="text-gray-700">{category}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{formatCurrency(amount)}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full bg-error text-white hover:bg-red-700">
                  <Minus className="mr-2" size={16} />
                  Registrar Gasto
                </Button>
                <Button className="w-full bg-success text-white hover:bg-green-700">
                  <Plus className="mr-2" size={16} />
                  Registrar Ingreso
                </Button>
                <Button className="w-full bg-blue-500 text-white hover:bg-blue-700">
                  <svg className="mr-2 w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-.962 6.502-.18.849-.669 1.002-.669 1.002-.756.207-1.432-1.9-1.432-1.9s-2.016-3.235-2.16-3.421c-.081-.132-.081-.219 0-.273.132-.097.97-.681 1.426-1.055.496-.408.675-.715.675-.715.095-.127.118-.188.069-.273-.074-.113-.232-.145-.232-.145s-1.439.677-2.326 1.31c-.235.168-.403.236-.403.236-.764.247-1.638.169-1.638.169-.729-.054-1.295-.321-1.295-.321s-.801-.573-.801-1.295c0-.722.801-1.295.801-1.295s.566-.267 1.295-.321c.729-.054 1.638.169 1.638.169s.168.068.403.236c.887.633 2.326 1.31 2.326 1.31s.158.032.232-.145c.049-.085.026-.146-.069-.273 0 0-.179-.307-.675-.715-.456-.374-1.294-.958-1.426-1.055-.081-.054-.081-.141 0-.273.144-.186 2.16-3.421 2.16-3.421s.676-2.107 1.432-1.9c0 0 .489.153.669 1.002 0 0 .782 4.604.962 6.502.016.166-.004.379-.02.472a.506.506 0 0 1-.171.325c-.144.117-.365.142-.465.14zm-8.962 7.224h.056zm8.962-14.448c-.144.117-.365.142-.465.14h-.056z"/>
                  </svg>
                  Abrir Bot
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
