// We're using Lucide React icons, but we'll also create some custom icon wrappers
// for consistency and to make it easy to switch icon libraries in the future
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

// Define a standard interface for all icons
interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
}

// Extend each Lucide icon and export it with a consistent interface
export const Menu = (props: IconProps) => <LucideIcons.Menu {...props} />;
export const Grid = (props: IconProps) => <LucideIcons.LayoutGrid {...props} />;
export const List = (props: IconProps) => <LucideIcons.List {...props} />;
export const BookOpen = (props: IconProps) => <LucideIcons.BookOpen {...props} />;
export const Plus = (props: IconProps) => <LucideIcons.Plus {...props} />;
export const Settings = (props: IconProps) => <LucideIcons.Settings {...props} />;
export const CheckCircle = (props: IconProps) => <LucideIcons.CheckCircle {...props} />;
export const Save = (props: IconProps) => <LucideIcons.Save {...props} />;
export const CheckCircle2 = (props: IconProps) => <LucideIcons.CheckCircle2 {...props} />;
export const Search = (props: IconProps) => <LucideIcons.Search {...props} />;
export const MoreVertical = (props: IconProps) => <LucideIcons.MoreVertical {...props} />;
export const Pencil = (props: IconProps) => <LucideIcons.Pencil {...props} />;
export const Image = (props: IconProps) => <LucideIcons.Image {...props} />;
export const Trash2 = (props: IconProps) => <LucideIcons.Trash2 {...props} />;
export const UploadCloud = (props: IconProps) => <LucideIcons.UploadCloud {...props} />;
export const CheckSquare = (props: IconProps) => <LucideIcons.CheckSquare {...props} />;
export const Square = (props: IconProps) => <LucideIcons.Square {...props} />;
export const Home = (props: IconProps) => <LucideIcons.Home {...props} />;
export const Folder = (props: IconProps) => <LucideIcons.Folder {...props} />;
export const Clock = (props: IconProps) => <LucideIcons.Clock {...props} />;
export const BarChart = (props: IconProps) => <LucideIcons.BarChart {...props} />;
export const HelpCircle = (props: IconProps) => <LucideIcons.HelpCircle {...props} />;
export const User = (props: IconProps) => <LucideIcons.User {...props} />;
export const LogOut = (props: IconProps) => <LucideIcons.LogOut {...props} />;
export const Sun = (props: IconProps) => <LucideIcons.Sun {...props} />;
export const Moon = (props: IconProps) => <LucideIcons.Moon {...props} />;
export const Share = (props: IconProps) => <LucideIcons.Share2 {...props} />;
export const Star = (props: IconProps) => <LucideIcons.Star {...props} />;
export const Copy = (props: IconProps) => <LucideIcons.Copy {...props} />;
export const Check = (props: IconProps) => <LucideIcons.Check {...props} />;
export const PlusCircle = (props: IconProps) => <LucideIcons.PlusCircle {...props} />;
export const Download = (props: IconProps) => <LucideIcons.Download {...props} />;
export const Upload = (props: IconProps) => <LucideIcons.Upload {...props} />;
export const ArrowRight = (props: IconProps) => <LucideIcons.ArrowRight {...props} />;
export const ChevronRight = (props: IconProps) => <LucideIcons.ChevronRight {...props} />;
export const ChevronLeft = (props: IconProps) => <LucideIcons.ChevronLeft {...props} />;
export const ChevronDown = (props: IconProps) => <LucideIcons.ChevronDown {...props} />;

// Custom icon for remixicon compatibility
export const Icon = ({ 
  name, 
  className,
  size = 24
}: { 
  name: string;
  className?: string;
  size?: number | string;
}) => {
  return (
    <i className={cn(`ri-${name}`, className)} style={{ fontSize: size }}></i>
  );
};

// Export all LucideIcons for convenience
export { LucideIcons };