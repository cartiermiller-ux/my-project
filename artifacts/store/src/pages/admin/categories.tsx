import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { 
  useListCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory, 
  getListCategoriesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  icon: z.string().min(1, "Icon is required"),
  description: z.string().optional(),
  sortOrder: z.coerce.number().default(0),
});

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: categories, isLoading } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "", icon: "", description: "", sortOrder: 0 }
  });

  const handleEdit = (category: any) => {
    setEditingId(category.id);
    form.reset({
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      description: category.description || "",
      sortOrder: category.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    form.reset({ name: "", slug: "", icon: "", description: "", sortOrder: 0 });
    setDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof categorySchema>) => {
    if (editingId) {
      updateCategory.mutate(
        { id: editingId, data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
            toast({ title: "Category updated" });
            setDialogOpen(false);
          },
          onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
        }
      );
    } else {
      createCategory.mutate(
        { data: values },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
            toast({ title: "Category created" });
            setDialogOpen(false);
          },
          onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete category? This might fail if products exist in it.")) {
      deleteCategory.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
            toast({ title: "Category deleted" });
          },
          onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" /> Add Category</Button>
        </div>

        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="rounded-md border border-border/50">
              <table className="w-full text-sm">
                <thead className="border-b border-border/50 bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium">Icon</th>
                    <th className="p-3 text-left font-medium">Name</th>
                    <th className="p-3 text-left font-medium">Slug</th>
                    <th className="p-3 text-left font-medium">Order</th>
                    <th className="p-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                  ) : !categories?.length ? (
                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No categories.</td></tr>
                  ) : (
                    categories.sort((a, b) => a.sortOrder - b.sortOrder).map((category) => (
                      <tr key={category.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-3 text-xl">{category.icon}</td>
                        <td className="p-3 font-medium">{category.name}</td>
                        <td className="p-3 text-muted-foreground">{category.slug}</td>
                        <td className="p-3">{category.sortOrder}</td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
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
          <DialogContent className="sm:max-w-[425px] bg-card">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Category" : "Add Category"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon (Emoji or SVG)</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                    {editingId ? "Save Changes" : "Create Category"}
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
