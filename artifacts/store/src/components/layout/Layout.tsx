import { ReactNode } from "react";
import { Link } from "wouter";
import { useGetMe, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, User as UserIcon, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";

export function Navbar() {
  const { data: user, error } = useGetMe();
  const logout = useLogout();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        window.location.href = "/";
      }
    });
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">NexusCards</span>
          </Link>
          <div className="hidden md:flex gap-4">
            <Link href="/products" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Marketplace
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {!user || error ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Sign up</Link>
              </Button>
            </>
          ) : (
            <>
              {user.role === 'admin' && (
                <Button variant="outline" size="sm" asChild className="hidden md:flex">
                  <Link href="/admin">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Admin
                  </Link>
                </Button>
              )}
              
              <div className="flex items-center gap-4 border-l border-border pl-4">
                <Link href="/user/balance" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  ¥{user.balance?.toFixed(2)}
                </Link>
                
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/user/profile">
                    <UserIcon className="h-5 w-5" />
                    <span className="sr-only">Profile</span>
                  </Link>
                </Button>
                
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/orders">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="sr-only">Orders</span>
                  </Link>
                </Button>
                
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5 text-muted-foreground hover:text-destructive" />
                  <span className="sr-only">Log out</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold tracking-tight">NexusCards</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Premium digital goods marketplace. Secure, instant delivery, 24/7 automated issuance.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Marketplace</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/products" className="hover:text-primary transition-colors">All Products</Link></li>
              <li><Link href="/auth/register" className="hover:text-primary transition-colors">Create Account</Link></li>
              <li><Link href="/user/balance" className="hover:text-primary transition-colors">Top Up Balance</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} NexusCards. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground">
      <Navbar />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
