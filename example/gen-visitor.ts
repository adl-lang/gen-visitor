import * as flags from "https://deno.land/std@0.200.0/flags/mod.ts";
import {
  genVisitor
// } from "https://deno.land/x/adllang_genmermaid@v0.1/mod.ts"
} from "../mod.ts";
import { getAdlStdLibDir, globFiles, genTypescript } from "https://deno.land/x/adllang_tsdeno@v0.6/mod.ts";
import { ParseAdlParams } from "https://deno.land/x/adllang_tsdeno@v0.6/utils/adl.ts";

async function globbedFilesToModule(dir0: string, files: string[]) {
  const dir = await Deno.realPath(dir0);
  return files.map(f => {
    //   console.log(f)
    const f0 = f.substring(dir.length + 1).replaceAll("/", ".").slice(0, -4);
    // console.log(f0)
    return f0;
  });
}

async function globedModules(dir0: string, pattern0?: string) {
  const pattern = pattern0 ? pattern0 : "**/*.adl";
  const files = await globFiles(dir0, pattern);
  const dir = await Deno.realPath(dir0);
  return files.map(f => {
    //   console.log(f)
    const f0 = f.substring(dir.length + 1).replaceAll("/", ".").slice(0, -4);
    // console.log(f0)
    return f0;
  });
}

async function main() {
  const args = flags.parse(Deno.args, { string: ["file", "import_base"] });
  const adlStdLibDir = await getAdlStdLibDir();
  const verbose = false;
  const adlDir = './adl';

  const promises: Promise<void>[] = [];

  const adlMods = await globedModules(adlDir);
  const adlStdLibMods = await globedModules(adlStdLibDir);
  const params: ParseAdlParams = {
    adlModules: [...adlMods, ...adlStdLibMods],
    searchPath: [adlDir, ...adlStdLibMods],
    verbose,
  };
  // Deno.mkdirSync(sqldir + "/create", { recursive: true });
  promises.push(genVisitor({
    ...params,
    ts_style: "deno",
    import_base: args.import_base ? args.import_base : "https://deno.land/x/adllang_tsdeno@v0.6/adl-gen/",
    createFile: args.file ? args.file : "-",
    rootStructs: args._.map(a => `${a}`),
  }));
  promises.push(genTypescript({
    ...params,
    outputDir: "ts",
    runtimeDir: "runtime",
    includeRuntime: true,
    generateTransitive: true,
    tsStyle: "deno",
  }))
  Promise.all(promises);
}

main()
  .catch((err) => {
    console.error("error in main", err);
  });
