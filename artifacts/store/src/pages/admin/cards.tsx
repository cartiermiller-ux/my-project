import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { 
  useListProducts, 
  useListCards,
  useCreateCards,
  useDeleteCard,
  getListCardsQueryKey,
  getListProductsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function AdminCards() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [cardContents, setCardContents] = useState("");

  const { data: products } = useListProducts({}, { query: { queryKey: getListProductsQueryKey() } });
  
  const { data: cards, isLoading: cardsLoading } = useListCards(
    { productId: selectedProductId! },
    { 
      query: { 
        queryKey: getListCardsQueryKey({ productId: selectedProductId! }),
        enabled: !!selectedProductId
      } 
    }
  );

  const createCards = useCreateCards();
  const deleteCard = useDeleteCard();

  const handleImport = () => {
    if (!selectedProductId || !cardContents.trim()) return;

    const contents = cardContents.split('\n').map(l => l.trim()).filter(Boolean);
    
    if (contents.length === 0) {
      toast({ title: "No valid cards", description: "Please enter at least one card.", variant: "destructive" });
      return;
    }

    createCards.mutate(
      { data: { productId: selectedProductId, contents } },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getListCardsQueryKey({ productId: selectedProductId }) });
          // Also invalidate products to update stock counts
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: "Success", description: `Added ${res.added} cards.` });
          setCardContents("");
        },
        onError: (err: any) => {
          toast({ title: "Import failed", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this card? If it's already sold, this might cause issues for the user.")) {
      deleteCard.mutate(
        { id },
        {
          onSuccess: () => {
            if (selectedProductId) {
              queryClient.invalidateQueries({ queryKey: getListCardsQueryKey({ productId: selectedProductId }) });
              queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
            }
            toast({ title: "Card deleted" });
          }
        }
      );
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Card Inventory</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 bg-card/50 h-fit">
            <CardHeader>
              <CardTitle>Import Cards</CardTitle>
              <CardDescription>Select a product and paste cards (one per line).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Product</label>
                <Select 
                  value={selectedProductId?.toString() || ""} 
                  onValueChange={(val) => setSelectedProductId(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name} (Stock: {p.stock})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Card Contents (Keys/Codes)</label>
                <Textarea 
                  placeholder="key-123&#10;key-456&#10;account@test.com:pass123" 
                  className="h-64 font-mono text-xs"
                  value={cardContents}
                  onChange={(e) => setCardContents(e.target.value)}
                />
              </div>

              <Button 
                className="w-full" 
                disabled={!selectedProductId || !cardContents.trim() || createCards.isPending}
                onClick={handleImport}
              >
                {createCards.isPending ? "Importing..." : "Import Cards"}
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 bg-card/50">
            <CardHeader>
              <CardTitle>Inventory List</CardTitle>
              <CardDescription>
                {selectedProductId 
                  ? "Manage individual cards for the selected product." 
                  : "Select a product on the left to view its cards."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedProductId ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                  <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                  Please select a product to view its inventory.
                </div>
              ) : cardsLoading ? (
                <div className="text-center py-12">Loading...</div>
              ) : !cards?.length ? (
                <div className="text-center py-12 text-muted-foreground">
                  No cards found for this product.
                </div>
              ) : (
                <div className="rounded-md border border-border/50">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border/50 bg-muted/50">
                      <tr>
                        <th className="p-3 text-left font-medium">ID</th>
                        <th className="p-3 text-left font-medium">Content</th>
                        <th className="p-3 text-left font-medium">Status</th>
                        <th className="p-3 text-left font-medium">Added</th>
                        <th className="p-3 text-right font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cards.map(card => (
                        <tr key={card.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="p-3 text-muted-foreground">#{card.id}</td>
                          <td className="p-3 font-mono text-xs max-w-[200px] truncate" title={card.content}>
                            {card.content}
                          </td>
                          <td className="p-3">
                            <span className={card.sold ? "text-destructive" : "text-green-500"}>
                              {card.sold ? "Sold" : "Available"}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {format(new Date(card.createdAt), "MMM d, yyyy")}
                          </td>
                          <td className="p-3 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(card.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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
      </div>
    </AdminLayout>
  );
}
