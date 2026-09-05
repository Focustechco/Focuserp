import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  useNavigate,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { MobileDrawerMenu } from "@/components/mobile/MobileDrawerMenu";
import { MobileQuickActionSheet } from "@/components/mobile/MobileQuickActionSheet";
import {
  autoRegisterServiceWorker,
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  getPushUserId,
} from "@/lib/push-notifications";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";
import { ShieldAlert, ArrowLeft, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import focusLogoHq from "@/assets/focus-erp-logo-hq.png";
import focusLogoHqDark from "@/assets/focus-erp-logo-hq-dark.png";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A rota solicitada não existe ou foi remanejada.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Falha ao carregar a visualização
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro no processamento deste componente.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

// Guarda Granular de Acesso por Módulo e Permissão
function RouteAccessGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { canAccessRoute, currentUser, isSuperAdmin, logout } = useAuth();

  const isAllowed = canAccessRoute(pathname);

  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center animate-fade-in">
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 mb-4 shadow-sm">
          <ShieldAlert className="w-12 h-12 text-destructive" />
        </div>
        <Badge variant="outline" className="text-xs px-3 py-1 bg-destructive/5 text-destructive border-destructive/30 mb-2">
          Acesso Restrito
        </Badge>
        <h2 className="text-2xl font-bold text-foreground">
          Permissão Insuficiente
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mt-2">
          O seu perfil <strong>{currentUser?.perfil || 'Colaborador'}</strong> ({currentUser?.email}) não possui privilégios de visualização no módulo correspondente a <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{pathname}</code>.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Solicite ao Super Administrador a liberação na Matriz de Permissões (IAM).
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Button asChild variant="default" className="gap-2 bg-orange-600 hover:bg-orange-700 text-white">
            <Link to="/">
              <ArrowLeft className="w-4 h-4" /> Ir para o Dashboard
            </Link>
          </Button>
          <Button variant="outline" onClick={logout} className="gap-2">
            <Lock className="w-4 h-4" /> Alternar Conta
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

// Componente Principal de Roteamento com Proteção de Sessão
function ProtectedAppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { status, currentUser } = useAuth();

  const isLoginPage = pathname === '/login';

  // Redirecionamento automático baseado no estado real de autenticação
  useEffect(() => {
    if (status === 'UNAUTHENTICATED' && !isLoginPage) {
      navigate({ to: '/login' });
    } else if (status === 'AUTHENTICATED' && isLoginPage) {
      navigate({ to: '/' });
    }
  }, [status, isLoginPage, navigate]);

  // 1. Tela de Carregamento Inicial (Splash Screen Premium)
  if (status === 'INITIALIZING') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-6 animate-pulse">
          <img
            src={focusLogoHq}
            alt="Focus ERP"
            className="h-10 w-auto object-contain dark:hidden"
          />
          <img
            src={focusLogoHqDark}
            alt="Focus ERP"
            className="h-10 w-auto object-contain hidden dark:block"
          />
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
            <span>Carregando Focus ERP...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Tela de Login (Livre de Sidebar/TopBar)
  if (isLoginPage || status === 'UNAUTHENTICATED') {
    return (
      <main className="min-h-screen w-full bg-background">
        <Outlet />
      </main>
    );
  }

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileQuickActionOpen, setMobileQuickActionOpen] = useState(false);

  // 3. Aplicação ERP Autenticada Completa
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col w-full max-w-[100vw]">
          <TopBar />
          <MobileHeader onOpenMenu={() => setMobileDrawerOpen(true)} />
          <main className="flex-1 overflow-x-hidden w-full max-w-[100vw] pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            <RouteAccessGate />
          </main>
          <MobileBottomNav
            onOpenMenu={() => setMobileDrawerOpen(true)}
            onOpenQuickAction={() => setMobileQuickActionOpen(true)}
          />
          <MobileDrawerMenu
            open={mobileDrawerOpen}
            onOpenChange={setMobileDrawerOpen}
          />
          <MobileQuickActionSheet
            open={mobileQuickActionOpen}
            onOpenChange={setMobileQuickActionOpen}
          />
        </SidebarInset>
      </div>
      <Toaster position="top-right" />
    </SidebarProvider>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, shrink-to-fit=no, viewport-fit=cover" },
      { title: "Focus Finance — Gestão Financeira Corporativa" },
      {
        name: "description",
        content:
          "Focus Finance é a plataforma financeira da Focus Tecnologia: fluxo de caixa, contas a pagar e receber, cobranças, contratos, MRR e inteligência financeira.",
      },
      { name: "author", content: "Focus Tecnologia" },
      { name: "theme-color", content: "#FF6A00" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Focus ERP" },
      { name: "mobile-web-app-capable", content: "yes" },
      { property: "og:title", content: "Focus Finance — Gestão Financeira Corporativa" },
      { property: "og:description", content: "ERP financeiro premium da Focus Tecnologia." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "shortcut icon", href: "/favicon.ico" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.json" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="overflow-x-hidden antialiased select-none touch-manipulation max-w-[100vw]" suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    // Tratamento defensivo para scripts injetados de telemetria/profiler do navegador
    const handleGlobalError = (event: ErrorEvent) => {
      if (
        event?.message?.includes('startTime') || 
        event?.message?.includes('reportAllChanges')
      ) {
        event.preventDefault?.();
        event.stopImmediatePropagation?.();
      }
    };

    window.addEventListener('error', handleGlobalError);

    autoRegisterServiceWorker().catch(console.error);

    if (isPushSupported() && getNotificationPermission() === 'granted') {
      subscribeToPush(getPushUserId()).catch(console.error);
    }

    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProtectedAppLayout />
      </AuthProvider>
    </QueryClientProvider>
  );
}
