/* eslint-disable no-console */

import axios from "axios";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEPARTMENTS = [
  "Engineering",
  "Sales",
  "Marketing",
  "Finance",
  "Operations",
  "Customer Support",
] as const;

type SeedArgs = {
  token?: string;
  baseUrl?: string;
  perDept: number;
  password: string;
  dryRun: boolean;
  only: "all" | "departments" | "employees";
};

function parseArgs(argv: string[]): SeedArgs {
  const args: SeedArgs = {
    perDept: 12,
    password: process.env.SEED_DEFAULT_PASSWORD || "password123",
    dryRun: false,
    only: "all",
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];

    if (a === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (a === "--only" && argv[i + 1]) {
      const v = argv[++i];
      if (v === "departments" || v === "employees" || v === "all") args.only = v;
      else throw new Error(`Invalid --only value: ${v}`);
      continue;
    }

    if ((a === "--token" || a === "-t") && argv[i + 1]) {
      args.token = argv[++i];
      continue;
    }

    if (a === "--base-url" && argv[i + 1]) {
      args.baseUrl = argv[++i];
      continue;
    }

    if ((a === "--per-dept" || a === "--perDept") && argv[i + 1]) {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n <= 0) throw new Error(`Invalid --per-dept: ${argv[i]}`);
      args.perDept = Math.floor(n);
      continue;
    }

    if ((a === "--password" || a === "-p") && argv[i + 1]) {
      args.password = argv[++i];
      continue;
    }

    throw new Error(`Unknown arg: ${a}`);
  }

  return args;
}

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function toIsoUtc(date: string): string {
  const d = date.trim();
  if (!d) return "";
  if (d.includes("T")) return d;
  return `${d}T00:00:00.000Z`;
}

function isProbablyDuplicateError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;

  const status = error.response?.status;
  if (status === 409) return true;

  const message =
    (error.response?.data as any)?.message ||
    (error.response?.data as any)?.error ||
    error.message ||
    "";

  return /exist|duplicate|already|đã\s+tồn\s+tại/i.test(String(message));
}

