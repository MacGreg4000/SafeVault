'use client'

import { ResponsiveLine } from '@nivo/line'
import { ResponsivePie } from '@nivo/pie'
import { ResponsiveBar } from '@nivo/bar'
import { getDashboardData } from '@/app/actions/dashboard'
import { useEffect, useState } from 'react'

// --- 1. Thème "Premium & Elegant" ---
const customElegantTheme = {
  background: "transparent",
  text: {
    fontSize: 12,
    fill: "#94a3b8", // Slate-400 (Gris doux)
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif', 
  },
  axis: {
    domain: {
      line: {
        stroke: "#334155", // Gris très discret
        strokeWidth: 1,
        strokeOpacity: 0.5
      }
    },
    legend: {
      text: {
        fontSize: 12,
        fill: "#cbd5e1", // Slate-300
        fontWeight: 500
      }
    },
    ticks: {
      line: {
        stroke: "#334155",
        strokeWidth: 1,
        strokeOpacity: 0.5
      },
      text: {
        fontSize: 11,
        fill: "#64748b" // Slate-500
      }
    }
  },
  grid: {
    line: {
      stroke: "#334155",
      strokeWidth: 1,
      strokeOpacity: 0.1, // Grille quasi invisible
    }
  },
  tooltip: {
    container: {
      background: '#1e293b', // Slate-800
      color: '#f8fafc',
      fontSize: '13px',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: '12px'
    },
  }
};

// Palette "Luxe" : Indigo, Teal (Sarcelle), Rose doux
const luxuryColors = {
  primary: '#6366f1', // Indigo doux
  secondary: '#14b8a6', // Teal élégant
  accent: '#f43f5e', // Rose
  neutral: '#475569' // Slate-600
};

