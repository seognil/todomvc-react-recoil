import fs from "fs-extra";
import { globby } from "globby";
import { gzipSize } from "gzip-size";
import md5 from "md5";
import { basename, dirname, join } from "node:path";
import { stacks } from "../../stacks";
import type { LayoutInfo } from "../layout/src/Layout";
import { injectAppHtml } from "./injectAppHtml";

// * ---------------------------------------------------------------- const and type

// const ROOT_DIR = join(process.cwd(), ".");
const ROOT_DIR = join(__dirname, "../../");
const PROJECTS_DIR = join(ROOT_DIR, "examples");
const OUTPUT_DIR = join(ROOT_DIR, "dist");

type FullPath = string & {};
type SubPath = string & {};
type BaseName = string & {};
type StackName = string & {};

interface ProjectInfo {
  projRoot: FullPath;
  projName: BaseName;
  distName: BaseName;
  files: { size: number; gsize: number; file: SubPath }[];
  meta: Meta;
}

interface Meta {
  title: string;
  stacks: StackName[];
  desc?: StackName[];
  core?: string[];
}

// * ---------------------------------------------------------------- projects statistics

const parseProject = async (projectFullPath: string): Promise<ProjectInfo> => {
  const distFullPath = (await globby(join(projectFullPath, "{dist,build}/index.html"))).map((e) => dirname(e))[0];

  if (!distFullPath) return null;

  // * ----------------

  const distFiles = await Promise.all(
    (
      await globby("**", { cwd: distFullPath })
    ).map(async (file) => {
      const fullFilePath = join(distFullPath, file);
      const size = (await fs.stat(fullFilePath)).size;
      const gsize = await gzipSize(await fs.readFile(fullFilePath, "utf8"));
      return { file, size, gsize };
    }),
  );

  const meta = await fs.readJSON(join(projectFullPath, "meta.json")).catch(() => ({}));

  return {
    projName: basename(projectFullPath),
    projRoot: projectFullPath,
    distName: basename(distFullPath),
    files: distFiles,
    meta,
  };
};

// * ---------------------------------------------------------------- layout props

const genLayoutInfo = (info: ProjectInfo): LayoutInfo => ({
  backUrl: "../",
  githubUrl: `https://github.com/seognil/todomvc-once-more`,
  sourceUrl: `https://github.com/seognil/todomvc-once-more/tree/master/examples/${info.projName}`,
  title: info.meta.title,
  dist: info.files,
  stacks: info.meta.stacks.map((e) => stacks[e.toLowerCase()]).filter((e) => e),
  desc: info.meta.desc?.map((e) => stacks[e.toLowerCase()]).filter((e) => e) ?? [],
  core: info.meta.core ?? [],
});

// * ---------------------------------------------------------------- single

const rebuildSingle = async (projPath: FullPath, injectedCss: SubPath) => {
  const p = await parseProject(projPath);
  const outProjDir = join(OUTPUT_DIR, p.projName);
  const outProjIndex = join(OUTPUT_DIR, p.projName, "index.html");

  await fs.copy(join(p.projRoot, p.distName), outProjDir);

  await fs.writeFile(
    outProjIndex,
    injectAppHtml(await fs.readFile(outProjIndex, "utf8"), injectedCss, genLayoutInfo(p)),
  );
};

// * ---------------------------------------------------------------- all

const rebuildAll = async () => {
  await fs.ensureDir(OUTPUT_DIR);
  await fs.emptyDir(OUTPUT_DIR);

  const projectFullPathList = await globby("*/package.json", {
    cwd: PROJECTS_DIR,
  }).then((list) => list.map((e) => dirname(join(PROJECTS_DIR, e))));

  const injectedCss = (await globby(join(ROOT_DIR, "scripts/layout/dist/layout.css")))[0];
  const hashedName = md5(await fs.readFile(injectedCss)).slice(-8) + ".css";
  await fs.copy(injectedCss, join(OUTPUT_DIR, hashedName));

  await Promise.all(projectFullPathList.map((p) => rebuildSingle(p, `../${hashedName}`)));
};

// * ---------------------------------------------------------------- run

rebuildAll();
