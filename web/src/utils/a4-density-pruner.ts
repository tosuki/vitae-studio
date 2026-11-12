import { CVData, TargetedCuration } from "../types/cv.model";

/**
 * Calibração Física Real A4 (96 DPI):
 * - Folha A4: 210mm (793.7px) x 297mm (1122.5px).
 * - Margens reais de impressão (@page): 12mm topo/base (90.7px) e 14mm laterais (105.8px).
 * - Largura útil de texto: 182mm (688px -> ~74 chars/linha).
 * - Teto seguro com margem anti-quebra de página órfã: 1100px.
 */
export const A4_MAX_HEIGHT_PX = 1100;

export interface DensityBreakdown {
  padding: number;
  header: number;
  objective: number;
  experience: number;
  education: number;
  projects: number;
  certificates: number;
  skillsLanguages: number;
  sectionGaps: number;
  totalHeight: number;
}

export interface PruneResult {
  curation: TargetedCuration;
  estimatedHeight: number;
  prunedLevelsApplied: number[];
  spacing: "normal" | "compact";
}

/**
 * Calcula com precisão física a altura estimada (px) no DOM e na impressão A4 (@page 12mm 14mm).
 */
export function estimateCVHeight(
  cv: CVData,
  curation: TargetedCuration,
  spacing: "normal" | "compact" = "normal"
): DensityBreakdown {
  const mult = spacing === "compact" ? 0.72 : 1.0;
  const isAtsTheme = cv.style?.theme === "ats";
  const padding = 91;

  const activeTitle = curation.tailoredTitle || cv.personal.title;
  const header = 36 + (activeTitle ? 22 : 0) + 26 + Math.round(14 * mult);

  const objectiveText = (curation.tailoredObjective || cv.objective || "").trim();
  let objective = 0;
  if (objectiveText) {
    const lines = Math.max(1, Math.ceil(objectiveText.length / 74));
    const linePx = spacing === "compact" ? 18.2 : 19.8;
    objective = 32 + Math.round(lines * linePx);
  }

  const activeExps = cv.experience.filter(e => curation.experience[e.id]?.included);
  let experience = 0;
  if (activeExps.length > 0) {
    experience += 32;
    activeExps.forEach((exp, idx) => {
      const expCur = curation.experience[exp.id];
      const desc = (expCur?.tailoredDescription || exp.description || "").trim();
      const bullets = desc.split("\n").filter(b => b.trim().length > 0);

      let itemHeight = 24;
      const linePx = spacing === "compact" ? 17.5 : 18.8;
      bullets.forEach(bullet => {
        const cleanBullet = bullet.replace(/^[•\-\*]\s*/, "");
        const bulletLines = Math.max(1, Math.ceil(cleanBullet.length / 72));
        itemHeight += Math.round(bulletLines * linePx) + Math.round(4 * mult);
      });

      experience += itemHeight;
      if (idx < activeExps.length - 1) {
        experience += Math.round(12 * mult);
      }
    });
  }

  const activeEdus = cv.education.filter(e => curation.education[e.id]?.included);
  let education = 0;
  if (activeEdus.length > 0) {
    education += 32;
    activeEdus.forEach((edu, idx) => {
      const extraDescLines = edu.description?.trim() ? Math.ceil(edu.description.length / 74) : 0;
      education += 34 + extraDescLines * 17;
      if (idx < activeEdus.length - 1) education += Math.round(8 * mult);
    });
  }

  const activeProjs = (cv.projects || []).filter(p => curation.projects?.[p.id]?.included);
  let projects = 0;
  if (activeProjs.length > 0) {
    projects += 32;
    const linePx = spacing === "compact" ? 17.5 : 18.5;
    activeProjs.forEach((proj, idx) => {
      const projCur = curation.projects[proj.id];
      const desc = (projCur?.tailoredDescription || proj.description || "").trim();
      const lines = Math.max(1, Math.ceil(desc.length / 74));
      projects += 22 + Math.round(lines * linePx);
      if (idx < activeProjs.length - 1) projects += Math.round(8 * mult);
    });
  }

  const activeCerts = cv.certificates.filter(c => curation.certificates[c.id]?.included);
  let certificates = 0;
  if (activeCerts.length > 0) {
    certificates += 32;
    if (isAtsTheme) {
      certificates += activeCerts.length * 22;
    } else {
      const rows = Math.ceil(activeCerts.length / 2);
      certificates += rows * 24;
    }
  }

  let skillsLanguages = 0;
  const skillsCount = (curation.selectedSkills || cv.skills || []).length;
  const langsCount = (cv.languages || []).length;
  if (skillsCount > 0 || langsCount > 0) {
    const skillLines = skillsCount > 0 ? Math.ceil(skillsCount / 4.2) : 0;
    const skillsHeight = skillsCount > 0 ? 32 + skillLines * 26 : 0;
    const langsHeight = langsCount > 0 ? 32 + langsCount * 22 : 0;

    if (isAtsTheme) {
      skillsLanguages = skillsHeight + langsHeight + (skillsHeight > 0 && langsHeight > 0 ? Math.round(12 * mult) : 0);
    } else {
      skillsLanguages = Math.max(skillsHeight, langsHeight);
    }
  }

  let visibleSections = 1;
  if (objective > 0) visibleSections++;
  if (experience > 0) visibleSections++;
  if (education > 0) visibleSections++;
  if (projects > 0) visibleSections++;
  if (certificates > 0) visibleSections++;
  if (skillsLanguages > 0) visibleSections++;

  const sectionGaps = Math.max(0, (visibleSections - 1) * Math.round(15 * mult));

  const totalHeight =
    padding +
    header +
    objective +
    experience +
    education +
    projects +
    certificates +
    skillsLanguages +
    sectionGaps;

  return {
    padding,
    header,
    objective,
    experience,
    education,
    projects,
    certificates,
    skillsLanguages,
    sectionGaps,
    totalHeight
  };
}

