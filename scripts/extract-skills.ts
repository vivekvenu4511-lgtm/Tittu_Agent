import fs from "fs";
import path from "path";
import { globSync } from "glob";

interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  definition: string;
  bundle: string;
  sourcePath: string;
  enabled: boolean;
}

interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  providerConfig: string;
}

const SKILLS_ROOT = path.join(
  process.cwd(),
  "Skills",
  "antigravity-awesome-skills-main",
);
const OUTPUT_FILE = path.join(process.cwd(), "src", "skills", "registry.ts");
const PLUGINS_ROOT = path.join(SKILLS_ROOT, "plugins");

function extractFrontMatter(content: string): Record<string, string> {
  const frontMatter: Record<string, string> = {};
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (match) {
    const lines = match[1].split("\n");
    for (const line of lines) {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length) {
        frontMatter[key.trim()] = valueParts
          .join(":")
          .trim()
          .replace(/^"|"$/g, "");
      }
    }
  }
  return frontMatter;
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

function generateFunctionDefinition(
  skillName: string,
  description: string,
): string {
  const params: Record<string, { type: string; description: string }> = {};

  const commonParams = ["input", "query", "code", "context", "options"];
  const nameLower = skillName.toLowerCase();

  if (
    nameLower.includes("code") ||
    nameLower.includes("generate") ||
    nameLower.includes("create")
  ) {
    params.code = {
      type: "string",
      description: "Code to process or generate",
    };
  } else if (
    nameLower.includes("audit") ||
    nameLower.includes("check") ||
    nameLower.includes("analyze")
  ) {
    params.target = { type: "string", description: "Target to analyze" };
  } else {
    params.input = { type: "string", description: "Input to process" };
  }

  params.options = {
    type: "object",
    description: "Additional options",
    optional: true,
  };

  return JSON.stringify(
    {
      name: skillName.replace(/\s+/g, "_").toLowerCase(),
      description: description.slice(0, 200),
      parameters: {
        type: "object",
        properties: params,
        required: Object.keys(params).filter((k) => !params[k].optional),
      },
    },
    null,
    2,
  );
}

function extractSkills(): SkillDefinition[] {
  const skills: SkillDefinition[] = [];

  const skillDirs = globSync("*", { cwd: SKILLS_ROOT, onlyDirectories: true });

  for (const dir of skillDirs) {
    if (dir === "plugins" || dir === "docs" || dir === ".github") continue;

    const skillPath = path.join(SKILLS_ROOT, dir, "SKILL.md");
    if (!fs.existsSync(skillPath)) continue;

    const content = fs.readFileSync(skillPath, "utf-8");
    const frontMatter = extractFrontMatter(content);

    const name = frontMatter.name || toPascalCase(dir.replace(/-/g, " "));
    const description = frontMatter.description || "Skill for " + name;

    const definition = generateFunctionDefinition(name, description);

    skills.push({
      id: name.toLowerCase().replace(/\s+/g, "_"),
      name,
      description,
      definition,
      bundle: dir,
      sourcePath: skillPath,
      enabled: true,
    });
  }

  if (fs.existsSync(PLUGINS_ROOT)) {
    const pluginBundles = globSync("*", {
      cwd: PLUGINS_ROOT,
      onlyDirectories: true,
    });

    for (const bundle of pluginBundles) {
      const bundlePath = path.join(PLUGINS_ROOT, bundle, "skills");
      if (!fs.existsSync(bundlePath)) continue;

      const skillFiles = globSync("*/SKILL.md", { cwd: bundlePath });

      for (const skillFile of skillFiles) {
        const skillDir = path.dirname(skillFile);
        const filePath = path.join(bundlePath, skillFile);

        const content = fs.readFileSync(filePath, "utf-8");
        const frontMatter = extractFrontMatter(content);

        const name =
          frontMatter.name || toPascalCase(skillDir.replace(/-/g, " "));
        const description = frontMatter.description || "Skill for " + name;

        const definition = generateFunctionDefinition(name, description);

        skills.push({
          id: name.toLowerCase().replace(/\s+/g, "_"),
          name,
          description,
          definition,
          bundle: bundle,
          sourcePath: filePath,
          enabled: true,
        });
      }
    }
  }

  return skills;
}

function extractAgents(): AgentDefinition[] {
  const agents: AgentDefinition[] = [];

  const agentFiles = globSync("**/AGENTS.md", { cwd: SKILLS_ROOT });

  for (const agentFile of agentFiles) {
    const content = fs.readFileSync(path.join(SKILLS_ROOT, agentFile), "utf-8");
    const lines = content.split("\n");

    let currentName = "";
    let currentRole = "";
    let currentPrompt = "";
    let inAgentBlock = false;

    for (const line of lines) {
      const headingMatch = line.match(/^##\s+\d+\.?\s+(.+)/);
      if (headingMatch) {
        if (currentName) {
          agents.push({
            id: currentName.toLowerCase().replace(/\s+/g, "_"),
            name: currentName,
            role: currentRole,
            systemPrompt: currentPrompt.trim(),
            providerConfig: "openrouter",
          });
        }
        currentName = headingMatch[1].trim();
        currentRole = currentName;
        currentPrompt = "";
        inAgentBlock = true;
      } else if (inAgentBlock && line.startsWith("**") && line.endsWith("**")) {
        const contentMatch = line.match(/\*\*(.+?)\*\*/);
        if (contentMatch) {
          currentPrompt += contentMatch[1] + " ";
        }
      }
    }

    if (currentName) {
      agents.push({
        id: currentName.toLowerCase().replace(/\s+/g, "_"),
        name: currentName,
        role: currentRole,
        systemPrompt:
          currentPrompt.trim() || `You are an expert ${currentRole}.`,
        providerConfig: "openrouter",
      });
    }
  }

  return agents;
}

function main() {
  console.log(
    "Extracting skills and agents from Antigravity Awesome Skills...",
  );

  const skills = extractSkills();
  const agents = extractAgents();

  console.log(`Found ${skills.length} skills and ${agents.length} agents`);

  const output = `// Auto-generated - DO NOT EDIT
// Run 'npm run extract-skills' to regenerate

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  definition: string;
  bundle: string;
  sourcePath: string;
  enabled: boolean;
}

export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  providerConfig: string;
}

export const skillRegistry: SkillDefinition[] = ${JSON.stringify(skills, null, 2)};

export const agentRegistry: AgentDefinition[] = ${JSON.stringify(agents, null, 2)};

export function getEnabledSkills(): SkillDefinition[] {
  return skillRegistry.filter(s => s.enabled);
}

export function getSkillById(id: string): SkillDefinition | undefined {
  return skillRegistry.find(s => s.id === id);
}

export function getAgentById(id: string): AgentDefinition | undefined {
  return agents.find(a => a.id === id);
}
`;

  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, output);
  console.log(`Registry written to ${OUTPUT_FILE}`);
}

main();
