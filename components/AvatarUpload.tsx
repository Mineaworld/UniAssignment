import React, { useState, useEffect } from 'react';

interface AvatarUploadProps {
    currentAvatarUrl?: string;
    name?: string;
    onFileSelect: (file: File) => void;
    className?: string;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
    currentAvatarUrl,
    name = 'User',
    onFileSelect,
    className = ''
}) => {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
        // Reset preview when currentAvatarUrl changes (e.g. after save)
        setAvatarPreview(null);
    }, [currentAvatarUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            onFileSelect(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    return (
        <div className={`relative group ${className}`}>
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-800 border-4 border-white dark:border-[#1e293b] shadow-lg transition-transform hover:scale-105 duration-300">
                <img
                    src={avatarPreview || currentAvatarUrl || `https://ui-avatars.com/api/?name=${name}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                />

                {/* Overlay on hover */}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                    <span className="material-symbols-outlined text-white text-3xl drop-shadow-md">
                        photo_camera
                    </span>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </label>
            </div>

            {/* Optional label for mobile/accessibility or if hover isn't clear */}
            <div className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-700 rounded-full shadow-md border border-gray-100 dark:border-slate-600 text-primary dark:text-primary-light group-hover:hidden md:hidden">
                <span className="material-symbols-outlined text-[20px] block">edit</span>
            </div>
        </div>
    );
};

export default AvatarUpload;
