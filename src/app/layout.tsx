import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Turnout — events people actually show up to",
  description: "RSVPs, waitlists, reminders and QR check-in for tech communities in India.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
