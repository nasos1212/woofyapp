import * as React from "react";
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, accountType?: string) => Promise<{ error: Error | null; data: { user: User | null } | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Increment login_count on sign in
        if (event === 'SIGNED_IN' && session?.user) {
          supabase
            .from('profiles')
            .select('login_count')
            .eq('user_id', session.user.id)
            .single()
            .then(({ data }) => {
              const currentCount = data?.login_count ?? 0;
              supabase
                .from('profiles')
                .update({ login_count: currentCount + 1 })
                .eq('user_id', session.user.id)
                .then(() => {});
            });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, accountType?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          account_type: accountType || "member",
        },
      },
    });
    
    return { error, data: data ? { user: data.user } : null };
  };

  const signIn = async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.user) {
      // Check if email is verified
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email_verified")
        .eq("user_id", data.user.id)
        .maybeSingle();
      
      if (!profile) {
        // Create profile if it doesn't exist
        await supabase.from("profiles").insert({
          user_id: data.user.id,
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || "",
        });
        // New profile = unverified, sign out
        await supabase.auth.signOut({ scope: 'local' });
        return { error: new Error("Please verify your email before signing in. Check your inbox for the verification link.") };
      }
      
      if (!profile.email_verified) {
        // Sign out the unverified user
        await supabase.auth.signOut({ scope: 'local' });
        return { error: new Error("Please verify your email before signing in. Check your inbox for the verification link.") };
      }
    }
    
    return { error };
  };

  const signOut = async () => {
    console.log("signOut called");
    try {
      // Try to sign out from Supabase (may fail if session already expired)
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.warn("Sign out error:", err);
    }
    
    // Always clear local state regardless of API result
    setUser(null);
    setSession(null);
    
    // Clear any cached auth data from localStorage
    const storageKey = `sb-qvdrwfltbqhlwkqndpdp-auth-token`;
    localStorage.removeItem(storageKey);
    
    // Force navigation to home
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