/**
 * Fila progressiva em 4 passos para garantir encaixe físico rigoroso em 1 folha A4.
 */
export function pruneCurationToFitA4(
  cv: CVData,
  initialCuration: TargetedCuration
): PruneResult {
  const curation: TargetedCuration = {
    ...initialCuration,
    experience: Object.fromEntries(
      Object.entries(initialCuration.experience).map(([k, v]) => [k, { ...v }])
    ),
    projects: Object.fromEntries(
      Object.entries(initialCuration.projects || {}).map(([k, v]) => [k, { ...v }])
    ),
    education: Object.fromEntries(
      Object.entries(initialCuration.education).map(([k, v]) => [k, { ...v }])
    ),
    certificates: Object.fromEntries(
      Object.entries(initialCuration.certificates).map(([k, v]) => [k, { ...v }])
    ),
    selectedSkills: [...(initialCuration.selectedSkills || [])]
  };

  const prunedLevelsApplied: number[] = [];
  let spacing: "normal" | "compact" = cv.style?.spacing === "compact" ? "compact" : "normal";

  const activeExpList = cv.experience.filter(exp => curation.experience[exp.id]?.included);
  if (activeExpList.length > 3) {
    const sortedExps = [...activeExpList].sort((a, b) => {
      const scoreA = curation.experience[a.id].relevanceScore ?? 50;
      const scoreB = curation.experience[b.id].relevanceScore ?? 50;
      return scoreB - scoreA;
    });
    sortedExps.slice(3).forEach(exp => {
      curation.experience[exp.id].included = false;
    });
  }

  const remainingInitExps = cv.experience.filter(exp => curation.experience[exp.id]?.included);
  remainingInitExps.forEach((exp, idx) => {
    const maxBullets = idx === 0 ? 3 : 2;
    const expCur = curation.experience[exp.id];
    const desc = (expCur.tailoredDescription || exp.description || "").trim();
    const bullets = desc.split("\n").filter(b => b.trim().length > 0);
    if (bullets.length > maxBullets) {
      expCur.tailoredDescription = bullets.slice(0, maxBullets).join("\n");
    }
  });

  const initialProjIds = Object.keys(curation.projects).filter(id => curation.projects[id].included);
  if (initialProjIds.length > 2) {
    const sortedProjs = [...initialProjIds].sort((a, b) => {
      const scoreA = curation.projects[a].relevanceScore ?? 50;
      const scoreB = curation.projects[b].relevanceScore ?? 50;
      return scoreB - scoreA;
    });
    sortedProjs.slice(2).forEach(id => {
      curation.projects[id].included = false;
    });
  }

  let density = estimateCVHeight(cv, curation, spacing);
  if (density.totalHeight <= A4_MAX_HEIGHT_PX) {
    return { curation, estimatedHeight: density.totalHeight, prunedLevelsApplied, spacing };
  }

  // Passo 1: Limitar skills + remover certificações complementares
  let step1Triggered = false;
  if (curation.selectedSkills.length > 10) {
    curation.selectedSkills = curation.selectedSkills.slice(0, 10);
    step1Triggered = true;
  }

  const activeCertIds = Object.keys(curation.certificates).filter(id => curation.certificates[id].included);
  if (activeCertIds.length > 0) {
    activeCertIds.forEach(id => {
      curation.certificates[id].included = false;
    });
    step1Triggered = true;
  }

  if (step1Triggered) {
    prunedLevelsApplied.push(1);
    density = estimateCVHeight(cv, curation, spacing);
    if (density.totalHeight <= A4_MAX_HEIGHT_PX) {
      return { curation, estimatedHeight: density.totalHeight, prunedLevelsApplied, spacing };
    }
  }

  // Passo 2: Remover projeto menos relevante
  const activeProjIds = Object.keys(curation.projects).filter(id => curation.projects[id].included);
  if (activeProjIds.length > 1) {
    prunedLevelsApplied.push(2);
    const sortedProjs = [...activeProjIds].sort((a, b) => {
      const scoreA = curation.projects[a].relevanceScore ?? 50;
      const scoreB = curation.projects[b].relevanceScore ?? 50;
      return scoreA - scoreB;
    });
    curation.projects[sortedProjs[0]].included = false;

    density = estimateCVHeight(cv, curation, spacing);
    if (density.totalHeight <= A4_MAX_HEIGHT_PX) {
      return { curation, estimatedHeight: density.totalHeight, prunedLevelsApplied, spacing };
    }
  }

  const expsForPruning = cv.experience.filter(exp => curation.experience[exp.id]?.included);
  if (expsForPruning.length > 2) {
    if (!prunedLevelsApplied.includes(3)) prunedLevelsApplied.push(3);
    const sortedExps = [...expsForPruning].sort((a, b) => {
      const scoreA = curation.experience[a.id].relevanceScore ?? 50;
      const scoreB = curation.experience[b.id].relevanceScore ?? 50;
      return scoreA - scoreB;
    });
    curation.experience[sortedExps[0].id].included = false;

    density = estimateCVHeight(cv, curation, spacing);
    if (density.totalHeight <= A4_MAX_HEIGHT_PX) {
      return { curation, estimatedHeight: density.totalHeight, prunedLevelsApplied, spacing };
    }
  }

  // Passo 3: Reduzir bullets das secundárias (2 -> 1) e principal (3 -> 2)
  const expsStep3 = cv.experience.filter(exp => curation.experience[exp.id]?.included);
  if (expsStep3.length > 0) {
    if (!prunedLevelsApplied.includes(3)) prunedLevelsApplied.push(3);

    expsStep3.slice(1).forEach(exp => {
      const expCur = curation.experience[exp.id];
      const desc = (expCur.tailoredDescription || exp.description || "").trim();
      const bullets = desc.split("\n").filter(b => b.trim().length > 0);
      if (bullets.length > 1) {
        expCur.tailoredDescription = bullets.slice(0, 1).join("\n");
      }
    });

    density = estimateCVHeight(cv, curation, spacing);
    if (density.totalHeight <= A4_MAX_HEIGHT_PX) {
      return { curation, estimatedHeight: density.totalHeight, prunedLevelsApplied, spacing };
    }

    const primaryExp = expsStep3[0];
    const primaryCur = curation.experience[primaryExp.id];
    const primaryDesc = (primaryCur.tailoredDescription || primaryExp.description || "").trim();
    const primaryBullets = primaryDesc.split("\n").filter(b => b.trim().length > 0);
    if (primaryBullets.length > 2) {
      primaryCur.tailoredDescription = primaryBullets.slice(0, 2).join("\n");
    }

    density = estimateCVHeight(cv, curation, spacing);
    if (density.totalHeight <= A4_MAX_HEIGHT_PX) {
      return { curation, estimatedHeight: density.totalHeight, prunedLevelsApplied, spacing };
    }
  }

  // Passo 4: Compactação segura
  if (spacing !== "compact") {
    spacing = "compact";
    prunedLevelsApplied.push(4);
    density = estimateCVHeight(cv, curation, spacing);
    if (density.totalHeight <= A4_MAX_HEIGHT_PX) {
      return { curation, estimatedHeight: density.totalHeight, prunedLevelsApplied, spacing };
    }
  }

  const finalProjIds = Object.keys(curation.projects).filter(id => curation.projects[id].included);
  if (finalProjIds.length > 0 && density.totalHeight > A4_MAX_HEIGHT_PX) {
    finalProjIds.forEach(id => {
      curation.projects[id].included = false;
    });
    if (!prunedLevelsApplied.includes(2)) prunedLevelsApplied.push(2);
    density = estimateCVHeight(cv, curation, spacing);
  }

  if (curation.selectedSkills.length > 8 && density.totalHeight > A4_MAX_HEIGHT_PX) {
    curation.selectedSkills = curation.selectedSkills.slice(0, 8);
    density = estimateCVHeight(cv, curation, spacing);
  }

  return {
    curation,
    estimatedHeight: density.totalHeight,
    prunedLevelsApplied,
    spacing
  };
}
