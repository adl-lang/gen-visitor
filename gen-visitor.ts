import { utils, adlast, types, utils_adl }
  from "./deps.ts";

const { getAnnotation,
  getModuleLevelAnnotation,
  scopedName
} = utils_adl;

import {
  HIDDEN,
  ScopedDecl,
  ScopedStruct,
  ScopedType,
  ScopedUnion,
  loadResources
} from "./load.ts";
import {
  FileWriter,
  NameMungFn
} from "./utils.ts";

export interface GenMermaidParams extends utils_adl.ParseAdlParams {
  // extensions?: string[];
  // verbose?: boolean;
  // filter?: (scopedDecl: adlast.ScopedDecl) => boolean;
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

  const { loadedAdl, resources } = await loadResources(params);
  const writer = new FileWriter(params.createFile, !!params.verbose);


  const import2mn = (mn: string) => {
    return mn;
  };
  const import2sd = (sd: adlast.ScopedDecl) => {
    return import2mn(sd.moduleName);
  };

  type BaseVIPayload = {
    // seen: Set<string>,
    sd: adlast.ScopedDecl,
    // root: adlast.ScopedDecl,
  };
  type WriteSig = (sd: adlast.ScopedDecl, name: string, rname: string, typename: string, comment?: string) => void;

  type BaseVIImpl = Required<Pick<ModuleImplVI<BaseVIPayload, void>, "Decl" | "DeclType_struct_" | "DeclType_union_" | "DeclType_newtype_" | "DeclType_type_">>;
  const makeBaseVI = (root: adlast.ScopedDecl, writeSig: WriteSig, enumBranches: boolean): BaseVIImpl => {
    const seen = new Set<string>();
    const visitorBase = newModuleVisitor<BaseVIPayload, void>();
    const visitorStruct = newModuleVisitor<BaseVI_struct, void>();

    type BaseVI_struct = {
    };
    const baseVI_struct: Required<Pick<ModuleImplVI<BaseVI_struct, void>, "TypeRef_reference" | "TypeExpr">> = {
      TypeRef_reference(b, m, p) {
        const d2 = resources.declMap[`${m.moduleName}.${m.name}`];
        visitorBase.Decl(baseVI, d2.decl, { ...p, sd: d2 });
      },
      TypeExpr(b, m, p) {
        if (m.typeRef.kind === "primitive" && (m.typeRef.value === "Vector" || m.typeRef.value === "Nullable" || m.typeRef.value === "StringMap")) {
          b.TypeExpr(this, m.parameters[0], p);
          return;
        }
        b.TypeRef(this, m.typeRef, p);
      },
    };

    const baseVI: BaseVIImpl = {
      Decl(b, m, p): void {
        if (seen.has(`${p.sd.moduleName}.${p.sd.decl.name}`)) return;
        b.DeclType(this, m.type_, p);
        seen.add(`${p.sd.moduleName}.${p.sd.decl.name}`);
      },
      DeclType_struct_(b, m, p) {
        writeSig(p.sd, p.sd.decl.name, root.decl.name, `${import2sd(p.sd)}.${p.sd.decl.name}`, "1");
        m.fields.forEach(f => {
          visitorStruct.TypeExpr(baseVI_struct, f.typeExpr, p);
          if (enumBranches) {
            if( f.typeExpr.typeRef.kind === "primitive" && f.typeExpr.typeRef.value === "StringMap") {
              writer.write(`  // TODO ??__stringmap ${f.name}\n`)
            }
          }
        });
      },
      DeclType_union_(b, m, p) {
        writeSig(p.sd, p.sd.decl.name, root.decl.name, `${import2sd(p.sd)}.${p.sd.decl.name}`, "2");
        if (enumBranches) {
          m.fields.forEach(br => {
            writeSig(p.sd, `${p.sd.decl.name}_${br.name}`, root.decl.name, getType(br.typeExpr), "3");
          });
          m.fields.forEach(br => {
            visitorStruct.TypeExpr(baseVI_struct, br.typeExpr, p);
          });
        }
      },
      DeclType_newtype_(b, m, p) {
        writeSig(p.sd, p.sd.decl.name, root.decl.name, getType(m.typeExpr), "3");
        visitorStruct.TypeExpr(baseVI_struct, m.typeExpr, p);
      },
      DeclType_type_(b, m, p) {
        visitorStruct.TypeExpr(baseVI_struct, m.typeExpr, p);
      },
    };

    return baseVI;
  };

