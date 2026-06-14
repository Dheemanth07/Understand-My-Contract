import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="text-center space-y-5 max-w-sm bg-white p-8 border border-slate-200 shadow-sm rounded-lg">
        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6 text-rose-600" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900">404</h1>
          <p className="text-slate-500 text-sm font-semibold">Oops! Page not found</p>
        </div>
        <Link to="/" className="inline-block mt-2">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 rounded-md h-9 shadow-sm">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
