import { useRoute, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Copy, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutSuccess() {
  const [, params] = useRoute("/checkout/:orderId");
  const orderId = parseInt(params?.orderId || "0");
  const { toast } = useToast();

  const { data: order, isLoading, error } = useGetOrder(orderId, {
    query: {
      queryKey: getGetOrderQueryKey(orderId),
      enabled: !!orderId
    }
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The card content has been copied.",
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 flex flex-col items-center max-w-3xl">
        {isLoading ? (
          <Card className="w-full">
            <CardContent className="p-8 space-y-6">
              <Skeleton className="h-12 w-12 rounded-full mx-auto" />
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ) : error || !order ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
            <p className="text-muted-foreground mb-6">We couldn't find the requested order.</p>
            <Button asChild><Link href="/">Return Home</Link></Button>
          </div>
        ) : (
          <div className="w-full text-center">
            <div className="mb-8 flex flex-col items-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight mb-3">Payment Successful</h1>
              <p className="text-lg text-muted-foreground">
                Thank you for your purchase. Your digital goods are ready.
              </p>
            </div>

            <Card className="text-left border-primary/20 bg-card shadow-xl shadow-primary/5">
              <CardHeader className="border-b border-border/50 bg-muted/20">
                <CardTitle>Order #{order.id}</CardTitle>
                <CardDescription>
                  {order.productName} × {order.quantity} (Total: ¥{order.totalPrice.toFixed(2)})
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Your Digital Content</h3>
                
                {order.cardContents ? (
                  <div className="bg-muted p-4 rounded-xl border border-border/50 relative font-mono text-sm leading-relaxed whitespace-pre-wrap text-primary-foreground group">
                    {order.cardContents}
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(order.cardContents!)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm">
                    Content is currently unavailable. Please contact support with your order number.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-8 flex justify-center gap-4">
              <Button variant="outline" asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
              {order.userId && (
                <Button asChild>
                  <Link href="/orders">View All Orders</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
