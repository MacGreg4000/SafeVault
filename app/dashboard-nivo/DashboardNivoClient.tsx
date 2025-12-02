'use client'

import { useState } from 'react'
import { ResponsiveLine } from '@nivo/line'
import { ResponsivePie } from '@nivo/pie'
import { ResponsiveBar } from '@nivo/bar'
import { format, subDays, parseISO } from 'date-fns'
import { TrendingUp, DollarSign, FileText, BarChart3 } from 'lucide-react'

interface DashboardNivoClientProps {
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

// Configuration du Thème Dark pour Nivo
const customDarkTheme = {
  background: "transparent",
  text: {
    fontSize: 12,
    fill: "#94a3b8", // Tailwind slate-400
    outlineWidth: 0,
    outlineColor: "transparent"
  },
  axis: {
    domain: {
      line: {
        stroke: "#334155", // slate-700
        strokeWidth: 1
      }
    },
    legend: {
      text: {
        fontSize: 12,
        fill: "#e2e8f0" // slate-200
      }
    },
    ticks: {
      line: {
        stroke: "#334155",
        strokeWidth: 1
      },
      text: {
        fontSize: 11,
        fill: "#94a3b8"
      }
    }
  },
  grid: {
    line: {
      stroke: "#1e293b", // slate-800
      strokeWidth: 1
    }
  },
  tooltip: {
    container: {
      background: '#0f172a', // slate-900
      color: '#e2e8f0',
      fontSize: '12px',
      border: '1px solid #334155'
    },
  }
}

// Palette de couleurs "SafeGuard Pro"
const vaultColors = ['#06b6d4', '#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#fbbf24']

// Composant Card
const Card = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-slate-800/50 border border-slate-700 rounded-xl p-6 shadow-lg backdrop-blur-sm ${className}`}>
    <h3 className="text-slate-200 font-semibold mb-4 text-sm uppercase tracking-wider">{title}</h3>
    {children}
  </div>
)

// Composant KPI
const KpiItem = ({ title, value, change, positive }: { title: string; value: string; change: string; positive: boolean }) => (
  <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
    <p className="text-slate-400 text-sm">{title}</p>
    <p className="text-2xl font-bold text-white my-1">{value}</p>
    <p className={`text-xs flex items-center gap-1 ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
      <span>{positive ? '↑' : '↓'} {change}</span> depuis la dernière période
    </p>
  </div>
)

