import { useState, useEffect } from "react";
import * as Switch from "@radix-ui/react-switch";
import {
  Search,
  Download,
  Upload,
  Plus,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";

interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  definition: string;
  bundle: string;
  sourcePath: string;
  enabled: boolean;
}

interface SkillsManagerProps {
  skills?: SkillDefinition[];
}

export default SkillsManager;

export function SkillsManager({ skills = [] }: SkillsManagerPropsProps) {
  const [enabledSkills, setEnabledSkills] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(
    new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("enabledSkills");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setEnabledSkills(new Set(parsed));
      } catch {
        setEnabledSkills(new Set(skills.map((s) => s.id)));
      }
    } else {
      setEnabledSkills(new Set(skills.map((s) => s.id)));
    }
    setIsLoading(false);
  }, [skills]);

  const filteredSkills = searchQuery
    ? skills.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : skills;

  const groupedSkills = filteredSkills.reduce(
    (acc, skill) => {
      const bundle = skill.bundle;
      if (!acc[bundle]) {
        acc[bundle] = [];
      }
      acc[bundle].push(skill);
      return acc;
    },
    {} as Record<string, SkillDefinition[]>,
  );

  const toggleSkill = (skillId: string) => {
    const newEnabled = new Set(enabledSkills);
    if (newEnabled.has(skillId)) {
      newEnabled.delete(skillId);
    } else {
      newEnabled.add(skillId);
    }
    setEnabledSkills(newEnabled);
    localStorage.setItem("enabledSkills", JSON.stringify([...newEnabled]));
  };

  const toggleBundle = (bundle: string) => {
    const newExpanded = new Set(expandedBundles);
    if (newExpanded.has(bundle)) {
      newExpanded.delete(bundle);
    } else {
      newExpanded.add(bundle);
    }
    setExpandedBundles(newExpanded);
  };

  const enableAllInBundle = (bundle: string) => {
    const bundleSkills = skills.filter((s) => s.bundle === bundle);
    const newEnabled = new Set(enabledSkills);
    bundleSkills.forEach((s) => newEnabled.add(s.id));
    setEnabledSkills(newEnabled);
    localStorage.setItem("enabledSkills", JSON.stringify([...newEnabled]));
    toast.success(`Enabled all ${bundle} skills`);
  };

  const disableAllInBundle = (bundle: string) => {
    const bundleSkills = skills.filter((s) => s.bundle === bundle);
    const newEnabled = new Set(enabledSkills);
    bundleSkills.forEach((s) => newEnabled.delete(s.id));
    setEnabledSkills(newEnabled);
    localStorage.setItem("enabledSkills", JSON.stringify([...newEnabled]));
    toast.success(`Disabled all ${bundle} skills`);
  };

  const exportSkills = () => {
    const data = [...enabledSkills];
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tittu-skills.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Skills exported");
  };

  const importSkills = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const imported = JSON.parse(text);
        const newEnabled = new Set(imported);
        setEnabledSkills(newEnabled);
        localStorage.setItem("enabledSkills", JSON.stringify([...newEnabled]));
        toast.success("Skills imported");
      } catch {
        toast.error("Invalid skills file");
      }
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportSkills}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={importSkills}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload size={14} />
            <span className="hidden sm:inline">Import</span>
          </button>
        </div>
      </div>

      {/* Skills by Bundle */}
      <div className="flex flex-col gap-3">
        {Object.entries(groupedSkills).map(([bundle, bundleSkills]) => (
          <div
            key={bundle}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleBundle(bundle)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                {expandedBundles.has(bundle) ? (
                  <ChevronDown size={16} className="text-gray-500" />
                ) : (
                  <ChevronRight size={16} className="text-gray-500" />
                )}
                <span className="font-medium text-gray-900">{bundle}</span>
                <span className="text-xs text-gray-500">
                  ({bundleSkills.length} skills)
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    enableAllInBundle(bundle);
                  }}
                  className="text-xs px-2 py-1 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded"
                >
                  Enable All
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    disableAllInBundle(bundle);
                  }}
                  className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-200 rounded"
                >
                  Disable All
                </button>
              </div>
            </button>

            {expandedBundles.has(bundle) && (
              <div className="flex flex-col divide-y divide-gray-100">
                {bundleSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {skill.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {skill.description}
                      </div>
                    </div>
                    <Switch.Root
                      checked={enabledSkills.has(skill.id)}
                      onCheckedChange={() => toggleSkill(skill.id)}
                      className={clsx(
                        "w-10 h-5 rounded-full transition-colors",
                        "data-[state=checked]:bg-[var(--color-primary)]",
                        "data-[state=unchecked]:bg-gray-200",
                        "focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2",
                      )}
                    >
                      <Switch.Thumb
                        className={clsx(
                          "block w-4 h-4 bg-white rounded-full transition-transform",
                          "data-[state=checked]:translate-x-5",
                          "data-[state=unchecked]:translate-x-0.5",
                        )}
                      />
                    </Switch.Root>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Lightbulb size={32} className="text-gray-300 mb-2" />
          <p className="text-gray-500">No skills found</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{enabledSkills.size}</span> of{" "}
          <span className="font-medium">{skills.length}</span> skills enabled
        </div>
      </div>
    </div>
  );
}
