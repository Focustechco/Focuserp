import { createFileRoute } from "@tanstack/react-router";
import { DesenvolvimentoScreen } from "@/features/desenvolvimento/components/DesenvolvimentoScreen";
import { MobileDesenvolvimentoView } from "@/features/desenvolvimento/components/MobileDesenvolvimentoView";

export const Route = createFileRoute("/desenvolvimento")({
  component: DesenvolvimentoPage,
});

function DesenvolvimentoPage() {
  return (
    <>
      {/* Visualização Mobile Otimizada */}
      <div className="md:hidden">
        <MobileDesenvolvimentoView />
      </div>

      {/* Visualização Desktop */}
      <div className="hidden md:block">
        <DesenvolvimentoScreen />
      </div>
    </>
  );
}
