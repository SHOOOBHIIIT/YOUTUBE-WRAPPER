import "./globals.css";
import { VT323, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Providers from "./Providers";
import PageTransition from "./PageTransition";

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "YouTube Wrapped — Your Year in YouTube",
  description:
    "Discover your YouTube viewing habits with a personalized, Spotify Wrapped-style summary. Upload your Google Takeout data and get insights on your top channels, binge sessions, and more.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${vt323.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>
          <PageTransition>{children}</PageTransition>
        </Providers>
        <div className="grain-overlay" aria-hidden="true" />
      </body>
    </html>
  );
}
