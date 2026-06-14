// src/components/Logo.tsx
import { Link } from 'react-router-dom';
import logoImage from '../assets/legal-icon.png'; 

export default function Logo() {
  return (
    <Link to="/" className="flex items-center space-x-2.5 group">
      <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100/80 flex items-center justify-center transition-all duration-200 group-hover:scale-105 group-hover:border-blue-200">
        <img src={logoImage} alt="LegalSimplify Logo" className="h-6 w-6 object-contain" />
      </div>
      <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors duration-200">
        LegalSimplify
      </span>
    </Link>
  );
}