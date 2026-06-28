import { Link } from "wouter";
import { Product } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const isOutOfStock = product.stock === 0;
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <Card className="overflow-hidden group hover:border-primary/50 transition-colors border-border/50 bg-card/50">
      <Link href={`/products/${product.id}`} className="block relative aspect-[4/3] bg-muted overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-gradient-to-br from-muted to-muted/50">
            <ShoppingCart className="w-12 h-12" />
          </div>
        )}
        
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.region && (
            <Badge variant="secondary" className="bg-background/80 backdrop-blur font-medium">
              {product.region}
            </Badge>
          )}
          {hasDiscount && (
            <Badge variant="destructive" className="font-semibold shadow-sm">
              Sale
            </Badge>
          )}
        </div>
      </Link>
      
      <CardContent className="p-4">
        <div className="text-xs text-primary/80 font-medium mb-1 tracking-wide uppercase">
          {product.categoryName}
        </div>
        <Link href={`/products/${product.id}`} className="hover:text-primary transition-colors block">
          <h3 className="font-semibold text-lg leading-tight line-clamp-1 mb-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-auto">
          <span className="text-xl font-bold">¥{product.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/50">
              ¥{product.originalPrice?.toFixed(2)}
            </span>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" 
          variant={isOutOfStock ? "secondary" : "default"}
          disabled={isOutOfStock}
          asChild={!isOutOfStock}
        >
          {isOutOfStock ? (
            <span>已售罄 / Out of Stock</span>
          ) : (
            <Link href={`/products/${product.id}`}>
              View Details
            </Link>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
