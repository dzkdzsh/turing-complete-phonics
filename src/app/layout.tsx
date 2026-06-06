import type { Metadata } from 'next';
import './globals.css';
import { CloudProvider } from '@/components/CloudProvider';

export const metadata: Metadata = {
  title: '图灵拼读 — Turing Complete for Phonics',
  description:
    '一个让孩子重新发现英语发音系统的构造型学习游戏。重建失落语言文明的声音→音素→字母→阅读系统。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <script src="https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js" async></script>
      </head>
      <body className="h-full flex flex-col no-select">
        <script dangerouslySetInnerHTML={{__html:`if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`}} />
        <CloudProvider>{children}</CloudProvider>
      </body>
    </html>
  );
}
