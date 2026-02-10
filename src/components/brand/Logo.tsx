import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  useDarkAsset?: boolean;
}

const LOGO_LIGHT_URL = "https://assets.dev.anduslabs.com/kanban/logos/andus-logo.png";
const LOGO_DARK_URL = "https://assets.dev.anduslabs.com/kanban/logos/andus_logo_white.png";

export const Logo = ({ className, useDarkAsset = false }: LogoProps): JSX.Element => {
  const src = useDarkAsset ? LOGO_DARK_URL : LOGO_LIGHT_URL;

  return <img className={cn("h-8 w-auto", className)} src={src} alt="Andus Labs" loading="lazy" />;
};
