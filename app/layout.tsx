import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Tech Daily - AI技术日报',
  description: '每日自动采集 AI、智能体、图形技术领域的最新进展',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-500">
          AI Tech Daily © 2026 · 数据每日自动更新
        </footer>
      </body>
    </html>
  )
}