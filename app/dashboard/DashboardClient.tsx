'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, DollarSign, FileText, BarChart3 } from 'lucide-react'
import { format, subDays, parseISO } from 'date-fns'

interface DashboardClientProps {
  data: {
    transactions: Array<{
      date: string
      amount: number
      type: string
      mode: string
    }>
    totalAmount: number
    transactionCount: number
    billEvolution: Record<string, Record<string, number>>
  }
  userName: string
}

export default function DashboardClient({ data, userName }: DashboardClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90' | 'all'>('30')

  // Filtrer les transactions selon la période
  const filterTransactions = () => {
    if (selectedPeriod === 'all') return data.transactions
    
    const days = parseInt(selectedPeriod)
    const cutoffDate = subDays(new Date(), days)
    
    return data.transactions.filter(t => {
      const transactionDate = parseISO(t.date)
      return transactionDate >= cutoffDate
    })
  }

  const filteredTransactions = filterTransactions()

  // Préparer les données pour le graphique d'évolution des montants
  const amountChartData = filteredTransactions.map(t => ({
    date: format(parseISO(t.date), 'dd/MM'),
    fullDate: t.date,
    montant: t.amount,
    type: t.type === 'INVENTORY' ? 'Inventaire' : 'Mouvement',
    mode: t.mode === 'ADD' ? 'Ajout' : t.mode === 'REMOVE' ? 'Retrait' : 'Remplacement',
  }))

  // Calculer l'évolution cumulative
  let cumulative = 0
  const cumulativeData = amountChartData.map(item => {
    if (item.mode === 'Ajout' || item.type === 'Inventaire') {
      cumulative += item.montant
    } else if (item.mode === 'Retrait') {
      cumulative -= item.montant
    }
    return {
      ...item,
      cumulatif: cumulative,
    }
  })

  // Préparer les données pour l'évolution des billets
  const BILL_VALUES = [500, 200, 100, 50, 20, 10, 5]
  const billChartData: Array<{ date: string; [key: string]: string | number }> = []

  // Récupérer toutes les dates uniques
  const allDates = new Set<string>()
  Object.values(data.billEvolution).forEach(billData => {
    Object.keys(billData).forEach(date => allDates.add(date))
  })

  const sortedDates = Array.from(allDates).sort()

  // Filtrer les dates selon la période
  const filteredDates = selectedPeriod === 'all'
    ? sortedDates
    : sortedDates.filter(date => {
        const days = parseInt(selectedPeriod)
        const cutoffDate = subDays(new Date(), days)
        return parseISO(date) >= cutoffDate
      })

  filteredDates.forEach(date => {
    const entry: { date: string; [key: string]: string | number } = {
      date: format(parseISO(date), 'dd/MM'),
    }
    
    BILL_VALUES.forEach(value => {
      entry[`${value}€`] = data.billEvolution[value.toString()]?.[date] || 0
    })
    
    billChartData.push(entry)
  })

  const colors = {
    '500€': '#8b5cf6',
    '200€': '#6366f1',
    '100€': '#3b82f6',
    '50€': '#06b6d4',
    '20€': '#10b981',
    '10€': '#f59e0b',
    '5€': '#ef4444',
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-wide flex items-center gap-3">
            <span className="w-1 h-10 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
            <BarChart3 className="w-8 h-8 text-cyan-400" />
            Tableau de bord
          </h1>
          <p className="text-slate-400">
            Données pour {userName}
          </p>
        </div>

        {/* Période de sélection */}
        <div className="mb-6 flex gap-2">
          {(['7', '30', '90', 'all'] as const).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {period === 'all' ? 'Tout' : `${period} jours`}
            </button>
          ))}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total actuel</p>
                <p className="text-3xl font-bold text-gold">
                  {data.totalAmount.toFixed(2)}€
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-yellow-400" />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Transactions</p>
                <p className="text-3xl font-bold text-white">
                  {filteredTransactions.length}
                </p>
              </div>
              <FileText className="w-12 h-12 text-blue-400" />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Évolution</p>
                <p className="text-3xl font-bold text-cyan-400">
                  {cumulativeData.length > 0
                    ? cumulativeData[cumulativeData.length - 1].cumulatif >= 0
                      ? '+'
                      : ''
                    : ''}
                  {cumulativeData.length > 0
                    ? cumulativeData[cumulativeData.length - 1].cumulatif.toFixed(2)
                    : '0.00'}€
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-400" />
            </div>
          </div>
        </div>

        {/* Graphique évolution des montants */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-6 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            Évolution des montants
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${value}€`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                }}
                formatter={(value: number) => [`${value.toFixed(2)}€`, 'Montant cumulatif']}
              />
              <Legend
                wrapperStyle={{ color: '#cbd5e1' }}
              />
              <Line
                type="monotone"
                dataKey="cumulatif"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ fill: '#06b6d4', r: 4 }}
                name="Montant cumulatif"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Graphique évolution des billets */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Évolution du nombre de billets
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={billChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9',
                }}
              />
              <Legend
                wrapperStyle={{ color: '#cbd5e1' }}
              />
              {BILL_VALUES.map(value => (
                <Bar
                  key={value}
                  dataKey={`${value}€`}
                  fill={colors[`${value}€` as keyof typeof colors]}
                  name={`${value}€`}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  )
}

