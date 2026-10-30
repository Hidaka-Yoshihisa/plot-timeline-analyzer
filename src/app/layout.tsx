import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plot Structure Analyzer",
  description: "小説・漫画のプロット構造を静かに読み解くAI分析ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

