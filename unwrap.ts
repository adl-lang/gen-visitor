import { utils, adlast, types, utils_adl } from "./deps.ts";

import { ModuleBaseVI, ModuleImplVI, newModuleVisitor } from "./visitor.ts";


type Payload = {
};
type Result = adlast.ScopedDecl | void;

type Visitor = Required<Pick<ModuleImplVI<Payload, Result>, "TypeExpr">>;
export const makeUnwrapVisitor = (declMap: Record<string, adlast.ScopedDecl>): Visitor => {
  const trV = newModuleVisitor<Payload0, Result>()
  const vV = newModuleVisitor<Payload, Result>()

  type Payload0 = {params: adlast.TypeExpr[]}
  const tr: Required<Pick<ModuleImplVI<Payload0, Result>, "TypeRef_primitive" | "TypeRef_reference" | "TypeRef_typeParam">> = {
    TypeRef_primitive (b, m, p) {
      switch(m) {
        case "Vector":
        case "StringMap":
        case "Nullable":
          return vV.TypeExpr(v, p.params[0], {})
        default:
          return undefined
      }
    },
    TypeRef_typeParam (b, m, p) {
      throw new Error("Function not implemented.");
    },
    TypeRef_reference (b, m, p) {
      const sd = declMap[`${m.moduleName}.${m.name}`]
      switch ( sd.decl.type_.kind ) {
        case "struct_":
        case "union_":
        case "newtype_":
          return sd
        case "type_":
          return b.TypeRef(this, sd.decl.type_.value.typeExpr.typeRef, {params: sd.decl.type_.value.typeExpr.parameters})
          // return vV.DeclType(v, sd.decl.type_, {})
          // const sd0 = declMap[`${sd.decl.type_.value.typeExpr.}.${m.name}`]
      }
    }
  }

  const v: Visitor = {
    TypeExpr(b, m, p) {
      return trV.TypeRef(tr, m.typeRef, {params: m.parameters})
    },
  }

  return v;
};