export default function DashboardNivoClient({ data, userName }: DashboardNivoClientProps) {
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

  // Préparer les données pour le graphique d'évolution des montants (cumulatif)
  let cumulative = 0
  const amountChartData = filteredTransactions.map(t => {
    if (t.mode === 'ADD' || t.type === 'INVENTORY') {
      cumulative += t.amount
    } else if (t.mode === 'REMOVE') {
      cumulative -= t.amount
    }
    return {
      x: format(parseISO(t.date), 'dd/MM'),
      y: cumulative,
    }
  })

  const storageTrendData = [
    {
      id: "Montant cumulatif",
      data: amountChartData.length > 0 ? amountChartData : [{ x: 'Aucune', y: 0 }],
      color: vaultColors[0]
    }
  ]

  // Préparer les données pour le graphique en camembert (répartition des billets actuels)
  const BILL_VALUES = [500, 200, 100, 50, 20, 10, 5]
  const currentBills: Record<string, number> = {}
  
  // Récupérer les dernières valeurs de chaque billet
  Object.keys(data.billEvolution).forEach(value => {
    const dates = Object.keys(data.billEvolution[value]).sort()
    if (dates.length > 0) {
      const lastDate = dates[dates.length - 1]
      currentBills[value] = data.billEvolution[value][lastDate]
    }
  })

  const fileTypeData = BILL_VALUES
    .filter(value => (currentBills[value.toString()] || 0) > 0)
    .map((value, index) => ({
      id: `${value}€`,
      label: `${value}€`,
      value: currentBills[value.toString()] || 0,
      color: vaultColors[index % vaultColors.length]
    }))

  // Si pas de données, ajouter un élément vide
  if (fileTypeData.length === 0) {
    fileTypeData.push({
      id: 'Aucun',
      label: 'Aucun billet',
      value: 1,
      color: vaultColors[0]
    })
  }

  // Préparer les données pour le graphique en barres (évolution des billets)
  const allDates = new Set<string>()
  Object.values(data.billEvolution).forEach(billData => {
    Object.keys(billData).forEach(date => allDates.add(date))
  })

  const sortedDates = Array.from(allDates).sort()
  const filteredDates = selectedPeriod === 'all'
    ? sortedDates
    : sortedDates.filter(date => {
        const days = parseInt(selectedPeriod)
        const cutoffDate = subDays(new Date(), days)
        return parseISO(date) >= cutoffDate
      })

  const threatData = filteredDates.map(date => {
    const entry: { date: string; [key: string]: string | number } = {
      date: format(parseISO(date), 'dd/MM'),
    }
    
    BILL_VALUES.forEach((value, index) => {
      entry[`${value}€`] = data.billEvolution[value.toString()]?.[date] || 0
    })
    
    return entry
  })

  // Calculer les KPIs
  const previousPeriodCount = selectedPeriod === 'all' 
    ? 0 
    : filteredTransactions.length > 0 
      ? Math.max(0, data.transactionCount - filteredTransactions.length)
      : 0
  
  const changeCount = filteredTransactions.length > 0 
    ? `${Math.abs(filteredTransactions.length - previousPeriodCount)}`
    : '0'

  const previousAmount = selectedPeriod === 'all'
    ? 0
    : amountChartData.length > 0
      ? amountChartData[0].y
      : 0

  const currentAmount = amountChartData.length > 0
    ? amountChartData[amountChartData.length - 1].y
    : 0

  const changeAmount = previousAmount > 0
    ? `${Math.abs(((currentAmount - previousAmount) / previousAmount) * 100).toFixed(1)}%`
    : '0%'

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            SafeGuard Dashboard
          </h1>
          <p className="text-slate-400 text-sm">Vue d&apos;ensemble pour {userName}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {(['7', '30', '90', 'all'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-xs rounded-lg transition-all ${
                  selectedPeriod === period
                    ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {period === 'all' ? 'Tout' : `${period}j`}
              </button>
            ))}
          </div>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">
            ● Système Actif
          </span>
        </div>
      </header>

      {/* Section 1: KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KpiItem 
          title="Total en caisse" 
          value={`${data.totalAmount.toFixed(2)}€`} 
          change={changeAmount} 
          positive={currentAmount >= previousAmount} 
        />
        <KpiItem 
          title="Transactions" 
          value={filteredTransactions.length.toString()} 
          change={changeCount} 
          positive={true} 
        />
        <KpiItem 
          title="Evolution" 
          value={`${currentAmount >= 0 ? '+' : ''}${currentAmount.toFixed(2)}€`} 
          change={changeAmount} 
          positive={currentAmount >= 0} 
        />
      </div>

      {/* Section 2: Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Graphique Principal: Tendance des montants */}
        <Card title="Evolution des montants cumulatifs" className="lg:col-span-8 h-[450px]">
          <div style={{ height: '350px' }}>
            <ResponsiveLine
              data={storageTrendData}
              theme={customDarkTheme}
              colors={[vaultColors[0]]}
              margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
              yFormat=" >-.2f"
              curve="monotoneX"
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Montant (€)',
                legendOffset: -50,
                legendPosition: 'middle',
                format: (value) => `${value}€`
              }}
              enableGridX={false}
              enablePoints={true}
              useMesh={true}
              enableArea={true}
              areaOpacity={0.15}
              legends={[
                {
                  anchor: 'bottom-right',
                  direction: 'row',
                  justify: false,
                  translateX: 0,
                  translateY: 50,
                  itemsSpacing: 0,
                  itemDirection: 'left-to-right',
                  itemWidth: 120,
                  itemHeight: 20,
                  itemOpacity: 0.75,
                  symbolSize: 12,
                  symbolShape: 'circle',
                  itemTextColor: '#e2e8f0'
                }
              ]}
            />
          </div>
        </Card>

        {/* Graphique Secondaire 1: Distribution des billets */}
        <Card title="Répartition des billets" className="lg:col-span-4 h-[450px]">
          <div style={{ height: '350px' }}>
            <ResponsivePie
              data={fileTypeData}
              theme={customDarkTheme}
              colors={{ datum: 'data.color' }}
              margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
              innerRadius={0.6}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              enableArcLinkLabels={false}
              arcLabel={(item) => `${item.value}`}
              arcLabelsTextColor={{ from: 'color', modifiers: [['brighter', 3]] }}
              legends={[
                {
                  anchor: 'bottom',
                  direction: 'row',
                  translateY: 30,
                  itemWidth: 80,
                  itemHeight: 18,
                  itemTextColor: '#94a3b8',
                  symbolSize: 14,
                  symbolShape: 'circle',
                }
              ]}
            />
          </div>
        </Card>

        {/* Graphique Secondaire 2: Bar Chart Horizontal - Évolution des billets */}
        <Card title="Evolution du nombre de billets par valeur" className="lg:col-span-12 h-[400px]">
          <div style={{ height: '300px' }}>
            <ResponsiveBar
              data={threatData.length > 0 ? threatData : [{ date: 'Aucune', '5€': 0, '10€': 0, '20€': 0, '50€': 0, '100€': 0, '200€': 0, '500€': 0 }]}
              keys={BILL_VALUES.map(v => `${v}€`)}
              indexBy="date"
              theme={customDarkTheme}
              colors={vaultColors}
              margin={{ top: 10, right: 130, bottom: 50, left: 80 }}
              padding={0.3}
              layout="horizontal"
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: "Nombre de billets",
                legendPosition: 'middle',
                legendOffset: 40
              }}
              labelSkipWidth={12}
              labelSkipHeight={12}
              labelTextColor={{ from: 'color', modifiers: [['brighter', 3]] }}
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 20,
                  itemTextColor: '#e2e8f0'
                }
              ]}
              role="application"
              ariaLabel="Evolution des billets"
            />
          </div>
        </Card>
      </div>
    </main>
  )
}

