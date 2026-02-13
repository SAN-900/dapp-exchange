import { AppProviders } from '@/components/app-providers.tsx'
import { AppLayout } from '@/components/app-layout.tsx'
import { RouteObject, useRoutes } from 'react-router'
import { lazy } from 'react'

const links = [
  //
  { label: 'Home', path: '/' },
  { label: 'Account', path: '/account' },
  { label: 'Swap', path: '/swap'}
]
const LazyDashboard = lazy(() => import('@/components/dashboard/dashboard-feature'))
const LazyAccountIndex = lazy(() => import('@/components/account/account-index-feature'))
const LazyAccountDetail = lazy(() => import('@/components/account/account-detail-feature'))
const LazyExchange = lazy(() => import('@/components/exchange/exchange-ui'))
const LazyExchangeIndexFeature = lazy(() => import('@/components/exchange/exchange-features'))

const routes: RouteObject[] = [
  { index: true, element: <LazyDashboard /> },
  {
    path: 'account',
    children: [
      { index: true, element: <LazyAccountIndex /> },
      { path: ':address', element: <LazyAccountDetail /> },
    ],
  },
  { path: 'swap', 
    children: [
      { index: true, element: <LazyExchangeIndexFeature /> },
      { path: ':address', element: <LazyExchange /> },
    ]
  },

]

export function App() {
  const router = useRoutes(routes)
  return (
    <AppProviders>
      <AppLayout links={links}>{router}</AppLayout>
    </AppProviders>
  )
}
