use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct GpuInfo {
    pub name: String,
    pub vendor: String,
    pub memory_mb: Option<u64>,
    pub backend: String,
    pub is_available: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct SystemInfo {
    pub gpu: GpuInfo,
    pub cpu_cores: usize,
    pub total_memory_mb: u64,
    pub os: String,
}

pub fn detect_gpu() -> GpuInfo {
    #[cfg(target_os = "windows")]
    {
        detect_gpu_windows()
    }

    #[cfg(target_os = "linux")]
    {
        detect_gpu_linux()
    }

    #[cfg(target_os = "macos")]
    {
        detect_gpu_macos()
    }

    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        GpuInfo {
            name: "Unknown".to_string(),
            vendor: "Unknown".to_string(),
            memory_mb: None,
            backend: "cpu".to_string(),
            is_available: false,
        }
    }
}

#[cfg(target_os = "windows")]
fn detect_gpu_windows() -> GpuInfo {
    use std::process::Command;

    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            "Get-CimInstance Win32_VideoController | Select-Object -First 1 Name,AdapterRAM,DriverVersion | ConvertTo-Json",
        ])
        .output();

    match output {
        Ok(out) if out.status.success() => {
            let text = String::from_utf8_lossy(&out.stdout);
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                let name = json["Name"]
                    .as_str()
                    .unwrap_or("Unknown GPU")
                    .to_string();
                let memory = json["AdapterRAM"]
                    .as_u64()
                    .map(|v| v / (1024 * 1024));
                let backend = if name.to_lowercase().contains("nvidia") {
                    "cuda"
                } else if name.to_lowercase().contains("amd") || name.to_lowercase().contains("radeon") {
                    "vulkan"
                } else if name.to_lowercase().contains("intel") {
                    "vulkan"
                } else {
                    "cpu"
                };
                let vendor = detect_vendor_from_name(&name);
                return GpuInfo {
                    name,
                    vendor,
                    memory_mb: memory,
                    backend: backend.to_string(),
                    is_available: true,
                };
            }
        }
        _ => {}
    }

    GpuInfo {
        name: "No GPU detected".to_string(),
        vendor: "Unknown".to_string(),
        memory_mb: None,
        backend: "cpu".to_string(),
        is_available: false,
    }
}

#[cfg(target_os = "linux")]
fn detect_gpu_linux() -> GpuInfo {
    use std::process::Command;

    let output = Command::new("lspci")
        .args(["-vmm", "-d", "::0300"])
        .output();

    match output {
        Ok(out) if out.status.success() => {
            let text = String::from_utf8_lossy(&out.stdout);
            let mut name = "Unknown GPU".to_string();
            let mut memory_mb: Option<u64> = None;

            for line in text.lines() {
                if line.starts_with("Device:") {
                    name = line.replace("Device:", "").trim().to_string();
                }
                if line.starts_with("Memory:") && memory_mb.is_none() {
                    if let Some(mem_str) = line.split(':').nth(1) {
                        let cleaned = mem_str.trim().replace("MiB", "").replace("GiB", "");
                        if let Ok(mem) = cleaned.parse::<u64>() {
                            memory_mb = Some(mem);
                        }
                    }
                }
            }

            let backend = if name.to_lowercase().contains("nvidia") {
                "cuda"
            } else if name.to_lowercase().contains("amd") || name.to_lowercase().contains("radeon") {
                "vulkan"
            } else {
                "cpu"
            };

            GpuInfo {
                name,
                vendor: detect_vendor_from_name(&name),
                memory_mb,
                backend: backend.to_string(),
                is_available: true,
            }
        }
        _ => GpuInfo {
            name: "No GPU detected".to_string(),
            vendor: "Unknown".to_string(),
            memory_mb: None,
            backend: "cpu".to_string(),
            is_available: false,
        },
    }
}

#[cfg(target_os = "macos")]
fn detect_gpu_macos() -> GpuInfo {
    use std::process::Command;

    let output = Command::new("system_profiler")
        .args(["SPDisplaysDataType", "-json"])
        .output();

    match output {
        Ok(out) if out.status.success() => {
            let text = String::from_utf8_lossy(&out.stdout);
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                if let Some(displays) = json.get("SPDisplaysDataType").and_then(|v| v.as_array()) {
                    if let Some(first) = displays.first() {
                        let name = first["sppci_model"]
                            .as_str()
                            .unwrap_or("Apple GPU")
                            .to_string();
                        return GpuInfo {
                            name,
                            vendor: "Apple".to_string(),
                            memory_mb: None,
                            backend: "metal".to_string(),
                            is_available: true,
                        };
                    }
                }
            }
        }
        _ => {}
    }

    GpuInfo {
        name: "Apple GPU".to_string(),
        vendor: "Apple".to_string(),
        memory_mb: None,
        backend: "metal".to_string(),
        is_available: true,
    }
}

fn detect_vendor_from_name(name: &str) -> String {
    let lower = name.to_lowercase();
    if lower.contains("nvidia") || lower.contains("geforce") || lower.contains("rtx") || lower.contains("gtx") {
        "NVIDIA".to_string()
    } else if lower.contains("amd") || lower.contains("radeon") || lower.contains("rx ") {
        "AMD".to_string()
    } else if lower.contains("intel") || lower.contains("iris") {
        "Intel".to_string()
    } else if lower.contains("apple") {
        "Apple".to_string()
    } else {
        "Unknown".to_string()
    }
}

pub fn get_system_info() -> SystemInfo {
    let gpu = detect_gpu();
    let cpu_cores = num_cpus::get();

    #[cfg(target_os = "windows")]
    let total_memory_mb = {
        use std::process::Command;
        let output = Command::new("powershell")
            .args(["-NoProfile", "-Command", "(Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory / 1MB"])
            .output();
        match output {
            Ok(out) if out.status.success() => {
                String::from_utf8_lossy(&out.stdout)
                    .trim()
                    .parse()
                    .unwrap_or(8192)
            }
            _ => 8192,
        }
    };

    #[cfg(not(target_os = "windows"))]
    let total_memory_mb: u64 = 8192;

    let os = std::env::consts::OS.to_string();

    SystemInfo {
        gpu,
        cpu_cores,
        total_memory_mb,
        os,
    }
}
