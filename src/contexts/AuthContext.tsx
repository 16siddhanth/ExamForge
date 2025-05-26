import { supabase } from '@/integrations/supabase/client';
import { createContext, useContext, useState } from 'react';

interface User {
  id: string;
  username: string;
  display_name: string;
}

interface AuthError {
  message: string;
}

interface CustomUser {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (username: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (username: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const signUp = async (username: string, password: string, displayName?: string) => {
    try {
      setLoading(true);

      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('custom_users')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        return { error: { message: 'Username already taken' } };
      }

      // Hash the password (simple hash for demo)
      const hashedPassword = await hashPassword(password);

      // Create new user
      const { data, error: insertError } = await supabase
        .from('custom_users')
        .insert([
          {
            username,
            password_hash: hashedPassword,
            display_name: displayName || username
          }
        ])
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      if (!data) {
        throw new Error('No data returned after insert');
      }

      setUser(data as User);
      return { error: null };
    } catch (error) {
      console.error('SignUp error:', error);
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'An unexpected error occurred' 
        } 
      };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('custom_users')
        .select('*')
        .eq('username', username)
        .single();

      if (fetchError) {
        return { error: { message: 'Invalid username or password' } };
      }

      if (!data) {
        return { error: { message: 'User not found' } };
      }

      const hashedPassword = await hashPassword(password);
      if (hashedPassword !== data.password_hash) {
        return { error: { message: 'Invalid username or password' } };
      }

      setUser(data as User);
      return { error: null };
    } catch (error) {
      console.error('SignIn error:', error);
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'An unexpected error occurred' 
        } 
      };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Simple hash function for demo purposes
// In production, use a proper password hashing library like bcrypt
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