  function getDecl(sn: adlast.ScopedName) {
    const sd = resources.declMap[`${sn.moduleName}.${sn.name}`]
    const dt = sd.decl.type_
    if (dt.kind === "type_") {
      switch( dt.value.typeExpr.typeRef.kind ) {
        case "reference":
          const d2 = resources.declMap[`${dt.value.typeExpr.typeRef.value.moduleName}.${dt.value.typeExpr.typeRef.value.name}`];
          return getDecl(adlast.makeScopedName({moduleName: d2.moduleName, name: d2.decl.name}))
        default:
          return null;
      }
    }
    return sd
  }
  
  type ImplPayload = {
    sd: adlast.ScopedDecl,
  };
  type ImplVisitor = Required<Pick<ModuleImplVI<ImplPayload, void>, "DeclType_struct_" | "DeclType_union_" | "DeclType_type_" | "DeclType_newtype_">>;
  const makeImplVisitor = (): ImplVisitor => {
    const visitorBase = newModuleVisitor<ImplPayload, void>();
    const visitorField = newModuleVisitor<ImplField, void>();

    type ImplField = {
      f: adlast.Field
    };
    const implField: Required<Pick<ModuleImplVI<ImplField, void>, "TypeExpr">> = {
      TypeExpr(b, m, p) {
        switch( m.typeRef.kind ) {
          case "primitive": {
            const tr = m.parameters[0].typeRef
            switch (m.typeRef.value) {
              case "Vector":
                if( tr.kind === "reference" ) {
                  const sd = getDecl(tr.value)
                  if ( sd !== null ) {
                    writer.write(`      m.${p.f.name}.forEach(el => this.${sd.decl.name}(impl, el, p));\n`);
                  }
                }
                return
              case "Nullable":
                if( tr.kind === "reference" ) {
                  const sd = getDecl(tr.value)
                  if ( sd !== null ) {
                    writer.write(`      if (m.${p.f.name} !== null) this.${tr.value.name}(impl, m.${p.f.name}, p);\n`);
                  }
                }
                return
              case "StringMap":
                writer.write(`      // TODO ??__stringmap ${p.f.name}\n`)
                return
              default:
                return
            }
          }
          case "reference": {
            const sd = getDecl(m.typeRef.value)
            if ( sd !== null ) {
              writer.write(`      this.${sd.decl.name}(impl, m.${p.f.name}, p);\n`);
            }
          }
        }
      },
    };


    const implV: ImplVisitor = {
      DeclType_struct_(b, m, p) {
        writer.write(`      if (impl.${p.sd.decl.name}) return impl.${p.sd.decl.name}(this, m, p);\n`);
        m.fields.forEach(f => {
          visitorField.TypeExpr(implField, f.typeExpr, {f})
        });
      },
      DeclType_union_(b, m, p) {
        writer.write(`      if (impl.${p.sd.decl.name}) return impl.${p.sd.decl.name}(this, m, p);\n`);
      },
      DeclType_newtype_(b, m, p) {
        writer.write(`      if (impl.${p.sd.decl.name}) return impl.${p.sd.decl.name}(this, m, p);\n`);
      },
      DeclType_type_(b, m, p) {
      },
    };
    return implV;
  };

