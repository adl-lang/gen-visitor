import { adlast, types } from "./deps.ts";

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