import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Wallet, Shield, User } from "lucide-react";
import confetti from "canvas-confetti";

const Dashboard = () => {
  const [username, setUsername] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [showBalance, setShowBalance] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      // Fetch username
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();
      if (data) setUsername(data.username);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleCheckBalance = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      toast({ variant: "destructive", title: "Session Expired", description: "Please log in again." });
      navigate("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", session.user.id)
      .single();

    if (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not fetch balance." });
    } else {
      setBalance(data.balance);
      setShowBalance(true);

      // 🎉 Confetti!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#f0b429", "#e8a317", "#ffd166", "#ffffff"],
      });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background pattern-grid relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold font-display gold-text">Kodbank</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{username}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-16">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Shield className="h-3.5 w-3.5" />
            Secured Dashboard
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-3">
            Welcome back, <span className="gold-text">{username}</span>
          </h2>
          <p className="text-muted-foreground text-lg">Manage your finances securely</p>
        </div>

        {/* Balance Card */}
        <div className="max-w-lg mx-auto">
          <div className="glass-card p-8 text-center animate-scale-in" style={{ animationDelay: "0.2s" }}>
            <Wallet className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-medium text-foreground/80 mb-6">Account Balance</h3>

            {showBalance && balance !== null ? (
              <div className="animate-scale-in">
                <p className="text-5xl font-bold font-display gold-text mb-2">
                  ₹{balance.toLocaleString("en-IN")}
                </p>
                <p className="text-muted-foreground text-sm">Your balance is: ₹{balance.toLocaleString("en-IN")}</p>
              </div>
            ) : (
              <p className="text-muted-foreground mb-6">Click below to securely retrieve your balance</p>
            )}

            <Button
              onClick={handleCheckBalance}
              disabled={loading}
              className="mt-6 gold-gradient text-primary-foreground font-semibold h-12 px-8 text-base hover:opacity-90 transition-opacity animate-pulse-gold"
            >
              {loading ? "Verifying..." : showBalance ? "Refresh Balance" : "Check Balance"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