  const baseVISig: WriteSig = (sd, name, rootname, impltype, comment) => {
    writer.write(`  ${name}: (impl: ${rootname}ImplVI<P, R>, m: ${impltype}, p: P) => R | void;`);
    if (comment) {
      writer.write(` // ${comment}`);
    }
    writer.write(`\n`);
  };
  const implVISig: WriteSig = (sd, name, rootname, impltype, comment) => {
    writer.write(`  ${name}?: (b: ${rootname}BaseVI<P, R>, m: ${impltype}, p: P) => R;`);
    if (comment) {
      writer.write(` // ${comment}`);
    }
    writer.write(`\n`);
  };
  const implBV = newModuleVisitor<ImplPayload, void>();
  const baseVistorImpl: WriteSig = (sd, name, rootname, impltype, comment) => {
    writer.write(`    ${name}: function (impl: ${rootname}ImplVI<P, R>, m: ${impltype}, p: P): (R | void) {`);
    if (comment) {
      writer.write(` // ${comment}`);
    }
    writer.write(`\n`);
    implBV.Decl(makeImplVisitor(), sd.decl, { sd });
    writer.write(`    },\n`);
  };

  params.rootStructs.forEach(rs => {
    const sd = resources.declMap[rs];
    writer.write(`import * as ${import2sd(sd)} from "./${sd.moduleName.substring(sd.moduleName.lastIndexOf("."))}.ts";\n`);
    writer.write(`\n`);
    // writer.write(`// ${rs}\n`);
    writer.write(`export interface ${sd.decl.name}BaseVI<P, R> {\n`);
    newModuleVisitor<BaseVIPayload, void>().Decl(makeBaseVI(sd, baseVISig, false), sd.decl, { sd });
    writer.write(`}\n\n`);

    writer.write(`export interface ${sd.decl.name}ImplVI<P, R> {\n`);
    newModuleVisitor<BaseVIPayload, void>().Decl(makeBaseVI(sd, implVISig, true), sd.decl, { sd });
    writer.write(`}\n\n`);

    writer.write(`export function new${sd.decl.name}Visitor<P, R>(): ${sd.decl.name}BaseVI<P, R> {\n`);
    writer.write(`  const v: ${sd.decl.name}BaseVI<P, R> = {\n`);
    newModuleVisitor<BaseVIPayload, void>().Decl(makeBaseVI(sd, baseVistorImpl, false), sd.decl, { sd });
    writer.write(`  };\n`);
    writer.write(`  return v;\n`);
    writer.write(`}\n\n`);
  });

  await writer.close();
}



export interface ModuleBaseVI<P, R> {
  Module: (impl: ModuleImplVI<P, R>, m: adlast.Module, p: P) => R | void;
  Import: (impl: ModuleImplVI<P, R>, m: adlast.Import, p: P) => R | void;
  Decl: (impl: ModuleImplVI<P, R>, m: adlast.Decl, p: P) => R | void;
  Annotations: (impl: ModuleImplVI<P, R>, m: types.Map<adlast.ScopedName, {} | null>, p: P) => R | void;
  ScopedName: (impl: ModuleImplVI<P, R>, m: adlast.ScopedName, p: P) => R | void;
  DeclType: (impl: ModuleImplVI<P, R>, m: adlast.DeclType, p: P) => R | void;
  Field: (impl: ModuleImplVI<P, R>, m: adlast.Field, p: P) => R | void;
  TypeExpr: (impl: ModuleImplVI<P, R>, m: adlast.TypeExpr, p: P) => R | void;
  TypeRef: (impl: ModuleImplVI<P, R>, m: adlast.TypeRef, p: P) => R | void;
  TypeDef: (impl: ModuleImplVI<P, R>, m: adlast.TypeDef, p: P) => R | void;
  NewType: (impl: ModuleImplVI<P, R>, m: adlast.NewType, p: P) => R | void;
}

