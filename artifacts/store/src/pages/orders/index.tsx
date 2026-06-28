import { Layout } from "@/components/layout/Layout";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageOpen, ChevronRight } from "lucide-react";

export default function Orders() {
  const { data: orders, isLoading } = useListOrders({
    query: { queryKey: getListOrdersQueryKey() }
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Order History</h1>

        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
          <Card className="text-center py-16 border-dashed bg-muted/20">
            <CardContent>
              <PackageOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="text-xl font-medium mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">When you buy digital products, they will appear here.</p>
              <Button asChild><Link href="/products">Browse Marketplace</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden hover:border-primary/30 transition-colors bg-card/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6">
                  <div className="space-y-1 mb-4 sm:mb-0">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg">{order.productName}</span>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="bg-primary/10 text-primary hover:bg-primary/20">
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex gap-4">
                      <span>Order #{order.id}</span>
                      <span>•</span>
                      <span>{format(new Date(order.createdAt), "MMM d, yyyy HH:mm")}</span>
                      <span>•</span>
                      <span>Qty: {order.quantity}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="font-bold text-lg">¥{order.totalPrice.toFixed(2)}</div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="group">
                      <Link href={`/orders/${order.id}`}>
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
