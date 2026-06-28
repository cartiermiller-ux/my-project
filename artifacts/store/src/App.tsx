import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Home from "@/pages/home";
import ProductsIndex from "@/pages/products/index";
import ProductDetail from "@/pages/products/detail";
import CheckoutSuccess from "@/pages/checkout/success";
import OrdersIndex from "@/pages/orders/index";
import OrderDetail from "@/pages/orders/detail";
import UserProfile from "@/pages/user/profile";
import UserBalance from "@/pages/user/balance";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";

// Admin
import AdminDashboard from "@/pages/admin/index";
import AdminProducts from "@/pages/admin/products";
import AdminCards from "@/pages/admin/cards";
import AdminOrders from "@/pages/admin/orders";
import AdminCategories from "@/pages/admin/categories";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      {/* Auth */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />

      {/* Products */}
      <Route path="/products" component={ProductsIndex} />
      <Route path="/products/:id" component={ProductDetail} />
      
      {/* Checkout & Orders */}
      <Route path="/checkout/:orderId" component={CheckoutSuccess} />
      <Route path="/orders" component={OrdersIndex} />
      <Route path="/orders/:id" component={OrderDetail} />
      
      {/* User */}
      <Route path="/user/profile" component={UserProfile} />
      <Route path="/user/balance" component={UserBalance} />

      {/* Admin */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/cards" component={AdminCards} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/categories" component={AdminCategories} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
