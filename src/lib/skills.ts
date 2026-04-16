import { invoke } from "@tauri-apps/api/core";

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string | null;
  allowed_tools: string[];
  content: string;
}

export interface SkillManifest {
  skills: Skill[];
  categories: string[];
}

export async function loadSkills(): Promise<SkillManifest> {
  return invoke<SkillManifest>("load_skills");
}

export async function getSkillPrompt(skillId: string): Promise<string> {
  return invoke<string>("get_skill_prompt", { skillId });
}

export async function listSkillIds(): Promise<string[]> {
  return invoke<string[]>("list_skill_ids");
}

export function formatSkillsForContext(manifest: SkillManifest): string {
  if (manifest.skills.length === 0) {
    return "No skills loaded.";
  }

  const header = `# Available Skills (${manifest.skills.length} skills, ${manifest.categories.length} categories)

Categories: ${manifest.categories.join(", ")}

`;

  const skillList = manifest.skills
    .slice(0, 20)
    .map((s) => `- **${s.id}**: ${s.name} — ${s.description}`)
    .join("\n");

  return header + skillList;
}
