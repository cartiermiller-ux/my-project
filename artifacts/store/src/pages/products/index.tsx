import { useState, useMemo } from "react";
import { useLocation } from "wouter";
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
import { Search, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProductsPage() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeSearch, setActiveSearch] = useState(searchParams.get("search") || "");
  
  const initialCategory = searchParams.get("category");
  const [categoryId, setCategoryId] = useState<number | undefined>(
    initialCategory ? parseInt(initialCategory) : undefined
  );

  const { data: categories } = useListCategories({ 
    query: { queryKey: getListCategoriesQueryKey() } 
  });
  
  const { data: products, isLoading } = useListProducts(
    { 
      categoryId: categoryId,
      search: activeSearch || undefined
    },
    { 
      query: { 
        queryKey: getListProductsQueryKey({ 
          categoryId: categoryId,
          search: activeSearch || undefined
        }) 
      } 
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(search);
    
    // Update URL without reload
    const url = new URL(window.location.href);
    if (search) url.searchParams.set("search", search);
    else url.searchParams.delete("search");
    window.history.replaceState({}, "", url.toString());
  };

  const setCategory = (id: number | undefined) => {
    setCategoryId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("category", id.toString());
    else url.searchParams.delete("category");
    window.history.replaceState({}, "", url.toString());
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar / Filters */}
          <aside className="w-full md:w-64 shrink-0 space-y-8">
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" /> Search
              </h2>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input 
                  placeholder="Find products..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-card/50"
                />
                <Button type="submit" size="icon" variant="secondary">
                  <Search className="w-4 h-4" />
                </Button>
              </form>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" /> Categories
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => setCategory(undefined)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    categoryId === undefined 
                      ? "bg-primary text-primary-foreground font-medium" 
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  All Products
                </button>
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                      categoryId === cat.id 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    <span>{cat.icon}</span> {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
              
              <div className="flex flex-wrap gap-2 ml-auto">
                {activeSearch && (
                  <Badge variant="secondary" className="px-3 py-1 gap-1 flex items-center bg-card">
                    Search: "{activeSearch}"
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive" 
                      onClick={() => {
                        setSearch("");
                        setActiveSearch("");
                        const url = new URL(window.location.href);
                        url.searchParams.delete("search");
                        window.history.replaceState({}, "", url.toString());
                      }}
                    />
                  </Badge>
                )}
                {categoryId && categories && (
                  <Badge variant="secondary" className="px-3 py-1 gap-1 flex items-center bg-card">
                    Category: {categories.find(c => c.id === categoryId)?.name}
                    <X 
                      className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive" 
                      onClick={() => setCategory(undefined)}
                    />
                  </Badge>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl bg-card/20">
                <Search className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground max-w-md">
                  We couldn't find any products matching your filters. Try clearing your search or selecting a different category.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={() => {
                    setCategory(undefined);
                    setSearch("");
                    setActiveSearch("");
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products?.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </Layout>
  );
}
