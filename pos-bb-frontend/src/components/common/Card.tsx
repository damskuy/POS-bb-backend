import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = "", onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`card-premium ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </div>
  );
};
