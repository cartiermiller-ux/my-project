import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/ProductCard";
import { 
  useListCategories, 
  useListProducts,
  getListCategoriesQueryKey,
  getListProductsQueryKey
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronRight, Zap, Shield, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [search, setSearch] = useState("");
  
  const { data: categories, isLoading: categoriesLoading } = useListCategories({ 
    query: { queryKey: getListCategoriesQueryKey() } 
  });
  
  const { data: featuredProducts, isLoading: featuredLoading } = useListProducts(
    { featured: true },
    { query: { queryKey: getListProductsQueryKey({ featured: true }) } }
  );

  const { data: recentProducts, isLoading: recentLoading } = useListProducts(
    {},
    { query: { queryKey: getListProductsQueryKey({}) } }
  );

  const displayRecent = recentProducts?.slice(0, 8) || [];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none" />
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Digital Goods</span> Marketplace.
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
              Instant delivery. Secure payments. High-quality digital subscriptions, gaming cards, and API keys.
            </p>
            
            <div className="relative max-w-xl">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <Input 
                type="text" 
                className="pl-12 pr-24 py-6 text-lg rounded-xl border-primary/20 bg-background/50 backdrop-blur focus-visible:ring-primary/50" 
                placeholder="Search Netflix, Spotify, ChatGPT..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && search) {
                    window.location.href = `/products?search=${encodeURIComponent(search)}`;
                  }
                }}
              />
              <Button 
                className="absolute right-2 top-2 bottom-2 rounded-lg px-6" 
                onClick={() => search && (window.location.href = `/products?search=${encodeURIComponent(search)}`)}
              >
                Search
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-4 mt-8 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-primary" /> Instant Delivery</div>
              <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-primary" /> 100% Secure</div>
              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> 24/7 Automated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-16 border-b border-border/20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Browse Categories</h2>
          <Button variant="ghost" className="text-primary" asChild>
            <Link href="/products">View All <ChevronRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>
        
        {categoriesLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories?.map((cat) => (
              <Link 
                key={cat.id} 
                href={`/products?category=${cat.id}`}
                className="flex flex-col items-center justify-center p-6 bg-card/40 border border-border/50 rounded-xl hover:bg-card hover:border-primary/50 transition-all group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{cat.icon || "📦"}</div>
                <span className="font-medium text-sm text-center">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured Products */}
      {(featuredProducts?.length ?? 0) > 0 && (
        <section className="container mx-auto px-4 py-16 border-b border-border/20">
          <h2 className="text-2xl font-bold tracking-tight mb-8 flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary fill-primary/20" /> 
            Featured Products
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* All Products */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Latest Additions</h2>
          <Button variant="outline" asChild>
            <Link href="/products">Browse Catalog</Link>
          </Button>
        </div>
        
        {recentLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayRecent.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
