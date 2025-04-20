import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import AuthProvider from '../context/AuthProvider'
import { ThemeProvider } from '../context/ThemeProvider'
import { RouterChangeProvider } from '../context/RouterChangeProvider'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'NoteFav - Fikirlerini Not Al, Hedeflerini Gerçekleştir!',
  description: 'NoteFav ile notlarınızı düzenleyin, hedeflerinizi planlayın ve projelerinizi takip edin. Ücretsiz not alma, görev takibi ve hatırlatıcı uygulaması.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  keywords: 'not alma, notlar, görev takibi, hedef planlama, notefav, not tutma uygulaması, ücretsiz not uygulaması, online not defteri, hatırlatıcı, ajanda, yapılacaklar listesi',
  authors: [{ name: 'NoteFav' }],
  openGraph: {
    title: 'NoteFav - Fikirlerini Not Al, Hedeflerini Gerçekleştir!',
    description: 'NoteFav ile notlarınızı düzenleyin, hedeflerinizi planlayın ve projelerinizi takip edin. Ücretsiz not alma, görev takibi ve hatırlatıcı uygulaması.',
    url: 'https://notefav.com',
    siteName: 'NoteFav',
    images: [
      {
        url: '/images/notefav-og-image.png',
        width: 1200,
        height: 630,
        alt: 'NoteFav Logo',
      }
    ],
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NoteFav - Fikirlerini Not Al, Hedeflerini Gerçekleştir!',
    description: 'NoteFav ile notlarınızı düzenleyin, hedeflerinizi planlayın ve projelerinizi takip edin.',
    images: ['/images/notefav-twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://notefav.com',
    languages: {
      'tr-TR': 'https://notefav.com',
    },
  },
  verification: {
    google: 'google-site-verification-code', // Google Search Console doğrulama kodu eklenecek
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
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
        <Toaster />
      </body>
    </html>
  )
}
