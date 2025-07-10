import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CashFlowChart, ExpenseTrendsChart } from "@/components/charts/financial-charts";
import { Download, TrendingUp, ArrowUp } from "lucide-react";
import { useState } from "react";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("year");

  const { data: summary } = useQuery({
    queryKey: ["/api/analytics/summary"],
  });

  const { data: monthlyTrends = [] } = useQuery({
    queryKey: ["/api/analytics/monthly-trends"],
  });

  const { data: expensesByCategory = {} } = useQuery({
    queryKey: ["/api/analytics/expenses-by-category"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate category analysis
  const categoryAnalysis = Object.entries(expensesByCategory).map(([name, amount]) => {
    const total = Object.values(expensesByCategory).reduce((sum: number, val: number) => sum + val, 0);
    const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : "0";
    return { name, amount, percentage: `${percentage}% del total` };
  }).sort((a, b) => b.amount - a.amount);

  // Calculate monthly comparison
  const monthlyComparison = monthlyTrends.slice(-3).map((trend: any, index: number) => {
    const previous = monthlyTrends[monthlyTrends.length - 4 + index];
    const change = previous 
      ? ((trend.expenses - previous.expenses) / previous.expenses) * 100 
      : 0;
    
    const [year, month] = trend.month.split('-');
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthName = monthNames[parseInt(month) - 1];
    
    return {
      name: `${monthName} ${year}`,
      total: trend.expenses,
      change: change.toFixed(1),
    };
  });

  // Mock budget comparison data
  const budgetComparison = [
    { category: "Marketing", actual: 2125, budget: 2500, progress: 85 },
    { category: "Suministros", actual: 2450, budget: 2800, progress: 87.5 },
    { category: "Transporte", actual: 1890, budget: 2000, progress: 94.5 },
    { category: "Servicios", actual: 1245, budget: 1500, progress: 83 },
  ];

  const handleExportReport = () => {
    // Implementation for exporting reports
    console.log("Exporting financial report...");
  };

  return (
    <div className="space-y-6">
      {/* Analytics Controls */}
      <Card className="card-shadow">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Análisis Financiero Detallado</h2>
            <div className="flex space-x-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year">Último año</SelectItem>
                  <SelectItem value="6months">Últimos 6 meses</SelectItem>
                  <SelectItem value="3months">Últimos 3 meses</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleExportReport}
                className="bg-secondary text-white hover:bg-green-700"
              >
                <Download className="mr-2" size={16} />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Analysis */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Flujo de Caja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <CashFlowChart data={monthlyTrends} />
            </div>
          </CardContent>
        </Card>

        {/* Expense Trends */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800">Tendencias de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ExpenseTrendsChart data={monthlyTrends} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Breakdown */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Análisis por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryAnalysis.slice(0, 5).map((category) => (
                <div key={category.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-800">{category.name}</p>
                    <p className="text-sm text-gray-500">{category.percentage}</p>
                  </div>
                  <span className="font-bold text-gray-800">{formatCurrency(category.amount)}</span>
                </div>
              ))}
              {categoryAnalysis.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No hay datos de categorías disponibles
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Comparison */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Comparación Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyComparison.map((month) => (
                <div key={month.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-800">{month.name}</p>
                    <div className="flex items-center space-x-2">
                      <ArrowUp className={`text-xs ${parseFloat(month.change) >= 0 ? 'text-error' : 'text-success'}`} size={12} />
                      <span className={`text-sm ${parseFloat(month.change) >= 0 ? 'text-error' : 'text-success'}`}>
                        {parseFloat(month.change) >= 0 ? '+' : ''}{month.change}%
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-gray-800">{formatCurrency(month.total)}</span>
                </div>
              ))}
              {monthlyComparison.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No hay datos históricos suficientes
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Budget vs Actual */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Presupuesto vs Real</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetComparison.map((item) => (
                <div key={item.category}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.category}</span>
                    <span className="text-sm text-gray-500">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.progress > 90 ? 'bg-error' : item.progress > 75 ? 'bg-warning' : 'bg-success'
                      }`}
                      style={{ width: `${Math.min(item.progress, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>{formatCurrency(item.actual)}</span>
                    <span>{formatCurrency(item.budget)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