export type ModuleImplVI<P, R> = // Partial<DeclType_Branches<P, R>> & Partial<TypeRef_Branches<P, R>> & 
  {
    // export type ModuleImplVI<P, R> = Partial<DeclType_Branches<P, R>> & Partial<TypeRef_Branches<P, R>> & {
    Module?: (b: ModuleBaseVI<P, R>, m: adlast.Module, p: P) => R;
    Import?: (b: ModuleBaseVI<P, R>, m: adlast.Import, p: P) => R;
    Import_moduleName?: (b: ModuleBaseVI<P, R>, m: string, p: P) => R;
    Import_scopedName?: (b: ModuleBaseVI<P, R>, m: adlast.ScopedName, p: P) => R;
    Decl?: (b: ModuleBaseVI<P, R>, m: adlast.Decl, p: P) => R;
    Decl__stringmap?: (b: ModuleBaseVI<P, R>, k: string, m: adlast.Decl, p: P) => R;
    Annotations?: (b: ModuleBaseVI<P, R>, m: types.Map<adlast.ScopedName, {} | null>, p: P) => R | void;
    DeclType?: (b: ModuleBaseVI<P, R>, m: adlast.DeclType, p: P) => R;
    DeclType_struct_?: (b: ModuleBaseVI<P, R>, m: adlast.Struct, p: P) => R;
    DeclType_union_?: (b: ModuleBaseVI<P, R>, m: adlast.Union, p: P) => R;
    DeclType_type_?: (b: ModuleBaseVI<P, R>, m: adlast.TypeDef, p: P) => R;
    DeclType_newtype_?: (b: ModuleBaseVI<P, R>, m: adlast.NewType, p: P) => R;

    ScopedName?: (b: ModuleBaseVI<P, R>, m: adlast.ScopedName, p: P) => R;
    TypeRef?: (b: ModuleBaseVI<P, R>, m: adlast.TypeRef, p: P) => R;
    TypeRef_primitive?: (b: ModuleBaseVI<P, R>, m: string, p: P) => R;
    TypeRef_typeParam?: (b: ModuleBaseVI<P, R>, m: string, p: P) => R;
    TypeRef_reference?: (b: ModuleBaseVI<P, R>, m: adlast.ScopedName, p: P) => R;

    TypeExpr?: (b: ModuleBaseVI<P, R>, m: adlast.TypeExpr, p: P) => R;
    Field?: (b: ModuleBaseVI<P, R>, m: adlast.Field, p: P) => R;
    Struct?: (b: ModuleBaseVI<P, R>, m: adlast.Struct, p: P) => R;
    Union?: (b: ModuleBaseVI<P, R>, m: adlast.Union, p: P) => R;
    TypeDef?: (b: ModuleBaseVI<P, R>, m: adlast.TypeDef, p: P) => R;
    NewType?: (b: ModuleBaseVI<P, R>, m: adlast.NewType, p: P) => R;
  };

// export type DeclType_Branches<P, R> = {
//   DeclType_struct_: (b: ModuleBaseVI<P, R>, m: adlast.Struct, p: P) => R;
//   DeclType_union_: (b: ModuleBaseVI<P, R>, m: adlast.Union, p: P) => R;
//   DeclType_type_: (b: ModuleBaseVI<P, R>, m: adlast.TypeDef, p: P) => R;
//   DeclType_newtype_: (b: ModuleBaseVI<P, R>, m: adlast.NewType, p: P) => R;
// };

// export type TypeRef_Branches<P, R> = {
//   TypeRef_primitive: (b: ModuleBaseVI<P, R>, m: string, p: P) => R;
//   TypeRef_typeParam: (b: ModuleBaseVI<P, R>, m: string, p: P) => R;
//   TypeRef_reference: (b: ModuleBaseVI<P, R>, m: adlast.ScopedName, p: P) => R;
// };

