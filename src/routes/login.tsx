import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/features/auth/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import focusLogoHq from '@/assets/focus-erp-logo-hq.png';
import focusLogoHqDark from '@/assets/focus-erp-logo-hq-dark.png';
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
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F8FAFC] dark:bg-[#090D16] selection:bg-orange-500 selection:text-white relative overflow-hidden transition-colors duration-200">
      
      {/* Luz ambiente de fundo sutil */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-orange-500/10 via-orange-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 sm:py-8 flex items-center justify-end z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">Ambiente Corporativo Seguro</span>
        </div>
      </header>

      {/* Card Central de Login */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:px-6 z-10">
        <div className="w-full max-w-[420px] animate-fade-in">
          
          <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900/95 backdrop-blur-md rounded-2xl overflow-hidden">
            {/* Linha de acento superior laranja Focus */}
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500" />

            <CardHeader className="space-y-0 text-center pt-8 pb-5 px-6 sm:px-8">
              {/* Logo Oficial Centralizada com Tamanho Reduzido Perfeito */}
              <div className="flex items-center justify-center mb-5">
                <img
                  src={focusLogoHq}
                  alt="Focus ERP"
                  className="h-8 sm:h-9 w-auto object-contain dark:hidden transition-transform duration-200 hover:scale-105"
                />
                <img
                  src={focusLogoHqDark}
                  alt="Focus ERP"
                  className="h-8 sm:h-9 w-auto object-contain hidden dark:block transition-transform duration-200 hover:scale-105"
                />
              </div>

              {/* Título e Subtítulo com Hierarquia Visual Perfeita */}
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Acesse sua Conta
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-normal">
                Gestão inteligente para sua empresa
              </p>
            </CardHeader>

            <CardContent className="space-y-4 px-6 sm:px-8 pb-6 pt-0">
              {/* Alerta de Erro */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-medium leading-relaxed">{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo: E-mail */}
                <div className="space-y-1.5 text-left">
                  <Label htmlFor="login-email" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    E-mail Corporativo
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu.email@focustecnologia.com.br"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="pl-10 h-11 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                      autoComplete="username"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                {/* Campo: Senha */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Senha de Acesso
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setForgotModalOpen(true);
                      }}
                      className="text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 hover:underline transition-colors"
                      tabIndex={-1}
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={senha}
                      onChange={(e) => {
                        setSenha(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="pl-10 pr-10 h-11 text-xs sm:text-sm bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                      autoComplete="current-password"
                      disabled={isSubmitting}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
                  className="w-full h-11 text-sm font-semibold bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-lg shadow-md shadow-orange-600/20 hover:shadow-lg hover:shadow-orange-600/30 transition-all duration-200 flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Entrando no Focus ERP...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar no Focus ERP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="px-6 sm:px-8 py-4 bg-slate-50/80 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center text-center">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Focus ERP — powered by <strong className="text-slate-700 dark:text-slate-300 font-semibold">Focus Tecnologia®</strong>
              </span>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Footer Inferior da Página */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 text-center text-xs text-slate-400 dark:text-slate-500 font-medium z-10">
        © {new Date().getFullYear()} Focus Tecnologia. Todos os direitos reservados.
      </footer>

      {/* Modal: Esqueci Minha Senha */}
      <Dialog open={forgotModalOpen} onOpenChange={setForgotModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Lock className="w-4 h-4 text-orange-600" />
              Recuperação de Acesso
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
              Informe seu e-mail institucional para receber as instruções de redefinição de senha.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetPassword} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-200">E-mail Cadastrado</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  placeholder="seu.email@focustecnologia.com.br"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-10 text-xs sm:text-sm h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg"
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
                className="text-xs rounded-lg"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isResetting}
                className="text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-lg gap-1.5"
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
