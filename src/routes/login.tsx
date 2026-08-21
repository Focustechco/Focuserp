import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/features/auth/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import focusLogoHorizontal from '@/assets/focus-logo-horizontal.png';
import focusLogoHorizontalDark from '@/assets/focus-logo-horizontal-dark.png';
import { toast } from 'sonner';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const { login, status, currentUser, requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Esqueci minha senha Modal State
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Se já estiver autenticado, redireciona imediatamente para o ERP
  useEffect(() => {
    if (status === 'AUTHENTICATED' && currentUser) {
      navigate({ to: '/' });
    }
  }, [status, currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail corporativo.');
      return;
    }

    if (!senha.trim()) {
      setErrorMessage('Por favor, digite sua senha de acesso.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(email, senha);
      if (result.success) {
        navigate({ to: '/' });
      } else {
        setErrorMessage(result.error || 'Usuário ou senha inválidos.');
      }
    } catch {
      setErrorMessage('Falha ao conectar com o serviço de autenticação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error('Informe o e-mail para recuperação.');
      return;
    }

    setIsResetting(true);
    try {
      const res = await requestPasswordReset(resetEmail);
      toast.success(res.message);
      setForgotModalOpen(false);
      setResetEmail('');
    } catch {
      toast.error('Não foi possível processar a recuperação de senha.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-br from-slate-50 via-white to-orange-50/30 dark:from-slate-950 dark:via-background dark:to-orange-950/10 transition-colors">
      
      {/* Top Header Decorativo */}
      <header className="w-full max-w-7xl mx-auto p-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={focusLogoHorizontal}
            alt="Focus ERP"
            className="h-7 w-auto object-contain dark:hidden"
          />
          <img
            src={focusLogoHorizontalDark}
            alt="Focus ERP"
            className="h-7 w-auto object-contain hidden dark:block"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="hidden sm:inline font-medium">Ambiente Corporativo Seguro</span>
        </div>
      </header>

      {/* Card Central de Login */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md animate-fade-in">
          
          <Card className="border-border/60 shadow-xl bg-card/95 backdrop-blur-sm relative overflow-hidden">
            {/* Barra de destaque superior laranja Focus */}
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500" />

            <CardHeader className="space-y-2 text-center pt-8 pb-4">
              <div className="mx-auto flex items-center justify-center mb-1">
                <img
                  src={focusLogoHorizontal}
                  alt="Focus ERP"
                  className="h-8 w-auto object-contain dark:hidden"
                />
                <img
                  src={focusLogoHorizontalDark}
                  alt="Focus ERP"
                  className="h-8 w-auto object-contain hidden dark:block"
                />
              </div>

              <CardTitle className="text-xl font-bold text-foreground tracking-tight">
                Acesse sua Conta
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Gestão inteligente para sua empresa
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 px-6 sm:px-8">
              {/* Alerta Elegante de Erro */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo: E-mail */}
                <div className="space-y-1.5">
                  <Label htmlFor="login-email" className="text-xs font-semibold text-foreground">
                    E-mail Corporativo
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu.email@focustecnologia.com.br"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="pl-9 text-xs h-10 bg-background"
                      autoComplete="username"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                {/* Campo: Senha */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-xs font-semibold text-foreground">
                      Senha de Acesso
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setForgotModalOpen(true);
                      }}
                      className="text-[11px] font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 hover:underline"
                      tabIndex={-1}
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={senha}
                      onChange={(e) => {
                        setSenha(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="pl-9 pr-10 text-xs h-10 bg-background font-mono"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                      title={showPassword ? 'Ocultar Senha' : 'Exibir Senha'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Botão de Entrar */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200 gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Entrando no Focus ERP...
                    </>
                  ) : (
                    <>
                      Entrar no Focus ERP
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="px-6 sm:px-8 py-4 bg-muted/20 border-t border-border/40 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] text-muted-foreground">
                Focus ERP — powered by <strong>Focus Tecnologia®</strong>
              </span>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Footer Inferior */}
      <footer className="w-full max-w-7xl mx-auto p-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Focus Tecnologia. Todos os direitos reservados.
      </footer>

      {/* Modal: Esqueci Minha Senha */}
      <Dialog open={forgotModalOpen} onOpenChange={setForgotModalOpen}>
        <DialogContent className="sm:max-w-md bg-background border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-600" />
              Recuperação de Acesso
            </DialogTitle>
            <DialogDescription className="text-xs">
              Informe seu e-mail institucional para receber as instruções de redefinição de senha.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">E-mail Cadastrado</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="seu.email@focustecnologia.com.br"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-9 text-xs h-9 bg-background"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setForgotModalOpen(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isResetting}
                className="text-xs bg-orange-600 hover:bg-orange-700 text-white gap-1.5"
              >
                {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Enviar Instruções
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
