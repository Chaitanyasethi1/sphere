import type { Metadata, Viewport } from "next";
import "./globals.css";

// TODO(VERIFY): Exact NASA font used in Eyes on the Solar System (Barlow 300 / Barlow Semi Condensed vs proprietary face)

export const metadata: Metadata = {
  title: "Eyes on SPHEREx: Sky Diary - NASA Space Apps Challenge",
  description:
    "Explore multi-epoch SPHEREx sky time-lapses, automated asteroid and comet detection, candidate follow-up, and 102-channel spectrophotometry in NASA Eyes on the Solar System visual language.",
  keywords: [
    "SPHEREx",
    "Eyes on SPHEREx",
    "NASA Space Apps Challenge",
    "Asteroids",
    "Planet X",
    "Spectrophotometry",
    "Astronomy",
    "Sky Diary",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#010206",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#010206] text-white font-sans antialiased min-h-screen overflow-x-hidden selection:bg-[#22D3EE] selection:text-black">
        {children}
      </body>
    </html>
  );
}
