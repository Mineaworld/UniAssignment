import React from 'react';

interface LogoProps {
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Reusable Logo component for consistent branding across the app.
 * Use this component instead of inline <img> tags to ensure consistency.
 */
const Logo = ({ size = 'md', className = '' }: LogoProps) => {
    const sizeClasses = {
        xs: 'w-9 h-9',
        sm: 'w-10 h-10',
        md: 'w-16 h-16',
        lg: 'w-20 h-20',
    };

    return (
        <img
            src="/logo.png"
            alt="UniAssignment Logo"
            className={`${sizeClasses[size]} rounded-2xl shadow-lg object-cover ${className}`}
        />
    );
};

export default Logo;
