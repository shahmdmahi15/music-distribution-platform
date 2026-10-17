"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Search,
  Music,
  PlusCircle,
  Radio,
  FileText,
  Scale,
  Users,
  User,
  Smartphone,
  LayoutDashboard,
} from "lucide-react";

interface SearchItem {
  id: string;
  title: string;
  category: "Navigation" | "Catalog" | "Operations" | "Financials" | "Team" | "Account";
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SEARCH_ITEMS: SearchItem[] = [
  { id: "dash", title: "Dashboard Overview", category: "Navigation", href: "/", icon: LayoutDashboard },
  { id: "rel-all", title: "All Releases Catalog", category: "Catalog", href: "/releases", icon: Music },
  { id: "rel-new", title: "Create New Music Release", category: "Catalog", href: "/releases/new", icon: PlusCircle },
  { id: "vevo", title: "VEVO Video Channels", category: "Operations", href: "/channels", icon: Radio },
  { id: "rep", title: "Royalty Reports & Statements", category: "Financials", href: "/reports", icon: FileText },
  { id: "splits", title: "Split Contracts & Agreements", category: "Financials", href: "/contracts", icon: Scale },
  { id: "team", title: "Team & User Directory", category: "Team", href: "/users", icon: Users },
  { id: "prof", title: "User Profile & Settings", category: "Account", href: "/profile", icon: User },
  { id: "sess", title: "Active Security Sessions", category: "Account", href: "/sessions", icon: Smartphone },
];

export function WhiteLabelQuickSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Global ⌘K keyboard listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return SEARCH_ITEMS;
    const lower = query.toLowerCase().trim();
    return SEARCH_ITEMS.filter(
      (item) =>
        item.title.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower),
    );
  }, [query]);

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelect = (item: SearchItem) => {
    onOpenChange(false);
    setQuery("");
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      handleSelect(filtered[selectedIndex]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden sm:max-w-xl gap-0 border-border/80 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Quick Search</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2.5 px-4 border-b border-border/60 bg-background/50">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search catalog, channels, reports, or navigate..."
            className="h-12 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-mono font-medium text-muted-foreground bg-muted rounded border border-border">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No results found for &quot;{query}&quot;.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-foreground hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-1.5 rounded-md ${
                        isSelected ? "bg-background shadow-xs text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                    </div>
                    <span className="truncate">{item.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
