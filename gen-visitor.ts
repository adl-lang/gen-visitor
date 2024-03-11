import { adlast, utils_adl } from "./deps.ts";
import { TypeBinding, createTypeBindings, substituteTypeBindings } from "./typeparam.ts";

import {
  loadResources
} from "./load.ts";
import {
  FileWriter,
} from "./utils.ts";

// import { ModuleImplVI, newModuleVisitor } from "./visitor.ts";
import { ModuleImplVI, newModuleVisitor } from "./visitor_gen.ts";

export interface GenMermaidParams extends utils_adl.ParseAdlParams {
  // extensions?: string[];
  // verbose?: boolean;
  // filter?: (scopedDecl: adlast.ScopedDecl) => boolean;
  ts_style: "deno" | "tsc";
  import_base?: string;
  createFile: string;
  rootStructs: string[];
}

export async function genVisitor(
  params0: GenMermaidParams,
): Promise<void> {
  const params = {
    ...params0,
    nameMung: (s: string) => s,
  };
  const import_base = params.import_base ? params.import_base : "./";

  const { loadedAdl, resources } = await loadResources(params);
  const writer = new FileWriter(params.createFile, !!params.verbose);

  const import2sd = (moduleName: string) => {
    writer.register_import(`import * as ${moduleName.replaceAll(".", "_")} from "${import_base}${moduleName.replaceAll(".", "/")}${params.ts_style === "deno" ? ".ts" : ""}";\n`);
    return moduleName.replaceAll(".", "_");
  };

  type BaseVIPayload = {
    // sd: adlast.ScopedDecl,
    // typeExpr: adlast.TypeExpr
    type_name: string,
    decl: adlast.Decl,
    name: string,
    moduleName: string,
    typeBindings: TypeBinding[]
  };
  type WriteSig = (decl: adlast.Decl, name: string, rname: string, typename: string, comment: string) => void;

  type BaseVIImpl = Required<Pick<ModuleImplVI<BaseVIPayload, void>, "Decl" | "DeclType_struct_" | "DeclType_union_" | "DeclType_newtype_" | "DeclType_type_">>;
  const makeBaseVI = (root: adlast.ScopedDecl, writeSig: WriteSig, enumBranches: boolean): BaseVIImpl => {
    const seen = new Set<string>();
    const visitorBase = newModuleVisitor<BaseVIPayload, void>();
    const visitorStruct = newModuleVisitor<BaseVI_struct, void>();

    type BaseVI_struct = {
      typeBindings: TypeBinding[]
    };
    const baseVI_struct: Required<Pick<ModuleImplVI<BaseVI_struct, void>, "TypeRef_reference" | "TypeExpr">> = {
      TypeRef_reference(b, m, p) {
        const d2 = resources.declMap[`${m.moduleName}.${m.name}`];
        visitorBase.Decl(baseVI, d2.decl, { ...p, decl: d2.decl, type_name: d2.decl.name, name: d2.decl.name, moduleName: d2.moduleName });
      },
      TypeExpr(b, m, p) {
        if (m.typeRef.kind === "primitive") {
          switch(m.typeRef.value) {
            case "Vector":
            case "Nullable":
            case "StringMap":
              b.TypeExpr(this, m.parameters[0], p);
              return;
            default:
              return;
          }
        }
        if ( m.typeRef.kind === "reference" ) {
          const decl = resources.declMap[`${m.typeRef.value.moduleName}.${m.typeRef.value.name}`]
          const typeParams = decl.decl.type_.value.typeParams;
          const typeBindings = createTypeBindings(typeParams, m.parameters);
          b.TypeRef(this, m.typeRef, {...p, typeBindings});
          return
        }
        throw new Error(`!! M:${JSON.stringify(m)}`)
      },
    };

    const baseVI: BaseVIImpl = {
      Decl(b, m, p): void {
        if( m.type_.value.typeParams.length > 0 ) {
          const tps = m.type_.value.typeParams.map(t => p.typeBindings.find(b => b.name === t)!.value).map(getType)
          p.name = p.name+ "__" + tps.join("_")
        }
        if (seen.has(`${p.moduleName}.${p.name}`)) return;
        b.DeclType(this, m.type_, p);
      },
      DeclType_struct_(b, m, p) {
        writeSig(p.decl, p.name, root.decl.name, `${import2sd(p.moduleName)}.${p.type_name}`, "1");
        seen.add(`${p.moduleName}.${p.name}`);
        m.fields.forEach(f => {
          const typeExpr = substituteTypeBindings(f.typeExpr, p.typeBindings);
          visitorStruct.TypeExpr(baseVI_struct, typeExpr, p);
          if (enumBranches) {
            if (f.typeExpr.typeRef.kind === "primitive" && f.typeExpr.typeRef.value === "StringMap") {
              writer.write(`  // TODO ??__stringmap ${f.name} 1\n`);
            }
          }
        });
      },
      DeclType_union_(b, m, p) {
        let typeParams = ""
        if( m.typeParams.length > 0 ) {
          const tps = m.typeParams.map(t => p.typeBindings.find(b => b.name === t)!.value).map(getType)
          typeParams = `<${tps.join(", ")}>`
        }
        writeSig(p.decl, p.name, root.decl.name, `${import2sd(p.moduleName)}.${p.type_name}${typeParams}`, "2");
        seen.add(`${p.moduleName}.${p.name}`);
        if (enumBranches) {
          m.fields.forEach(br => {
            try {
              const typeExpr = substituteTypeBindings(br.typeExpr, p.typeBindings);
              writeSig(p.decl, `${p.name}_${br.name}`, root.decl.name, getType(typeExpr), "3");
              seen.add(`${p.moduleName}.${p.name}`);
            } catch (err) {
              throw new Error(`m: ${JSON.stringify(m, null, 2)}\np: ${JSON.stringify(p, null, 2)}\n${err.message}`);
            }
          });
        }
        m.fields.forEach(br => {
          const typeExpr = substituteTypeBindings(br.typeExpr, p.typeBindings);
          visitorStruct.TypeExpr(baseVI_struct, typeExpr, p);
        });
      },
      DeclType_newtype_(b, m, p) {
        const typeExpr = substituteTypeBindings(m.typeExpr, p.typeBindings);
        writeSig(p.decl, p.name, root.decl.name, `${getType(typeExpr)}`, "4");
        seen.add(`${p.moduleName}.${p.name}`);
      },
      DeclType_type_(b, m, p) {
        const typeExpr = substituteTypeBindings(m.typeExpr, p.typeBindings);
        visitorStruct.TypeExpr(baseVI_struct, typeExpr, p);
      },
    };

    return baseVI;
  };

  function unwrapTypeAlias(sn: adlast.ScopedName, followTypedefs: boolean, followNewTypes: boolean): (adlast.ScopedDecl | null) {
    const sd = resources.declMap[`${sn.moduleName}.${sn.name}`];
    const dt = sd.decl.type_;
    if (dt.kind === "type_" && followTypedefs) {
      switch (dt.value.typeExpr.typeRef.kind) {
        case "reference":
          const d2 = resources.declMap[`${dt.value.typeExpr.typeRef.value.moduleName}.${dt.value.typeExpr.typeRef.value.name}`];
          return unwrapTypeAlias(adlast.makeScopedName({ moduleName: d2.moduleName, name: d2.decl.name }), followTypedefs, followNewTypes);
        default:
          return null;
      }
    }
    if (dt.kind === "newtype_" && followTypedefs) {
      switch (dt.value.typeExpr.typeRef.kind) {
        case "reference":
          const d2 = resources.declMap[`${dt.value.typeExpr.typeRef.value.moduleName}.${dt.value.typeExpr.typeRef.value.name}`];
          return unwrapTypeAlias(adlast.makeScopedName({ moduleName: d2.moduleName, name: d2.decl.name }), followTypedefs, followNewTypes);
        default:
          return null;
      }
    }
    return sd;
  }

  type ImplPayload = {
    name: string
  };
  type ImplVisitor = Required<Pick<ModuleImplVI<ImplPayload, void>, "DeclType_struct_" | "DeclType_union_" | "DeclType_type_" | "DeclType_newtype_">>;
  const makeImplVisitor = (): ImplVisitor => {
    const visitorBase = newModuleVisitor<ImplPayload, void>();
    const visitorField = newModuleVisitor<ImplField, void>();

    type ImplField = {
      f: adlast.Field;
    };
    const implField: Required<Pick<ModuleImplVI<ImplField, void>, "TypeExpr">> = {
      TypeExpr(b, m, p) {
        switch (m.typeRef.kind) {
          case "primitive": {
            // TODO unwrap and generate iterator
            switch (m.typeRef.value) {
              case "Vector": {
                const tr = m.parameters[0].typeRef;
                if (tr.kind === "reference") {
                  const sd = unwrapTypeAlias(tr.value, true, true);
                  if (sd !== null) {
                    writer.write(`      m.${p.f.name}.forEach(el => this.${sd.decl.name}(impl, el, p)); // 5\n`);
                  }
                }
                return;
              }
              case "Nullable": {
                const tr = m.parameters[0].typeRef;
                if (tr.kind === "reference") {
                  const sd = unwrapTypeAlias(tr.value, true, true);
                  if (sd !== null) {
                    writer.write(`      if (m.${p.f.name} !== null) this.${tr.value.name}(impl, m.${p.f.name}, p); // 6\n`);
                  }
                }
                return;
              }
              case "StringMap": {
                const tr = m.parameters[0].typeRef;
                writer.write(`      // TODO ??__stringmap ${p.f.name}\n`);
                return;
              }
              default:
                return;
            }
          }
          case "reference": {
            const sd = unwrapTypeAlias(m.typeRef.value, true, true);
            if (sd !== null) {
              if( sd.decl.type_.value.typeParams.length === 0 ) {
                writer.write(`      this.${sd.decl.name}(impl, m.${p.f.name}, p); // 7\n`);
              } else {
                const tps = m.parameters.map(getType).join("_")
                writer.write(`      this.${sd.decl.name}__${tps}(impl, m.${p.f.name}, p); // 8\n`);
              }
            }
            return;
          }
          case "typeParam":
            writer.write(`      // TODO type alias - implField\n`);
            return;
          default:
            throw new Error("???");
        }
      },
    };


    const implV: ImplVisitor = {
      DeclType_struct_(b, m, p) {
        writer.write(`      if (impl.${p.name}) return impl.${p.name}(this, m, p);\n`);
        m.fields.forEach(f => {
          visitorField.TypeExpr(implField, f.typeExpr, { f });
        });
      },
      DeclType_union_(b, m, p) {
        writer.write(`      if (impl.${p.name}) return impl.${p.name}(this, m, p);\n`);
        writer.write(`      switch (m.kind) {\n`);
        m.fields.forEach(br => {
          writer.write(`      case "${br.name}":\n`);
          if (br.typeExpr.typeRef.kind === "primitive" && br.typeExpr.typeRef.value === "Void") {
            writer.write(`        if (impl.${p.name}_${br.name}) return impl.${p.name}_${br.name}(this, undefined, p)\n`);
          } else {
            writer.write(`        if (impl.${p.name}_${br.name}) return impl.${p.name}_${br.name}(this, m.value, p)\n`);
          }
          writer.write(`        return\n`);
        });
        writer.write(`      }\n`);
      },
      DeclType_newtype_(b, m, p) {
        writer.write(`      if (impl.${p.name}) return impl.${p.name}(this, m, p);\n`);
      },
      DeclType_type_(b, m, p) {
        writer.write(`      // TODO type alias\n`);
      },
    };
    return implV;
  };

  const baseVISig: WriteSig = (_, name, rootname, impltype, comment) => {
    writer.write(`  ${name}: (impl: ${rootname}ImplVI<P, R>, m: ${impltype}, p: P) => R | void;`);
    if (comment) {
      writer.write(` // ${comment}`);
    }
    writer.write(`\n`);
  };
  const implVISig: WriteSig = (_, name, rootname, impltype, comment) => {
    writer.write(`  ${name}?: (b: ${rootname}BaseVI<P, R>, m: ${impltype}, p: P) => R;`);
    if (comment) {
      writer.write(` // ${comment}`);
    }
    writer.write(`\n`);
  };
  const implBV = newModuleVisitor<ImplPayload, void>();
  const baseVistorImpl: WriteSig = (decl, name, rootname, impltype, comment) => {
    writer.write(`    ${name}: function (impl: ${rootname}ImplVI<P, R>, m: ${impltype}, p: P): (R | void) {`);
    if (comment) {
      writer.write(` // ${comment}`);
    }
    writer.write(`\n`);
    implBV.Decl(makeImplVisitor(), decl, { name });
    writer.write(`    },\n`);
  };

  params.rootStructs.forEach(rs => {
    const sd = resources.declMap[rs];
    writer.register_import(`import * as ${import2sd(sd.moduleName)} from "${import_base}${sd.moduleName.replaceAll(".", "/")}${params.ts_style === "deno" ? ".ts" : ""}";\n`);
    writer.write(`\n`);
    writer.write(`export interface ${sd.decl.name}BaseVI<P, R> {\n`);
    newModuleVisitor<BaseVIPayload, void>().Decl(makeBaseVI(sd, baseVISig, false), sd.decl, { decl: sd.decl, type_name: sd.decl.name, name: sd.decl.name, moduleName: sd.moduleName, typeBindings: [] });
    writer.write(`}\n\n`);

    writer.write(`export interface ${sd.decl.name}ImplVI<P, R> {\n`);
    newModuleVisitor<BaseVIPayload, void>().Decl(makeBaseVI(sd, implVISig, true), sd.decl, { decl: sd.decl, type_name: sd.decl.name, name: sd.decl.name, moduleName: sd.moduleName, typeBindings: [] });
    writer.write(`}\n\n`);

    writer.write(`export function new${sd.decl.name}Visitor<P, R>(): ${sd.decl.name}BaseVI<P, R> {\n`);
    writer.write(`  const v: ${sd.decl.name}BaseVI<P, R> = {\n`);
    newModuleVisitor<BaseVIPayload, void>().Decl(makeBaseVI(sd, baseVistorImpl, false), sd.decl, { decl: sd.decl, type_name: sd.decl.name, name: sd.decl.name, moduleName: sd.moduleName, typeBindings: [] });
    writer.write(`  };\n`);
    writer.write(`  return v;\n`);
    writer.write(`}\n\n`);
  });

  await writer.close();
}

function getType(typeExpr: adlast.TypeExpr): string {
    switch (typeExpr.typeRef.kind) {
    case "primitive":
      switch (typeExpr.typeRef.value) {
        case "Vector":
          return `${getType(typeExpr.parameters[0])}[]`;
        case "Nullable":
          return `(${getType(typeExpr.parameters[0])} | null)`;
        case "StringMap":
          return `Record<string, ${getType(typeExpr.parameters[0])}>`;
        case "Json":
          return "any";
        case "String":
          return "string";
        case "Int8":
        case "Int16":
        case "Int32":
        case "Int64":
        case "Word8":
        case "Word16":
        case "Word32":
        case "Word64":
          return "number";
        case "Bool":
          return "boolean";
        case "Void":
          return "void";
        default:
          throw new Error(`Not implemented primitive ${typeExpr.typeRef.kind}`);
      }
    case "reference":
      const tp = typeExpr.parameters.length === 0 ? "" : `<${typeExpr.parameters.map(getType).join(", ")}>`
      return `${typeExpr.typeRef.value.moduleName.replaceAll(".", "_")}.${typeExpr.typeRef.value.name}${tp}`;
    case "typeParam":
      throw new Error(`Not implemented??? ${JSON.stringify(typeExpr)}`);
  }
}
