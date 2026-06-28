import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layout } from "@/components/layout/Layout";
import { useGetMe, useUpdateProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import { User as UserIcon } from "lucide-react";

const formSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
});

export default function Profile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: user } = useGetMe();
  const updateProfile = useUpdateProfile();
  const initRef = useRef(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", email: "" },
  });

  useEffect(() => {
    if (user && !initRef.current) {
      form.reset({ username: user.username, email: user.email });
      initRef.current = true;
    }
  }, [user, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateProfile.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        toast({ title: "Profile updated successfully" });
      },
      onError: (err: any) => {
        toast({ 
          title: "Update failed", 
          description: err.message,
          variant: "destructive" 
        });
      }
    });
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Account Settings</h1>

        <div className="grid gap-8">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details here.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                  <UserIcon className="w-10 h-10" />
                </div>
                <div>
                  <div className="font-semibold text-lg">{user.username}</div>
                  <div className="text-muted-foreground">{user.role}</div>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
