import { AppHero } from '@/components/app-hero'



export default function DashboardFeature() {
  return (
    <div>
      <AppHero title="Hello" subtitle="This is your new solana dashboard" />
      <div className="max-w-xl mx-auto py-6 sm:px-6 lg:px-8 text-center">
        <div className="space-y-2">
          <p>Start your solana journey with us</p>
          <a href="/account" className="text-base font-medium text-indigo-600 hover:text-indigo-500">
            Get started
          </a>
        </div>
      </div>
    </div>
  )
}
