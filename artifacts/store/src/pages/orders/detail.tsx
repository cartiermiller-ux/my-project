import { useRoute, Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, AlertTriangle, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function OrderDetail() {
  const [, params] = useRoute("/orders/:id");
  const orderId = parseInt(params?.id || "0");
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
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-3 text-muted-foreground">
          <Link href="/orders"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders</Link>
        </Button>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : error || !order ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
            <p className="text-muted-foreground">We couldn't find the requested order.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">Order #{order.id}</h1>
              <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                {order.status}
              </Badge>
            </div>

            <Card className="bg-card/50">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Date</div>
                    <div className="font-medium">{format(new Date(order.createdAt), "MMM d, yyyy")}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Product</div>
                    <div className="font-medium truncate" title={order.productName || ""}>{order.productName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Quantity</div>
                    <div className="font-medium">{order.quantity}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total</div>
                    <div className="font-bold text-primary">¥{order.totalPrice.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-lg shadow-primary/5">
              <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
                <CardTitle className="text-lg">Digital Content</CardTitle>
                <CardDescription>Your purchased keys and codes are listed below.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {order.cardContents ? (
                  <div className="bg-muted p-4 rounded-xl border border-border/50 relative font-mono text-sm leading-relaxed whitespace-pre-wrap group">
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
                    Content is currently unavailable.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
