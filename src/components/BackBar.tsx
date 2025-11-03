import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackBarProps {
  label?: string;
  to?: string; // optional explicit fallback path
}

export const BackBar: React.FC<BackBarProps> = ({ label = "Back", to = "/" }) => {
  const navigate = useNavigate();

  const goBack = () => {
    // If we have history, go back; else go to fallback
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(to);
    }
  };

  return (
    <div className="mb-6">
      <Button variant="ghost" onClick={goBack} className="gap-2 px-2 text-sm">
        <ArrowLeft className="w-4 h-4" /> {label}
      </Button>
    </div>
  );
};
