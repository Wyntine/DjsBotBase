// @ts-check

import { execSync } from "child_process";
import { existsSync } from "fs";
import { readdir, rename, rm } from "fs/promises";
import { join } from "path";
import { x } from "tar";

async function buildPackage() {
  const execPath = join(process.cwd(), "../");
  const modulesPath = join(process.cwd(), "node_modules");
  const unpackedModulePath = join(modulesPath, "package");
  const finalModulePath = join(modulesPath, "djs-bot-base");

  if (existsSync(finalModulePath)) {
    await rm(finalModulePath, { recursive: true });
  }

  execSync("npm i");
  execSync("npm pack", { cwd: execPath });

  const packedFile = (await readdir(execPath, { withFileTypes: true })).find(
    (file) => file.isFile() && file.name.endsWith(".tgz")
  );

  if (!packedFile) {
    throw new Error("Packed file not found.");
  }

  const packedFilePath = join(execPath, packedFile.name);
  x({ sync: true, file: packedFilePath, cwd: modulesPath });
  await rename(unpackedModulePath, finalModulePath);
}

buildPackage();
