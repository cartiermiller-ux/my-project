import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { 
  useListProducts, 
  useCreateProduct, 
  useUpdateProduct, 
  useDeleteProduct, 
  useListCategories,
  getListProductsQueryKey,
  getListCategoriesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.coerce.number().min(1, "Category is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  originalPrice: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().optional().or(z.literal("").transform(() => undefined)),
  featured: z.boolean().default(false),
  region: z.string().optional().or(z.literal("").transform(() => undefined)),
});

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: products, isLoading } = useListProducts(
    { search: search || undefined },
    { query: { queryKey: getListProductsQueryKey({ search: search || undefined }) } }
  );

  const { data: categories } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      categoryId: 0,
      price: 0,
      description: "",
      featured: false,
    }
  });

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    form.reset({
      name: product.name,
      categoryId: product.categoryId,
      price: product.price,
      originalPrice: product.originalPrice,
      description: product.description,
      imageUrl: product.imageUrl,
      featured: product.featured,
      region: product.region,
    });
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    form.reset({
      name: "",
      categoryId: categories?.[0]?.id || 0,
      price: 0,
      description: "",
      featured: false,
    });
    setDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof productSchema>) => {
    if (editingId) {
      updateProduct.mutate(
        { id: editingId, data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            toast({ title: "Product updated successfully" });
            setDialogOpen(false);
          },
          onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
        }
      );
    } else {
      createProduct.mutate(
        { data: values as any },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            toast({ title: "Product created successfully" });
            setDialogOpen(false);
          },
          onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            toast({ title: "Product deleted" });
          }
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
        </div>

        <Card className="bg-card/50">
          <CardHeader>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border/50">
              <table className="w-full text-sm">
                <thead className="border-b border-border/50 bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium">Name</th>
                    <th className="p-3 text-left font-medium">Category</th>
                    <th className="p-3 text-left font-medium">Price</th>
                    <th className="p-3 text-left font-medium">Stock</th>
                    <th className="p-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : products?.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products found.</td></tr>
                  ) : (
                    products?.map((product) => (
                      <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-3 font-medium">{product.name}</td>
                        <td className="p-3 text-muted-foreground">{product.categoryName}</td>
                        <td className="p-3">¥{product.price.toFixed(2)}</td>
                        <td className="p-3">
                          <span className={product.stock === 0 ? "text-destructive font-medium" : ""}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-card">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={(val) => field.onChange(parseInt(val))} value={field.value?.toString() || ""}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((c) => (
                              <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (¥)</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="originalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Original Price (¥) (Optional)</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Image URL (Optional)</FormLabel>
                        <FormControl><Input {...field} value={field.value || ""} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Description</FormLabel>
                        <FormControl><Textarea className="h-24" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 col-span-2">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Featured Product</FormLabel>
                          <p className="text-sm text-muted-foreground">Show this product on the home page.</p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                    {editingId ? "Save Changes" : "Create Product"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
