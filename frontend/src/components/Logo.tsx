// src/components/Logo.tsx
import { Link } from 'react-router-dom';
import logoImage from '../assets/legal-icon.png';

export default function Logo() {
  return (
    <Link to="/" className="flex items-center space-x-2.5 group">
      <img
        src={logoImage}
        alt="LegalSimplify Logo"
        className="h-8 w-8 object-contain rounded-xl shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:shadow-md"
      />
      <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors duration-200">
        LegalSimplify
      </span>
    </Link>
  );
}