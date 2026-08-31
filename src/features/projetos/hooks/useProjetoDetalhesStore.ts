import { useLocalStorageState } from "@/hooks/useDataStore";
import { ProjetoMilestone, ProjetoEtapa, ProjetoMembroEquipe } from "../types";
import { toast } from "sonner";

export function useProjetoDetalhesStore(projetoId: string) {
  const [allMilestones, setAllMilestones] = useLocalStorageState<ProjetoMilestone[]>(
    "focus_projetos_milestones",
    []
  );

  const [allEtapas, setAllEtapas] = useLocalStorageState<ProjetoEtapa[]>(
    "focus_projetos_etapas",
    []
  );

  const [allEquipe, setAllEquipe] = useLocalStorageState<ProjetoMembroEquipe[]>(
    "focus_projetos_equipe",
    []
  );

  // Filtrados por projetoId
  const milestones = (allMilestones || []).filter((m) => m.projetoId === projetoId);
  const etapas = (allEtapas || []).filter((e) => e.projetoId === projetoId);
  const equipe = (allEquipe || []).filter((eq) => eq.projetoId === projetoId);

  // --- MARCOS (MILESTONES) ---
  const addMilestone = (data: Omit<ProjetoMilestone, "id" | "projetoId">) => {
    const newMilestone: ProjetoMilestone = {
      id: crypto.randomUUID(),
      projetoId,
      ...data,
      criadoEm: new Date().toISOString(),
    };
    setAllMilestones((prev = []) => [newMilestone, ...prev]);
    toast.success(`Marco "${data.titulo}" cadastrado com sucesso!`);
    return newMilestone;
  };

  const updateMilestone = (id: string, partial: Partial<ProjetoMilestone>) => {
    setAllMilestones((prev = []) =>
      prev.map((m) => (m.id === id ? { ...m, ...partial } : m))
    );
    toast.success("Marco atualizado com sucesso!");
  };

  const toggleMilestone = (id: string) => {
    setAllMilestones((prev = []) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const isConcluido = m.status === "Concluído";
        return {
          ...m,
          status: isConcluido ? "Em Andamento" : "Concluído",
          dataConclusao: isConcluido ? undefined : new Date().toISOString().split("T")[0],
          percentualProgresso: isConcluido ? 50 : 100,
        };
      })
    );
    toast.success("Status do marco atualizado!");
  };

  const deleteMilestone = (id: string) => {
    setAllMilestones((prev = []) => prev.filter((m) => m.id !== id));
    toast.success("Marco removido do projeto.");
  };

  // --- CRONOGRAMA & ETAPAS ---
  const addEtapa = (data: Omit<ProjetoEtapa, "id" | "projetoId">) => {
    const newEtapa: ProjetoEtapa = {
      id: crypto.randomUUID(),
      projetoId,
      ...data,
    };
    setAllEtapas((prev = []) => [...prev, newEtapa]);
    toast.success(`Etapa "${data.nome}" adicionada ao cronograma!`);
    return newEtapa;
  };

  const updateEtapa = (id: string, partial: Partial<ProjetoEtapa>) => {
    setAllEtapas((prev = []) =>
      prev.map((e) => (e.id === id ? { ...e, ...partial } : e))
    );
    toast.success("Etapa do cronograma atualizada!");
  };

  const deleteEtapa = (id: string) => {
    setAllEtapas((prev = []) => prev.filter((e) => e.id !== id));
    toast.success("Etapa removida do cronograma.");
  };

  // --- EQUIPE & RECURSOS ---
  const addMembro = (data: Omit<ProjetoMembroEquipe, "id" | "projetoId">) => {
    const newMembro: ProjetoMembroEquipe = {
      id: crypto.randomUUID(),
      projetoId,
      ...data,
    };
    setAllEquipe((prev = []) => [...prev, newMembro]);
    toast.success(`Membro "${data.nome}" alocado na equipe do projeto!`);
    return newMembro;
  };

  const updateMembro = (id: string, partial: Partial<ProjetoMembroEquipe>) => {
    setAllEquipe((prev = []) =>
      prev.map((eq) => (eq.id === id ? { ...eq, ...partial } : eq))
    );
    toast.success("Alocação do membro atualizada!");
  };

  const deleteMembro = (id: string) => {
    setAllEquipe((prev = []) => prev.filter((eq) => eq.id !== id));
    toast.success("Membro desvinculado do projeto.");
  };

  return {
    milestones,
    etapas,
    equipe,
    addMilestone,
    updateMilestone,
    toggleMilestone,
    deleteMilestone,
    addEtapa,
    updateEtapa,
    deleteEtapa,
    addMembro,
    updateMembro,
    deleteMembro,
  };
}
