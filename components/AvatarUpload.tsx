import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Constants
// ============================================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UI_AVATARS_BASE_URL = 'https://ui-avatars.com/api/?name=';

// ============================================================================
// Types
// ============================================================================

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  name?: string;
  onFileSelect: (file: File) => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  name = 'User',
  onFileSelect,
  className = ''
}) => {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track blob URL for cleanup
  const blobUrlRef = useRef<string | null>(null);

  // Reset preview when currentAvatarUrl changes
  useEffect(() => {
    setAvatarPreview(null);
    setError(null);
  }, [currentAvatarUrl]);

  // Cleanup blob URL on unmount or when preview changes
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB');
      return;
    }

    // Revoke previous blob URL to prevent memory leak
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    // Create new blob URL
    const blobUrl = URL.createObjectURL(file);
    blobUrlRef.current = blobUrl;
    setAvatarPreview(blobUrl);
    onFileSelect(file);
  }, [onFileSelect]);

  const avatarSrc = avatarPreview || currentAvatarUrl || `${UI_AVATARS_BASE_URL}${encodeURIComponent(name)}`;

  return (
    <div className={`relative group ${className}`}>
      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-800 border-4 border-white dark:border-[#1e293b] shadow-lg transition-transform hover:scale-105 duration-300">
        <img
          src={avatarSrc}
          alt={`${name} profile`}
          className="w-full h-full object-cover"
        />

        {/* Overlay on hover */}
        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
          <span className="material-symbols-outlined text-white text-3xl drop-shadow-md" aria-hidden="true">
            photo_camera
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            aria-label="Upload profile picture"
          />
        </label>
      </div>

      {/* Error message */}
      {error && (
        <p className="absolute -bottom-6 left-0 right-0 text-xs text-red-500 text-center whitespace-nowrap">
          {error}
        </p>
      )}

      {/* Mobile edit button */}
      <div className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-700 rounded-full shadow-md border border-gray-100 dark:border-slate-600 text-primary dark:text-primary-light group-hover:hidden md:hidden">
        <span className="material-symbols-outlined text-[20px] block" aria-hidden="true">
          edit
        </span>
      </div>
    </div>
  );
};

export default AvatarUpload;
