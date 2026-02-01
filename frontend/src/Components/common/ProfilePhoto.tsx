import React from 'react';

interface ProfilePhotoProps {
  image: string;
  size?: 'small' | 'medium' | 'large';
}

const ProfilePhoto: React.FC<ProfilePhotoProps> = ({ image, size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  return (
    <img
      src={image}
      alt="Profile"
      className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-300`}
    />
  );
};

export default ProfilePhoto;