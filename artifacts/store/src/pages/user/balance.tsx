import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useGetMe, useTopupBalance, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Wallet, ShieldCheck, Zap } from "lucide-react";

const PRESET_AMOUNTS = [10, 50, 100, 500];

export default function Balance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: user } = useGetMe();
  const topupMutation = useTopupBalance();
  
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const handleTopup = (amount: number) => {
    if (amount <= 0) return;
    
    topupMutation.mutate({ data: { amount } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ 
          title: "Top-up successful",
          description: `Added ¥${amount.toFixed(2)} to your balance.`
        });
        setCustomAmount("");
        setSelectedPreset(null);
      },
      onError: (err: any) => {
        toast({ 
          title: "Top-up failed", 
          description: err.message,
          variant: "destructive" 
        });
      }
    });
  };

  const onSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(customAmount);
    if (!isNaN(amount) && amount > 0) {
      handleTopup(amount);
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Wallet & Balance</h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Current Balance Card */}
          <div className="md:col-span-5">
            <Card className="bg-gradient-to-br from-primary/20 via-card to-card border-primary/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <Wallet className="w-32 h-32" />
              </div>
              <CardContent className="p-8">
                <div className="text-muted-foreground font-medium tracking-wide uppercase text-sm mb-2">
                  Available Balance
                </div>
                <div className="text-5xl font-extrabold tracking-tight text-primary mb-6">
                  ¥{user.balance.toFixed(2)}
                </div>
                
                <div className="space-y-3 pt-6 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-primary" /> 
                    Funds are secure and non-expiring
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="w-4 h-4 text-primary" /> 
                    Instant checkout for all products
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top-up Form */}
          <div className="md:col-span-7">
            <Card className="h-full bg-card/50">
              <CardHeader>
                <CardTitle>Add Funds</CardTitle>
                <CardDescription>Select an amount or enter a custom value.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {PRESET_AMOUNTS.map((amount) => (
                    <Button
                      key={amount}
                      variant={selectedPreset === amount ? "default" : "outline"}
                      className={`h-16 text-lg ${selectedPreset === amount ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                      onClick={() => {
                        setSelectedPreset(amount);
                        setCustomAmount("");
                      }}
                    >
                      ¥{amount}
                    </Button>
                  ))}
                </div>

                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm">or custom amount</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <form onSubmit={onSubmitCustom} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground font-medium">
                        ¥
                      </div>
                      <Input
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="Enter amount"
                        className="pl-8 text-lg"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setSelectedPreset(null);
                        }}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      size="lg"
                      disabled={(!customAmount && !selectedPreset) || topupMutation.isPending}
                      onClick={selectedPreset ? (e) => { e.preventDefault(); handleTopup(selectedPreset); } : undefined}
                    >
                      {topupMutation.isPending ? "Processing..." : "Pay Now"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
