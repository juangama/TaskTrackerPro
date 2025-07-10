import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonthlyTrendData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface TrendsChartProps {
  data: MonthlyTrendData[];
}

export function TrendsChart({ data }: TrendsChartProps) {
  const chartData = useMemo(() => ({
    labels: data.map(d => {
      const [year, month] = d.month.split('-');
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return monthNames[parseInt(month) - 1];
    }),
    datasets: [
      {
        label: 'Ingresos',
        data: data.map(d => d.income),
        borderColor: 'hsl(142, 76%, 36%)',
        backgroundColor: 'hsla(142, 76%, 36%, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Gastos',
        data: data.map(d => d.expenses),
        borderColor: 'hsl(0, 84.2%, 60.2%)',
        backgroundColor: 'hsla(0, 84.2%, 60.2%, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  }), [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}

interface ExpensesByCategory {
  [key: string]: number;
}

interface CategoriesChartProps {
  data: ExpensesByCategory;
}

export function CategoriesChart({ data }: CategoriesChartProps) {
  const chartData = useMemo(() => {
    const categories = Object.keys(data);
    const amounts = Object.values(data);
    
    return {
      labels: categories,
      datasets: [
        {
          data: amounts,
          backgroundColor: [
            'hsl(207, 90%, 54%)',
            'hsl(142, 76%, 36%)',
            'hsl(33, 100%, 48%)',
            'hsl(0, 84.2%, 60.2%)',
            'hsl(266, 85%, 58%)',
            'hsl(262, 83%, 58%)',
            'hsl(221, 83%, 53%)',
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((sum: number, value: number) => sum + value, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: $${context.parsed.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
}

interface CashFlowChartProps {
  data: MonthlyTrendData[];
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const chartData = useMemo(() => ({
    labels: data.map(d => {
      const [year, month] = d.month.split('-');
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return monthNames[parseInt(month) - 1];
    }),
    datasets: [
      {
        label: 'Flujo Neto',
        data: data.map(d => d.net),
        backgroundColor: data.map(d => d.net >= 0 ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84.2%, 60.2%)'),
        borderRadius: 6,
      },
    ],
  }), [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Flujo Neto: $${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}

interface ExpenseTrendsChartProps {
  data: any[];
}

export function ExpenseTrendsChart({ data }: ExpenseTrendsChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const months = data.map(d => {
      const [year, month] = d.month.split('-');
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return monthNames[parseInt(month) - 1];
    });

    return {
      labels: months,
      datasets: [
        {
          label: 'Suministros',
          data: data.map(() => Math.random() * 3000 + 1000),
          borderColor: 'hsl(207, 90%, 54%)',
          tension: 0.4,
        },
        {
          label: 'Transporte',
          data: data.map(() => Math.random() * 2500 + 800),
          borderColor: 'hsl(142, 76%, 36%)',
          tension: 0.4,
        },
        {
          label: 'Servicios',
          data: data.map(() => Math.random() * 2000 + 600),
          borderColor: 'hsl(33, 100%, 48%)',
          tension: 0.4,
        },
      ],
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + value.toLocaleString();
          },
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
}
