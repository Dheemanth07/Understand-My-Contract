// src/components/Logo.tsx
import { Link } from 'react-router-dom';

// Adjust the path if your logo is saved elsewhere
import logoImage from '../assets/legal-icon.png'; 

export default function Logo() {
  return (
    <Link to="/" className="flex items-center space-x-3 group">
      <img src={logoImage} alt="LegalSimplify Logo" className="h-8 w-8" />
      <span className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
        LegalSimplify
      </span>
    </Link>
  );
}