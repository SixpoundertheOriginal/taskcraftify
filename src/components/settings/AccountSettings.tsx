
import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Shield, User, X } from 'lucide-react';

export function AccountSettings() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm({
    defaultValues: {
      name: user?.user_metadata?.name || '',
      email: user?.email || '',
    }
  });
  
  const onSubmit = async (data: { name: string, email: string }) => {
    setIsLoading(true);
    try {
      await updateProfile({ name: data.name });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was an error updating your profile.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get user initial for avatar
  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span>Profile Information</span>
          </CardTitle>
          <CardDescription>
            Update your personal information and profile details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{userInitial}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.user_metadata?.name || user?.email?.split('@')[0]}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is how your name will appear in TaskCraft.
                    </FormDescription>
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
                      <Input disabled placeholder="Your email" {...field} />
                    </FormControl>
                    <FormDescription>
                      To change your email, please contact support.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isLoading}>
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription>
            Permanent account actions that cannot be undone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button variant="destructive" className="flex items-center gap-1">
              <X className="h-4 w-4" />
              Delete Account
            </Button>
            <p className="text-xs text-muted-foreground">
              This will permanently delete your account and all of your data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
