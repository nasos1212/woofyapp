import { Dog } from "lucide-react";

interface DogLoaderProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const DogLoader = ({ size = "md", className = "" }: DogLoaderProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div className="relative">
        <Dog 
          className={`${sizeClasses[size]} text-primary animate-bounce`} 
        />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
          <span className="w-1 h-1 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
          <span className="w-1 h-1 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
          <span className="w-1 h-1 bg-primary/60 rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
};

export default DogLoader;
