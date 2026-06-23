import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClaudeCode — DeepAgent",
  description: "LangChain DeepAgent powered by Claude Code UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-cc-bg text-cc-text font-mono h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
