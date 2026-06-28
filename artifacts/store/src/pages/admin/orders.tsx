import { AdminLayout } from "@/components/layout/AdminLayout";
import { useListAllOrders, getListAllOrdersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function AdminOrders() {
  const { data: orders, isLoading } = useListAllOrders({}, {
    query: { queryKey: getListAllOrdersQueryKey() }
  });

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">All Orders</h1>

        <Card className="bg-card/50">
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border/50">
              <table className="w-full text-sm">
                <thead className="border-b border-border/50 bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium">Order ID</th>
                    <th className="p-3 text-left font-medium">User/Email</th>
                    <th className="p-3 text-left font-medium">Product</th>
                    <th className="p-3 text-left font-medium">Total</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : !orders?.length ? (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No orders found.</td></tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-3 font-medium">#{order.id}</td>
                        <td className="p-3">
                          {order.userId ? `User #${order.userId}` : order.email || "Guest"}
                        </td>
                        <td className="p-3">
                          {order.productName} <span className="text-muted-foreground text-xs">x{order.quantity}</span>
                        </td>
                        <td className="p-3 font-medium text-primary">¥{order.totalPrice.toFixed(2)}</td>
                        <td className="p-3">
                          <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="bg-primary/10 text-primary">
                            {order.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {format(new Date(order.createdAt), "MMM d, yyyy HH:mm")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
