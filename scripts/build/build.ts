import { DIR_ROOT, githubUrl, LayoutData, ProjectStatsFull, stats } from "@todo/data";
import fs from "fs-extra";
import { globby } from "globby";
import md5 from "md5";
import { basename, join } from "node:path";
import { InjectConfig, injectExampleHtml } from "./injectExampleHtml";

// * ================================================================================ const and type

const DIR_OUTPUT = join(DIR_ROOT, "./dist");
const DIR_LAYOUT = join(DIR_ROOT, "./packages/pages/layout");
const DIR_INDEX = join(DIR_ROOT, "./packages/pages/index");

// * ================================================================================ data process

// * -------------------------------- layout props

const toLayoutData = (stats: ProjectStatsFull, inject: InjectConfig): LayoutData => ({
  backUrl: inject.backUrl,
  baseUrl: inject.baseUrl(stats),
  githubUrl,
  sourceUrl: `${githubUrl}/tree/master/examples/${stats.projName}`,

  stats,
});

// * ================================================================================ tasks

// * -------------------------------- all

const rebuildAll = async () => {
  await fs.ensureDir(DIR_OUTPUT);
  await fs.emptyDir(DIR_OUTPUT);

  // * ---------------- index page

  await fs.copy(join(DIR_INDEX, "./dist"), join(DIR_OUTPUT));

  // * ---------------- make css

  const cssFile = (await globby(join(DIR_LAYOUT, "./dist/layout.css")))[0];
  const cssBasename = md5(await fs.readFile(cssFile)).slice(-8) + ".css";
  await fs.copy(cssFile, join(DIR_OUTPUT, cssBasename));

  // * ---------------- make favicon

  const iconFile = (await globby(join(DIR_INDEX, "./dist/assets/favicon.*.svg")))[0];
  const iconBasename = basename(iconFile);
  await fs.copy(iconFile, join(DIR_OUTPUT, iconBasename));

  // * ---------------- inject config

  const inject: InjectConfig = {
    outDir: (p) => join(DIR_OUTPUT, "./examples/", p.projName),
    baseUrl: (p) => `/examples/${p.projName}/`,
    backUrl: "../../",
    css: `../../${cssBasename}`,
    favicon: `../../${iconBasename}`,
    title: (str: string) => `${str} | TodoMVC once more`,
  };

  await Promise.all(stats.map((p) => rebuildSingle(p, inject)));
};

// * -------------------------------- single

const rebuildSingle = async (p: ProjectStatsFull, inject: InjectConfig) => {
  const outProjDir = inject.outDir(p);
  const outProjIndex = join(outProjDir, "index.html");

  await fs.copy(join(p.projRoot, p.distName), outProjDir);

  const data = toLayoutData(p, inject);

  await fs.writeFile(outProjIndex, injectExampleHtml(await fs.readFile(outProjIndex, "utf8"), data, inject));
};

// * ================================================================================ run

rebuildAll();