async function loadEnvLocalIfPresent(repoRoot: string) {
  const envPath = path.join(repoRoot, ".env.local");

  let content: string;
  try {
    content = await readFile(envPath, "utf8");
  } catch {
    return;
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;

    const key = match[1];
    let value = match[2] ?? "";

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function buildEmployeePayload(params: {
  deptName: string;
  deptIndex: number;
  index: number;
  password: string;
}): Record<string, unknown> {
  const lastNames = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Huynh", "Phan", "Vu", "Dang", "Bui"];
  const middleNames = ["Van", "Thi", "Minh", "Duc", "Gia", "Quang", "Thu", "Anh", "Hong", "Khanh"];
  const firstNames = ["An", "Binh", "Chi", "Dung", "Huy", "Kien", "Linh", "Nam", "Phuong", "Trang"];

  const lastName = lastNames[params.index % lastNames.length];
  const middleName = middleNames[params.index % middleNames.length];
  const firstName = firstNames[params.index % firstNames.length];

  const deptSlug = slugify(params.deptName);
  const email = `emp.${deptSlug}.${params.index}@dacn-demo.com`;

  // Keep it deterministic + unique across departments.
  // 10 digits total: 09 + (deptIndex 2 digits) + (index 6 digits)
  const phone = `09${String(params.deptIndex).padStart(2, "0")}${String(params.index).padStart(6, "0")}`;

  const yearOfBirth = 1990 + (params.index % 10); // 1990..1999
  const month = String(1 + (params.index % 12)).padStart(2, "0");
  const day = String(1 + (params.index % 28)).padStart(2, "0");

  const signYear = 2021 + (params.index % 4); // 2021..2024
  const signMonth = String(1 + ((params.index + 3) % 12)).padStart(2, "0");
  const signDay = String(1 + ((params.index + 7) % 28)).padStart(2, "0");

  const basicSalary = 900 + (params.index % 12) * 50;
  const grossSalary = basicSalary + 300;

  return {
    lastName,
    firstName,
    middleName,
    gender: params.index % 2 === 0 ? "Male" : "Female",
    dateOfBirth: toIsoUtc(`${yearOfBirth}-${month}-${day}`),
    email,
    password: params.password,
    roles: "EMPLOYEE",
    phone,
    departmentName: params.deptName,
    marriedStatus: params.index % 3 === 0,
    numberOfChildren: params.index % 4 === 0 ? 1 : 0,
    childrenDescription: null,
    basicSalary,
    grossSalary,
    signDate: toIsoUtc(`${signYear}-${signMonth}-${signDay}`),
    degrees:
      params.index % 5 === 0
        ? [
            {
              school: "HCMUT",
              degree: "Bachelor",
              fieldOfStudy: "Information Technology",
              graduationYear: 2019,
              description: null,
            },
          ]
        : [],
  };
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoRoot = path.resolve(__dirname, "..");

  await loadEnvLocalIfPresent(repoRoot);
  const args = parseArgs(process.argv.slice(2));

  const baseUrl = stripTrailingSlashes(
    args.baseUrl ||
      process.env.SEED_API_ENDPOINT ||
      process.env.NEXT_PUBLIC_API_ENDPOINT ||
      "",
  );
  if (!baseUrl) {
    throw new Error(
      "Missing API base URL. Set NEXT_PUBLIC_API_ENDPOINT in .env.local or pass --base-url",
    );
  }

  const token = args.token || process.env.SEED_ADMIN_TOKEN || process.env.ADMIN_TOKEN;
  if (!token) {
    console.error("Missing admin token.");
    console.error(
      "Provide via --token or set SEED_ADMIN_TOKEN env var (copy localStorage token after admin login).",
    );
    process.exit(1);
  }

  const api = axios.create({
    baseURL: baseUrl,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    timeout: 30_000,
  });

  let createdDepartments = 0;
  let skippedDepartments = 0;
  let createdEmployees = 0;
  let skippedEmployees = 0;

  if (args.only === "all" || args.only === "departments") {
    console.log(`Seeding departments into ${baseUrl} ...`);

    for (const name of DEPARTMENTS) {
      try {
        if (args.dryRun) {
          console.log(`[dry-run] POST /department/create`, { name });
          createdDepartments++;
          continue;
        }

        await api.post("/department/create", { name });
        console.log(`+ Department: ${name}`);
        createdDepartments++;
      } catch (error) {
        if (isProbablyDuplicateError(error)) {
          console.log(`= Department exists: ${name}`);
          skippedDepartments++;
          continue;
        }
        console.error(`! Failed to create department: ${name}`);
        throw error;
      }
    }
  }

  if (args.only === "all" || args.only === "employees") {
    console.log(`Seeding employees (perDept=${args.perDept}) into ${baseUrl} ...`);

    for (const deptName of DEPARTMENTS) {
      const deptIndex = DEPARTMENTS.indexOf(deptName);
      for (let i = 1; i <= args.perDept; i++) {
        const payload = buildEmployeePayload({
          deptName,
          deptIndex,
          index: i,
          password: args.password,
        });

        try {
          if (args.dryRun) {
            console.log(`[dry-run] POST /employee/by-admin`, payload);
            createdEmployees++;
            continue;
          }

          await api.post("/employee/by-admin", payload);
          console.log(`+ Employee: ${(payload as any).email} (${deptName})`);
          createdEmployees++;
        } catch (error) {
          if (isProbablyDuplicateError(error)) {
            console.log(`= Employee exists: ${(payload as any).email}`);
            skippedEmployees++;
            continue;
          }
          console.error(`! Failed to create employee: ${(payload as any).email}`);
          throw error;
        }
      }
    }
  }

  console.log("---");
  console.log(
    `Done. departments: +${createdDepartments} =${skippedDepartments}; employees: +${createdEmployees} =${skippedEmployees}`,
  );
}

main().catch((error) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;
    console.error("Request failed", { status, data });
  } else {
    console.error(error);
  }
  process.exit(1);
});
