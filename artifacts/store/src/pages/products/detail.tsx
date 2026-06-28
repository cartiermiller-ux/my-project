import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { 
  useGetProduct, 
  useGetMe,
  useCreateOrder,
  getGetProductQueryKey,
  getGetMeQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Shield, ShoppingCart, Zap, Clock, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const id = parseInt(params?.id || "0");
  
  const [quantity, setQuantity] = useState(1);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: user } = useGetMe({
    query: { retry: false, staleTime: Infinity }
  });

  const { data: product, isLoading } = useGetProduct(id, {
    query: {
      queryKey: getGetProductQueryKey(id),
      enabled: !!id
    }
  });

  const createOrder = useCreateOrder();

  const handlePurchase = () => {
    setError(null);
    if (!product) return;
    
    if (!user && !email) {
      setError("Email is required for guest purchases.");
      return;
    }

    if (quantity > product.stock) {
      setError(`Only ${product.stock} items in stock.`);
      return;
    }

    createOrder.mutate({
      data: {
        productId: product.id,
        quantity,
        email: user ? undefined : email
      }
    }, {
      onSuccess: (order) => {
        queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(id) });
        if (user) {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        }
        setLocation(`/checkout/${order.id}`);
      },
      onError: (err: any) => {
        setError(err.message || "Failed to complete purchase. Check your balance.");
      }
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ) : !product ? (
          <div className="text-center py-24">
            <h2 className="text-2xl font-bold mb-2">Product not found</h2>
            <Button asChild className="mt-4"><Link href="/products">Back to Marketplace</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Image Section */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl overflow-hidden bg-card border border-border/50 aspect-video relative flex items-center justify-center">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingCart className="w-24 h-24 text-muted-foreground/20" />
                )}
                
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {product.region && (
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur font-medium text-sm px-3 py-1">
                      {product.region}
                    </Badge>
                  )}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <Badge variant="destructive" className="font-semibold shadow-sm text-sm px-3 py-1">
                      Sale
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-8 prose prose-invert max-w-none">
                <h3 className="text-xl font-semibold mb-4 border-b border-border/50 pb-2">Description</h3>
                <div className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {product.description}
                </div>
              </div>
            </div>

            {/* Purchase Section */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 p-6 rounded-2xl border border-border bg-card/50 backdrop-blur-sm">
                <div className="mb-2 text-primary font-medium tracking-wide uppercase text-sm">
                  {product.categoryName}
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-4 leading-tight">
                  {product.name}
                </h1>
                
                <div className="flex items-end gap-3 mb-6">
                  <span className="text-4xl font-extrabold tracking-tight text-primary">
                    ¥{product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-lg text-muted-foreground line-through decoration-muted-foreground/50 mb-1">
                      ¥{product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 py-4 border-y border-border/50">
                  <div className="flex items-center gap-1.5">
                    <span className={product.stock > 0 ? "text-green-500" : "text-destructive"}>●</span>
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                  </div>
                  <span>•</span>
                  <div>{product.salesCount} sold</div>
                </div>

                <div className="space-y-6">
                  {error && (
                    <div className="p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {!user && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email (for delivery)</label>
                      <Input 
                        type="email" 
                        placeholder="your@email.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Or <Link href="/auth/login" className="text-primary hover:underline">log in</Link> for faster checkout.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <div className="flex items-center border border-input rounded-md max-w-[150px]">
                      <button 
                        className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={product.stock === 0}
                      >-</button>
                      <input 
                        type="number" 
                        className="w-full text-center bg-transparent focus:outline-none py-2 border-x border-input text-sm font-medium"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                        min={1}
                        max={product.stock}
                        disabled={product.stock === 0}
                      />
                      <button 
                        className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        disabled={product.stock === 0}
                      >+</button>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between text-lg font-bold border-t border-border/50">
                    <span>Total</span>
                    <span>¥{(product.price * quantity).toFixed(2)}</span>
                  </div>

                  <Button 
                    className="w-full py-6 text-lg rounded-xl shadow-lg"
                    size="lg"
                    disabled={product.stock === 0 || createOrder.isPending}
                    onClick={handlePurchase}
                  >
                    {createOrder.isPending ? "Processing..." : product.stock === 0 ? "Out of Stock" : "Buy Now"}
                  </Button>
                  
                  {user && user.balance < (product.price * quantity) && product.stock > 0 && (
                    <div className="text-center text-sm text-muted-foreground">
                      Insufficient balance. <Link href="/user/balance" className="text-primary hover:underline">Top up now</Link>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/50">
                    <div className="flex flex-col items-center justify-center text-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <Zap className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground">Instant Auto-Delivery</span>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center gap-2 p-3 bg-muted/30 rounded-lg">
                      <Shield className="w-5 h-5 text-primary" />
                      <span className="text-xs font-medium text-muted-foreground">Secure Guarantee</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </Layout>
  );
}
