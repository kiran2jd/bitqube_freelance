import React from "react";
import {
  Scale,
  Briefcase,
  TrendingUp,
  Boxes,
  Server,
  Code2,
  Megaphone,
  Bot,
  Palette,
  Calculator,
  Users,
  Building2,
  GraduationCap,
  Languages,
  Sparkles,
  HelpCircle,
  LucideProps,
} from "lucide-react";

interface CategoryIconProps extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  switch (name) {
    case "Scale":
      return <Scale {...props} />;
    case "Briefcase":
      return <Briefcase {...props} />;
    case "TrendingUp":
      return <TrendingUp {...props} />;
    case "Blocks":
      return <Boxes {...props} />;
    case "Server":
      return <Server {...props} />;
    case "Code":
      return <Code2 {...props} />;
    case "Megaphone":
      return <Megaphone {...props} />;
    case "Bot":
      return <Bot {...props} />;
    case "Palette":
      return <Palette {...props} />;
    case "Calculator":
      return <Calculator {...props} />;
    case "Users":
      return <Users {...props} />;
    case "Building":
      return <Building2 {...props} />;
    case "GraduationCap":
      return <GraduationCap {...props} />;
    case "Languages":
      return <Languages {...props} />;
    case "Sparkles":
      return <Sparkles {...props} />;
    default:
      return <HelpCircle {...props} />;
  }
};
