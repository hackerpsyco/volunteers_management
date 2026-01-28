import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import wesLogo from "@/assets/wes-logo.jpg";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <img 
            src={wesLogo} 
            alt="WES Foundation Logo" 
            className="h-20 w-20 object-contain opacity-50"
          />
        </div>
        <div>
          <h1 className="mb-2 text-6xl font-bold text-foreground">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
          <p className="mb-6 text-sm text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <a 
          href="/dashboard" 
          className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
};

export default NotFound;
