import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import AuthProvider from '../context/AuthProvider'
import { ThemeProvider } from '../context/ThemeProvider'
import { RouterChangeProvider } from '../context/RouterChangeProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'NoteFav - Fikirlerini Not Al, Hedeflerini Gerçekleştir!',
  description: 'Fikirlerinizi düzenleyin, hedeflerinizi planlayın ve projelerinizi takip edin.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <ThemeProvider>
          <AuthProvider>
            <RouterChangeProvider>
              <Navbar />
              <main className="flex-grow container mx-auto px-4 py-8">
                {children}
              </main>
              <Footer />
            </RouterChangeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
