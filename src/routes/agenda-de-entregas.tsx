import { createFileRoute } from "@tanstack/react-router";
import { AgendaProjetosScreen } from "@/features/projetos/agenda/AgendaProjetosScreen";
import { MobileAgendaEntregasView } from "@/features/projetos/agenda/MobileAgendaEntregasView";

export const Route = createFileRoute("/agenda-de-entregas")({
  component: AgendaDeEntregasPage,
});

function AgendaDeEntregasPage() {
  return (
    <>
      {/* Visualização Mobile Otimizada */}
      <div className="md:hidden">
        <MobileAgendaEntregasView />
      </div>

      {/* Visualização Desktop */}
      <div className="hidden md:flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 max-w-7xl mx-auto w-full">
        <AgendaProjetosScreen />
      </div>
    </>
  );
}
