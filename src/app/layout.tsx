import type { Metadata } from 'next';
import './globals.css';
import AuthProvider from '@/components/AuthProvider';

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
      <body className="h-full flex flex-col no-select">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
