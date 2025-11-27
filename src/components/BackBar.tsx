import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackBarProps {
  label?: string;
  to?: string; // optional explicit fallback path
  desktopOnly?: boolean; // if true, only show on desktop (hidden on mobile)
}

export const BackBar: React.FC<BackBarProps> = ({ label = "Back", to = "/", desktopOnly = false }) => {
  const navigate = useNavigate();

  const goBack = () => {
    // Always navigate to the explicit path to avoid going to wrong pages
    navigate(to, { replace: true });
  };

  return (
    <div className={`mb-6 ${desktopOnly ? "hidden sm:block" : ""}`}>
      <Button variant="ghost" onClick={goBack} className="gap-2 px-2 text-sm">
        <ArrowLeft className="w-4 h-4" /> {label}
      </Button>
    </div>
  );
};