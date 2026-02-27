import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
    title: 'Dashboard IKU Fasilkom',
    description: 'Monitoring Kinerja Utama Fakultas',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap" rel="stylesheet" />
            </head>
            <body>
                <div id="root">{children}</div>
            </body>
        </html>
    );
}