// --- Composants UI "Glassmorphism" ---
const GlassCard = ({ title, subtitle, children, className = "", delay = 0 }: { 
  title: string, 
  subtitle?: string, 
  children: React.ReactNode, 
  className?: string,
  delay?: number
}) => (
  <div 
    className={`relative rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-xl hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all duration-500 ease-out group ${className}`}
    style={{
      animation: `fadeInUp 0.8s ease-out ${delay}ms both`
    }}
  >
    {/* Effet de glow au survol */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    
    <div className="p-6 h-full flex flex-col relative z-10">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-slate-200 font-semibold text-base tracking-tight group-hover:text-white transition-colors">{title}</h3>
          {subtitle && <p className="text-slate-500 text-xs mt-1 group-hover:text-slate-400 transition-colors">{subtitle}</p>}
        </div>
        <div className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-blue-400 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse transition-all"></div>
      </div>
      <div className="flex-grow relative">
        {children}
      </div>
    </div>
  </div>
);

const ElegantKpi = ({ title, value, change, positive, delay = 0 }: { 
  title: string, 
  value: string, 
  change: string, 
  positive: boolean,
  delay?: number
}) => (
  <div 
    className="rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 flex flex-col justify-between hover:bg-slate-800/40 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-[1.02] transition-all duration-500 ease-out group"
    style={{
      animation: `fadeInUp 0.6s ease-out ${delay}ms both`
    }}
  >
    <p className="text-slate-500 text-sm font-medium group-hover:text-slate-400 transition-colors">{title}</p>
    <div className="mt-4">
      <p className="text-3xl font-semibold text-slate-100 tracking-tight group-hover:text-white transition-colors">{value}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full transition-all duration-300 ${positive ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'}`}>
          {positive ? '+' : ''}{change}
        </span>
        <span className="text-slate-600 text-xs">vs. période précédente</span>
      </div>
    </div>
  </div>
)

export default function DashboardNivoPage() {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const result = await getDashboardData()
      if (result.error) {
        console.error('Erreur:', result.error)
      } else {
        setDashboardData(result)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020617] p-6 md:p-12 font-sans text-slate-200 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Chargement des données...</div>
      </main>
    )
  }

  if (!dashboardData) {
    return (
      <main className="min-h-screen bg-[#020617] p-6 md:p-12 font-sans text-slate-200 flex items-center justify-center">
        <div className="text-red-400 text-lg">Erreur lors du chargement des données</div>
      </main>
    )
  }

  // Préparer les données pour les graphiques
  const transactions = dashboardData.transactions || []
  const billEvolution = dashboardData.billEvolution || {}
  const totalAmount = dashboardData.totalAmount || 0
  const transactionCount = dashboardData.transactionCount || 0

  // Données pour le graphique de ligne (évolution des montants cumulés)
  let cumulativeAmount = 0
  const amountEvolutionData = [
    {
      id: "Montant cumulé",
      data: transactions.map((t: any) => {
        cumulativeAmount += t.amount
        return {
          x: t.date,
          y: cumulativeAmount
        }
      })
    }
  ]

  // Données pour le pie chart (répartition par type de transaction)
  const inventoryCount = transactions.filter((t: any) => t.type === 'INVENTORY').length
  const movementCount = transactions.filter((t: any) => t.type === 'MOVEMENT').length
  const transactionTypeData = [
    {
      id: "INVENTORY",
      label: "Inventaires",
      value: inventoryCount,
      color: luxuryColors.primary
    },
    {
      id: "MOVEMENT",
      label: "Mouvements",
      value: movementCount,
      color: luxuryColors.secondary
    }
  ].filter(item => item.value > 0)

  // Données pour le bar chart (répartition des billets)
  const billEvolutionData = Object.entries(billEvolution)
    .map(([value, data]: [string, any]) => {
      const dates = Object.keys(data).sort()
      const lastValue = dates.length > 0 ? data[dates[dates.length - 1]] : 0
      return {
        valeur: `${value}€`,
        quantite: lastValue
      }
    })
    .filter(item => item.quantite > 0)
    .sort((a, b) => parseFloat(a.valeur.replace('€', '')) - parseFloat(b.valeur.replace('€', '')))

  // Calculer les KPIs
  const avgTransactionAmount = transactionCount > 0 ? totalAmount / transactionCount : 0
  const lastTransaction = transactions.length > 0 ? transactions[transactions.length - 1] : null
  const previousTransaction = transactions.length > 1 ? transactions[transactions.length - 2] : null
  const amountChange = lastTransaction && previousTransaction 
    ? ((lastTransaction.amount - previousTransaction.amount) / previousTransaction.amount * 100).toFixed(1)
    : '0'

  return (
    <main className="min-h-screen bg-[#020617] p-6 md:p-12 font-sans text-slate-200">
      {/* Header : Minimaliste */}
      <header 
        className="mb-12 flex justify-between items-end"
        style={{
          animation: 'fadeInUp 0.6s ease-out both'
        }}
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-medium text-white tracking-tight">
            SafeGuard <span className="text-slate-600">Analytics</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2 flex items-center gap-2">
            <span className="inline-block w-1 h-1 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
            Vue globale de l&apos;infrastructure
          </p>
        </div>
      </header>

      {/* Section 1: KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ElegantKpi 
          title="Montant Total" 
          value={`${totalAmount.toFixed(2)}€`} 
          change={`${amountChange}%`} 
          positive={parseFloat(amountChange) >= 0}
          delay={100}
        />
        <ElegantKpi 
          title="Transactions" 
          value={transactionCount.toString()} 
          change="0%" 
          positive={true}
          delay={200}
        />
        <ElegantKpi 
          title="Moyenne Transaction" 
          value={`${avgTransactionAmount.toFixed(2)}€`} 
          change="0%" 
          positive={true}
          delay={300}
        />
      </div>

      {/* Section 2: Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Graphique Principal : Line Chart "Smooth" */}
        <GlassCard 
          title="Évolution des montants" 
          subtitle="Montant cumulé dans le temps"
          className="lg:col-span-8 h-[420px]"
          delay={400}
        >
          <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              <linearGradient id="elegantGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={luxuryColors.primary} stopOpacity={0.3} />
                <stop offset="100%" stopColor={luxuryColors.primary} stopOpacity={0.0} />
              </linearGradient>
            </defs>
          </svg>
          {amountEvolutionData[0].data.length > 0 ? (
            <div className="animate-fadeIn" style={{ animation: 'fadeIn 1s ease-out 0.5s both' }}>
              <ResponsiveLine
                data={amountEvolutionData}
                theme={customElegantTheme}
                colors={[luxuryColors.primary]}
                margin={{ top: 10, right: 20, bottom: 40, left: 50 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false }}
                curve="monotoneX"
                axisTop={null}
                axisRight={null}
                enableGridX={false}
                enablePoints={true}
                pointSize={6}
                pointColor={luxuryColors.primary}
                pointBorderWidth={2}
                pointBorderColor="#fff"
                pointLabelYOffset={-12}
                animate={true}
                motionConfig="gentle"
                useMesh={true}
                enableArea={true}
                fill={[{ match: '*', id: 'elegantGradient' }]}
                lineWidth={3}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              Aucune donnée disponible
            </div>
          )}
        </GlassCard>

        {/* 2. Donut Chart : Minimaliste */}
        <GlassCard 
          title="Répartition" 
          subtitle="Par type de transaction"
          className="lg:col-span-4 h-[420px]"
          delay={500}
        >
          <div className="h-full w-full" style={{ position: 'relative' }}>
            {transactionTypeData.length > 0 ? (
              <>
                <div className="animate-fadeIn" style={{ animation: 'fadeIn 1s ease-out 0.6s both' }}>
                  <ResponsivePie
                    data={transactionTypeData}
                    theme={customElegantTheme}
                    colors={{ datum: 'data.color' }}
                    margin={{ top: 20, right: 20, bottom: 60, left: 20 }}
                    innerRadius={0.75}
                    padAngle={4}
                    cornerRadius={4}
                    activeOuterRadiusOffset={8}
                    borderWidth={0}
                    enableArcLinkLabels={false}
                    enableArcLabels={false}
                    animate={true}
                    motionConfig="gentle"
                    legends={[
                      {
                        anchor: 'bottom',
                        direction: 'row',
                        translateY: 30,
                        itemWidth: 90,
                        itemHeight: 18,
                        itemTextColor: '#94a3b8',
                        symbolSize: 10,
                        symbolShape: 'circle',
                      }
                    ]}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-10 animate-fadeIn" style={{ animation: 'fadeIn 0.8s ease-out 0.8s both' }}>
                  <div className="text-center">
                    <span className="text-3xl font-semibold text-white">{transactionCount}</span>
                    <p className="text-slate-500 text-xs">Total</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                Aucune transaction
              </div>
            )}
          </div>
        </GlassCard>

        {/* 3. Bar Chart : Sobre */}
        <GlassCard 
          title="Répartition des billets" 
          subtitle="Quantité par valeur de billet"
          className="lg:col-span-12 h-[350px]"
          delay={600}
        >
          {billEvolutionData.length > 0 ? (
            <div className="animate-fadeIn" style={{ animation: 'fadeIn 1s ease-out 0.7s both' }}>
              <ResponsiveBar
                data={billEvolutionData}
                keys={['quantite']}
                indexBy="valeur"
                theme={customElegantTheme}
                colors={[luxuryColors.secondary]} 
                margin={{ top: 10, right: 30, bottom: 40, left: 60 }}
                padding={0.5}
                layout="horizontal"
                borderRadius={4}
                enableGridY={false}
                enableGridX={true}
                axisTop={null}
                axisRight={null}
                axisLeft={{
                  tickSize: 0,
                  tickPadding: 15,
                  tickRotation: 0,
                }}
                axisBottom={{
                  tickSize: 0,
                  tickPadding: 15,
                  tickRotation: 0,
                  legend: "QUANTITÉ",
                  legendPosition: 'middle',
                  legendOffset: 35
                }}
                labelTextColor={{ from: 'color', modifiers: [['brighter', 3]] }}
                animate={true}
                motionConfig="gentle"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              Aucun billet en caisse
            </div>
          )}
        </GlassCard>
      </div>
    </main>
  )
}
