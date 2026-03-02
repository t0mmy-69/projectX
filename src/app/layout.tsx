import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { PageTransition } from "@/components/PageTransition";

export const metadata: Metadata = {
    title: {
        default: "NarrativeOS - Turn X Into Your Narrative Weapon",
        template: "%s | NarrativeOS",
    },
    description: "AI-powered narrative intelligence for X. Track topics, detect viral posts, and generate persona-matched drafts.",
    keywords: ["NarrativeOS", "X growth", "viral feed", "AI drafts", "social media automation"],
    applicationName: "NarrativeOS",
    metadataBase: new URL("https://project-x-lilac.vercel.app"),
    alternates: { canonical: "/" },
    openGraph: {
        title: "NarrativeOS - Turn X Into Your Narrative Weapon",
        description: "Track narratives, spot viral content, and create high-performance drafts with AI.",
        type: "website",
        url: "https://project-x-lilac.vercel.app",
        siteName: "NarrativeOS",
    },
    twitter: {
        card: "summary_large_image",
        title: "NarrativeOS",
        description: "Narrative & growth OS for X creators.",
    },
    robots: {
        index: true,
        follow: true,
    },
    icons: {
        icon: "/favicon.ico",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <link rel="icon" href="/favicon.ico" />
            </head>
            <body>
                <ToastProvider>
                    <PageTransition>{children}</PageTransition>
                </ToastProvider>
            </body>
        </html>
    );
}
