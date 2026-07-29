import { meAction } from "@/actions/auth/me.action";
import { clientGetLinkedAccountsAction } from "@/actions/client/profile/client-get-linked-accounts.action";
import { ClientNameUpdateCard } from "@/components/client/profile/client-name-update-card";
import { ClientImageUpdateCard } from "@/components/client/profile/client-image-update-card";
import { ClientPasswordUpdateCard } from "@/components/client/profile/client-password-update-card";
import { ClientLinkedAccountCard } from "@/components/client/profile/client-linked-account-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShieldAlert,
  UserCheck,
  Sparkles,
  ShieldCheck,
  Mail,
  KeyRound,
  Shield,
  User as UserIcon,
  Clock,
  Calendar,
} from "lucide-react";

function formatDate(dateValue: string | Date | undefined) {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function ClientProfilePage() {
  const res = await meAction();
  const linkedAccounts = await clientGetLinkedAccountsAction();

  if (!res.success || !res.user) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            {res.message || "Failed to load user profile. Please log in again."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const user = res.user;
  const fullName = `${user.firstName} ${user.lastName}`;
  const avatar = res.user.image;
  const avatarFallback =
    `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase();

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-primary">
          <UserCheck className="h-6 w-6" />
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Client Profile
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your account information, profile picture, and display details.
        </p>
      </div>

      <div className="space-y-6">
        {/* Server Rendered Profile View Card */}
        <Card className="overflow-hidden shadow-sm border-border/60">
          {/* Top Decorative Banner */}
          <div className="h-28 w-full bg-linear-to-r from-primary/20 via-primary/10 to-background border-b border-border/40 relative">
            <div className="absolute right-4 top-4 opacity-10">
              <Sparkles className="w-24 h-24 text-primary" />
            </div>
          </div>

          <CardHeader className="relative pt-0 pb-4 px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12 mb-2">
              <Avatar className="h-24 w-24 rounded-2xl border-4 border-background shadow-md">
                <AvatarImage src={avatar || undefined} alt={fullName} />
                <AvatarFallback className="rounded-xl text-2xl font-bold bg-primary/10 text-primary">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="px-3 py-1 text-xs font-semibold gap-1.5 border-primary/30 bg-primary/5 text-primary"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {user.role}
                </Badge>
                {user.twoFactorEnabled ? (
                  <Badge
                    variant="default"
                    className="px-3 py-1 text-xs font-semibold gap-1.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    2FA Enabled
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="px-3 py-1 text-xs font-semibold gap-1.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" />
                    2FA Disabled
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                {fullName}
              </CardTitle>
              <CardDescription className="flex items-center gap-1.5 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 text-muted-foreground/70" />
                {user.email}
              </CardDescription>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="p-6 space-y-6">
            <div>
              <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">
                Account Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* User ID */}
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-primary/70" />
                    User ID
                  </span>
                  <code className="text-xs font-mono font-semibold truncate text-foreground">
                    {user.id}
                  </code>
                </div>

                {/* Role */}
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-primary/70" />
                    Platform Role
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {user.role}
                  </span>
                </div>

                {/* First Name */}
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-primary/70" />
                    First Name
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {user.firstName || "N/A"}
                  </span>
                </div>

                {/* Last Name */}
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-primary/70" />
                    Last Name
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {user.lastName || "N/A"}
                  </span>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/40 border border-border/50 md:col-span-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary/70" />
                    Email Address
                  </span>
                  <span className="text-sm font-semibold text-foreground truncate">
                    {user.email}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">
                Activity & Security Metadata
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Last Login */}
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary/70" />
                    Last Login
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : "N/A"}
                  </span>
                </div>

                {/* Created At */}
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary/70" />
                    Account Created
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {formatDate(user.createdAt)}
                  </span>
                </div>

                {/* Updated At */}
                <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary/70" />
                    Last Profile Update
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {formatDate(user.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Update Forms Grid */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Profile Settings & Security
            </h2>
            <p className="text-xs text-muted-foreground">
              Manage your display name, profile picture, password security, and
              linked accounts.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            <ClientNameUpdateCard
              initialFirstName={user.firstName}
              initialLastName={user.lastName}
            />
            <ClientImageUpdateCard
              initialImage={avatar}
              userName={`${user.firstName} ${user.lastName}`}
            />
            <ClientPasswordUpdateCard
              isPasswordLinked={
                linkedAccounts.success
                  ? linkedAccounts.linkedAccounts?.password
                    ? true
                    : false
                  : true
              }
            />
            {linkedAccounts?.success ? (
              <ClientLinkedAccountCard
                linkedAccounts={linkedAccounts.linkedAccounts}
              />
            ) : (
              <Card className="p-4">
                <Alert variant={"destructive"}>
                  <AlertDescription>
                    {linkedAccounts?.message ||
                      "Failed to fetch linked accounts"}
                  </AlertDescription>
                </Alert>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
