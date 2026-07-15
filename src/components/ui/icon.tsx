import {
  Wand2, Boxes, Store, ShoppingBag, Code2, Package, FileText, Search,
  Server, Workflow, BarChart3, Bot, Sparkles, Rocket, TrendingUp, Shield,
  Zap, Globe, Users, LayoutDashboard, MessageSquare, PenTool, LineChart,
  Boxes as BoxesIcon, Lightbulb, Target, CreditCard, Truck, RefreshCw,
  CheckCircle2, Palette, Gauge, Brain, Eye, Layers, DollarSign, Clock,
  type LucideIcon,
} from "lucide-react";

export const iconMap = {
  Wand2, Boxes, Store, ShoppingBag, Code2, Package, FileText, Search,
  Server, Workflow, BarChart3, Bot, Sparkles, Rocket, TrendingUp, Shield,
  Zap, Globe, Users, LayoutDashboard, MessageSquare, PenTool, LineChart,
  BoxesIcon, Lightbulb, Target, CreditCard, Truck, RefreshCw,
  CheckCircle2, Palette, Gauge, Brain, Eye, Layers, DollarSign, Clock,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof iconMap;

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const Cmp = iconMap[name];
  return <Cmp className={className} />;
}