export function newModuleVisitor<P, R>(): ModuleBaseVI<P, R> {
  const v: ModuleBaseVI<P, R> = {
    Module: function (impl: ModuleImplVI<P, R>, m: adlast.Module, p: P): void | R {
      if (impl.Module) return impl.Module(this, m, p);
      m.imports.forEach(el => this.Import(impl, el, p));
      Object.keys(m.decls).forEach(k => {
        const el = m.decls[k];
        impl.Decl__stringmap ? impl.Decl__stringmap(this, k, el, p) : this.Decl(impl, el, p);
      });
      this.Annotations(impl, m.annotations, p);
    },
    Import: function (impl: ModuleImplVI<P, R>, m: adlast.Import, p: P): void | R {
      if (impl.Import) return impl.Import(this, m, p);
      switch (m.kind) {
        case "moduleName":
          if (impl.Import_moduleName) return impl.Import_moduleName(this, m.value, p);
          return;
        case "scopedName":
          if (impl.Import_scopedName) return impl.Import_scopedName(this, m.value, p);
          return;
      }
    },
    Decl: function (impl: ModuleImplVI<P, R>, m: adlast.Decl, p: P): void | R {
      if (impl.Decl) return impl.Decl(this, m, p);
      impl.DeclType ? impl.DeclType(this, m.type_, p) : this.DeclType(impl, m.type_, p);
      this.Annotations(impl, m.annotations, p);
    },
    Annotations(impl, m, p) {
      if (impl.Annotations) return impl.Annotations(this, m, p);
      return;
    },
    ScopedName: function (impl: ModuleImplVI<P, R>, m: adlast.ScopedName, p: P): void | R {
      if (impl.ScopedName) return impl.ScopedName(this, m, p);
      return;
    },
    DeclType: function (impl: ModuleImplVI<P, R>, m: adlast.DeclType, p: P): void | R {
      if (impl.DeclType) return impl.DeclType(this, m, p);
      switch (m.kind) {
        case "struct_":
          if (impl.DeclType_struct_) return impl.DeclType_struct_(this, m.value, p);
          return;
        case "union_":
          if (impl.DeclType_union_) return impl.DeclType_union_(this, m.value, p);
          return;
        case "type_":
          if (impl.DeclType_type_) return impl.DeclType_type_(this, m.value, p);
          return;
        case "newtype_":
          if (impl.DeclType_newtype_) return impl.DeclType_newtype_(this, m.value, p);
          return;
      }
    },
    Field: function (impl: ModuleImplVI<P, R>, m: adlast.Field, p: P): void | R {
      if (impl.Field) return impl.Field(this, m, p);
      this.TypeExpr(impl, m.typeExpr, p);
      this.Annotations(impl, m.annotations, p);
    },
    TypeExpr: function (impl: ModuleImplVI<P, R>, m: adlast.TypeExpr, p: P): void | R {
      if (impl.TypeExpr) return impl.TypeExpr(this, m, p);
      this.TypeRef(impl, m.typeRef, p);
      m.parameters.forEach(el => this.TypeExpr(impl, el, p));
    },
    TypeRef: function (impl: ModuleImplVI<P, R>, m: adlast.TypeRef, p: P): void | R {
      if (impl.TypeRef) return impl.TypeRef(this, m, p);
      switch (m.kind) {
        case "primitive":
          if (impl.TypeRef_primitive) return impl.TypeRef_primitive(this, m.value, p);
          return;
        case "typeParam":
          if (impl.TypeRef_typeParam) return impl.TypeRef_typeParam(this, m.value, p);
          return;
        case "reference":
          if (impl.TypeRef_reference) return impl.TypeRef_reference(this, m.value, p);
          return;
      }
    },
    TypeDef: function (impl: ModuleImplVI<P, R>, m: adlast.TypeDef, p: P): void | R {
      if (impl.TypeDef) return impl.TypeDef(this, m, p);
      this.TypeExpr(impl, m.typeExpr, p);
    },
    NewType: function (impl: ModuleImplVI<P, R>, m: adlast.NewType, p: P): void | R {
      if (impl.NewType) return impl.NewType(this, m, p);
      this.TypeExpr(impl, m.typeExpr, p);
    }
  };
  return v;
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
      return `${typeExpr.typeRef.value.moduleName.replaceAll(".", "_")}.${typeExpr.typeRef.value.name}`;
    case "typeParam":
      throw new Error('Not implemented???');
  }
}