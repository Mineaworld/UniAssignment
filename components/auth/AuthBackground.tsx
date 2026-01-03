import React from 'react';

interface AuthBackgroundProps {
    /** Accent color for the second blob. Use Tailwind color classes like 'purple-500' or 'emerald-500' */
    accentColor?: 'purple' | 'emerald';
}

/**
 * Shared background component for Login and SignUp pages.
 * Provides a consistent "Avant-Garde" aesthetic with radial gradients and blur blobs.
 */
export const AuthBackground = ({ accentColor = 'purple' }: AuthBackgroundProps) => {
    const accentBlobClass = accentColor === 'emerald'
        ? 'bg-emerald-500/10'
        : 'bg-purple-500/10';

    return (
        <>
            {/* Dynamic Background */}
            <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
            <div className="absolute top-0 left-1/2 w-[1000px] h-[500px] -translate-x-1/2 bg-primary/20 blur-[130px] rounded-full opacity-50 pointer-events-none" />
            <div className={`absolute bottom-0 right-0 w-[800px] h-[600px] ${accentBlobClass} blur-[150px] rounded-full opacity-30 pointer-events-none`} />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
        </>
    );
};

export default AuthBackground;
