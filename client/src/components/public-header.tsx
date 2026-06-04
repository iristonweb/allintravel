import { Button } from "@/components/ui/button";
import { Globe, LogIn } from "lucide-react";
import { Link, useLocation } from "wouter";

type PublicHeaderProps = {
  /**
   * Optional anchor links for a marketing landing page.
   * When omitted, only logo + login are shown.
   */
  navItems?: Array<{ href: string; label: string }>;
};

export default function PublicHeader({ navItems }: PublicHeaderProps) {
  const [, navigate] = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/20 backdrop-blur supports-[backdrop-filter]:bg-background/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <Globe className="text-primary text-2xl mr-2" />
            <span className="text-xl font-bold text-foreground">All In Travel</span>
          </Link>

          {navItems?.length ? (
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          ) : null}

          <Button
            variant="premium"
            size="sm"
            onClick={() => navigate("/login")}
            className="rounded-full px-4"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Войти
          </Button>
        </div>
      </div>
    </header>
  );
}

