import { AdminLayout } from "@/components/layout/AdminLayout";
import { useGetAdminStats, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  ShoppingCart, 
  CreditCard, 
  Wallet, 
  Package,
  ArrowUpRight
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey() }
  });

  const statCards = [
    { title: "Total Revenue", value: `¥${stats?.totalRevenue.toFixed(2) || '0.00'}`, icon: Wallet, color: "text-emerald-500" },
    { title: "Total Orders", value: stats?.totalOrders || 0, icon: ShoppingCart, color: "text-blue-500" },
    { title: "Products", value: stats?.totalProducts || 0, icon: Package, color: "text-purple-500" },
    { title: "Users", value: stats?.totalUsers || 0, icon: Users, color: "text-orange-500" },
    { title: "Total Cards", value: stats?.totalCards || 0, icon: CreditCard, color: "text-indigo-500" },
    { title: "Available Cards", value: stats?.availableCards || 0, icon: CreditCard, color: "text-primary" },
  ];

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))
          ) : (
            statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i} className="bg-card/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Card className="bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/admin/orders" className="text-sm text-primary flex items-center hover:underline">
              View all <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !stats?.recentOrders?.length ? (
              <div className="text-center py-8 text-muted-foreground">No recent orders</div>
            ) : (
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b border-border/50">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Order ID</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Amount</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/50 transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">#{order.id}</td>
                        <td className="p-4 align-middle">{order.productName}</td>
                        <td className="p-4 align-middle">¥{order.totalPrice.toFixed(2)}</td>
                        <td className="p-4 align-middle">
                          <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className="bg-primary/10 text-primary">
                            {order.status}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle text-muted-foreground">
                          {format(new Date(order.createdAt), "MMM d, HH:mm")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
}
