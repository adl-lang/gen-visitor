import * as sys_adlast from "https://deno.land/x/adllang_tsdeno@v0.6/adl-gen/sys/adlast.ts";
import * as sys_types from "https://deno.land/x/adllang_tsdeno@v0.6/adl-gen/sys/types.ts";

export interface ModuleBaseVI<P, R> {
  Module: (impl: ModuleImplVI<P, R>, m: sys_adlast.Module, p: P) => R | void; // 1
  Import: (impl: ModuleImplVI<P, R>, m: sys_adlast.Import, p: P) => R | void; // 2
  ScopedName: (impl: ModuleImplVI<P, R>, m: sys_adlast.ScopedName, p: P) => R | void; // 1
  Decl: (impl: ModuleImplVI<P, R>, m: sys_adlast.Decl, p: P) => R | void; // 1
  Maybe__number: (impl: ModuleImplVI<P, R>, m: sys_types.Maybe<number>, p: P) => R | void; // 2
  DeclType: (impl: ModuleImplVI<P, R>, m: sys_adlast.DeclType, p: P) => R | void; // 2
  Struct: (impl: ModuleImplVI<P, R>, m: sys_adlast.Struct, p: P) => R | void; // 1
  Field: (impl: ModuleImplVI<P, R>, m: sys_adlast.Field, p: P) => R | void; // 1
  TypeExpr: (impl: ModuleImplVI<P, R>, m: sys_adlast.TypeExpr, p: P) => R | void; // 1
  TypeRef: (impl: ModuleImplVI<P, R>, m: sys_adlast.TypeRef, p: P) => R | void; // 2
  Maybe__any: (impl: ModuleImplVI<P, R>, m: sys_types.Maybe<any>, p: P) => R | void; // 2
  Annotations: (impl: ModuleImplVI<P, R>, m: sys_types.Map<sys_adlast.ScopedName, any>, p: P) => R | void; // 4
  Union: (impl: ModuleImplVI<P, R>, m: sys_adlast.Union, p: P) => R | void; // 1
  TypeDef: (impl: ModuleImplVI<P, R>, m: sys_adlast.TypeDef, p: P) => R | void; // 1
  NewType: (impl: ModuleImplVI<P, R>, m: sys_adlast.NewType, p: P) => R | void; // 1
}

export interface ModuleImplVI<P, R> {
  Module?: (b: ModuleBaseVI<P, R>, m: sys_adlast.Module, p: P) => R; // 1
  Import?: (b: ModuleBaseVI<P, R>, m: sys_adlast.Import, p: P) => R; // 2
  Import_moduleName?: (b: ModuleBaseVI<P, R>, m: sys_adlast.ModuleName, p: P) => R; // 3
  Import_scopedName?: (b: ModuleBaseVI<P, R>, m: sys_adlast.ScopedName, p: P) => R; // 3
  ScopedName?: (b: ModuleBaseVI<P, R>, m: sys_adlast.ScopedName, p: P) => R; // 1
  Decl?: (b: ModuleBaseVI<P, R>, m: sys_adlast.Decl, p: P) => R; // 1
  Maybe__number?: (b: ModuleBaseVI<P, R>, m: sys_types.Maybe<number>, p: P) => R; // 2
  Maybe__number_nothing?: (b: ModuleBaseVI<P, R>, m: void, p: P) => R; // 3
  Maybe__number_just?: (b: ModuleBaseVI<P, R>, m: number, p: P) => R; // 3
  DeclType?: (b: ModuleBaseVI<P, R>, m: sys_adlast.DeclType, p: P) => R; // 2
  DeclType_struct_?: (b: ModuleBaseVI<P, R>, m: sys_adlast.Struct, p: P) => R; // 3
  DeclType_union_?: (b: ModuleBaseVI<P, R>, m: sys_adlast.Union, p: P) => R; // 3
  DeclType_type_?: (b: ModuleBaseVI<P, R>, m: sys_adlast.TypeDef, p: P) => R; // 3
  DeclType_newtype_?: (b: ModuleBaseVI<P, R>, m: sys_adlast.NewType, p: P) => R; // 3
  Struct?: (b: ModuleBaseVI<P, R>, m: sys_adlast.Struct, p: P) => R; // 1
  Field?: (b: ModuleBaseVI<P, R>, m: sys_adlast.Field, p: P) => R; // 1
  TypeExpr?: (b: ModuleBaseVI<P, R>, m: sys_adlast.TypeExpr, p: P) => R; // 1
  TypeRef?: (b: ModuleBaseVI<P, R>, m: sys_adlast.TypeRef, p: P) => R; // 2
  TypeRef_primitive?: (b: ModuleBaseVI<P, R>, m: sys_adlast.Ident, p: P) => R; // 3
  TypeRef_typeParam?: (b: ModuleBaseVI<P, R>, m: sys_adlast.Ident, p: P) => R; // 3
  TypeRef_reference?: (b: ModuleBaseVI<P, R>, m: sys_adlast.ScopedName, p: P) => R; // 3
  Maybe__any?: (b: ModuleBaseVI<P, R>, m: sys_types.Maybe<any>, p: P) => R; // 2
  Maybe__any_nothing?: (b: ModuleBaseVI<P, R>, m: void, p: P) => R; // 3
  Maybe__any_just?: (b: ModuleBaseVI<P, R>, m: any, p: P) => R; // 3
  Annotations?: (b: ModuleBaseVI<P, R>, m: sys_types.Map<sys_adlast.ScopedName, any>, p: P) => R; // 4
  Union?: (b: ModuleBaseVI<P, R>, m: sys_adlast.Union, p: P) => R; // 1
  TypeDef?: (b: ModuleBaseVI<P, R>, m: sys_adlast.TypeDef, p: P) => R; // 1
  NewType?: (b: ModuleBaseVI<P, R>, m: sys_adlast.NewType, p: P) => R; // 1
  // TODO ??__stringmap decls 1
}

export function newModuleVisitor<P, R>(): ModuleBaseVI<P, R> {
  const v: ModuleBaseVI<P, R> = {
    Module: function (impl: ModuleImplVI<P, R>, m: sys_adlast.Module, p: P): (R | void) { // 1
      if (impl.Module) return impl.Module(this, m, p);
      m.imports.forEach(el => this.Import(impl, el, p)); // 5
      // TODO ??__stringmap decls
    },
    Import: function (impl: ModuleImplVI<P, R>, m: sys_adlast.Import, p: P): (R | void) { // 2
      if (impl.Import) return impl.Import(this, m, p);
      switch (m.kind) {
      case "moduleName":
        if (impl.Import_moduleName) return impl.Import_moduleName(this, m.value, p)
        return
      case "scopedName":
        if (impl.Import_scopedName) return impl.Import_scopedName(this, m.value, p)
        return
      }
    },
    ScopedName: function (impl: ModuleImplVI<P, R>, m: sys_adlast.ScopedName, p: P): (R | void) { // 1
      if (impl.ScopedName) return impl.ScopedName(this, m, p);
    },
    Decl: function (impl: ModuleImplVI<P, R>, m: sys_adlast.Decl, p: P): (R | void) { // 1
      if (impl.Decl) return impl.Decl(this, m, p);
      this.Maybe__number(impl, m.version, p); // 8
      this.DeclType(impl, m.type_, p); // 7
    },
    Maybe__number: function (impl: ModuleImplVI<P, R>, m: sys_types.Maybe<number>, p: P): (R | void) { // 2
      if (impl.Maybe__number) return impl.Maybe__number(this, m, p);
      switch (m.kind) {
      case "nothing":
        if (impl.Maybe__number_nothing) return impl.Maybe__number_nothing(this, undefined, p)
        return
      case "just":
        if (impl.Maybe__number_just) return impl.Maybe__number_just(this, m.value, p)
        return
      }
    },
    DeclType: function (impl: ModuleImplVI<P, R>, m: sys_adlast.DeclType, p: P): (R | void) { // 2
      if (impl.DeclType) return impl.DeclType(this, m, p);
      switch (m.kind) {
      case "struct_":
        if (impl.DeclType_struct_) return impl.DeclType_struct_(this, m.value, p)
        return
      case "union_":
        if (impl.DeclType_union_) return impl.DeclType_union_(this, m.value, p)
        return
      case "type_":
        if (impl.DeclType_type_) return impl.DeclType_type_(this, m.value, p)
        return
      case "newtype_":
        if (impl.DeclType_newtype_) return impl.DeclType_newtype_(this, m.value, p)
        return
      }
    },
    Struct: function (impl: ModuleImplVI<P, R>, m: sys_adlast.Struct, p: P): (R | void) { // 1
      if (impl.Struct) return impl.Struct(this, m, p);
      m.fields.forEach(el => this.Field(impl, el, p)); // 5
    },
    Field: function (impl: ModuleImplVI<P, R>, m: sys_adlast.Field, p: P): (R | void) { // 1
      if (impl.Field) return impl.Field(this, m, p);
      this.TypeExpr(impl, m.typeExpr, p); // 7
      this.Maybe__any(impl, m.default, p); // 8
    },
    TypeExpr: function (impl: ModuleImplVI<P, R>, m: sys_adlast.TypeExpr, p: P): (R | void) { // 1
      if (impl.TypeExpr) return impl.TypeExpr(this, m, p);
      this.TypeRef(impl, m.typeRef, p); // 7
      m.parameters.forEach(el => this.TypeExpr(impl, el, p)); // 5
    },
    TypeRef: function (impl: ModuleImplVI<P, R>, m: sys_adlast.TypeRef, p: P): (R | void) { // 2
      if (impl.TypeRef) return impl.TypeRef(this, m, p);
      switch (m.kind) {
      case "primitive":
        if (impl.TypeRef_primitive) return impl.TypeRef_primitive(this, m.value, p)
        return
      case "typeParam":
        if (impl.TypeRef_typeParam) return impl.TypeRef_typeParam(this, m.value, p)
        return
      case "reference":
        if (impl.TypeRef_reference) return impl.TypeRef_reference(this, m.value, p)
        return
      }
    },
    Maybe__any: function (impl: ModuleImplVI<P, R>, m: sys_types.Maybe<any>, p: P): (R | void) { // 2
      if (impl.Maybe__any) return impl.Maybe__any(this, m, p);
      switch (m.kind) {
      case "nothing":
        if (impl.Maybe__any_nothing) return impl.Maybe__any_nothing(this, undefined, p)
        return
      case "just":
        if (impl.Maybe__any_just) return impl.Maybe__any_just(this, m.value, p)
        return
      }
    },
    Annotations: function (impl: ModuleImplVI<P, R>, m: sys_types.Map<sys_adlast.ScopedName, any>, p: P): (R | void) { // 4
      if (impl.Annotations) return impl.Annotations(this, m, p);
    },
    Union: function (impl: ModuleImplVI<P, R>, m: sys_adlast.Union, p: P): (R | void) { // 1
      if (impl.Union) return impl.Union(this, m, p);
      m.fields.forEach(el => this.Field(impl, el, p)); // 5
    },
    TypeDef: function (impl: ModuleImplVI<P, R>, m: sys_adlast.TypeDef, p: P): (R | void) { // 1
      if (impl.TypeDef) return impl.TypeDef(this, m, p);
      this.TypeExpr(impl, m.typeExpr, p); // 7
    },
    NewType: function (impl: ModuleImplVI<P, R>, m: sys_adlast.NewType, p: P): (R | void) { // 1
      if (impl.NewType) return impl.NewType(this, m, p);
      this.TypeExpr(impl, m.typeExpr, p); // 7
      this.Maybe__any(impl, m.default, p); // 8
    },
  };
  return v;
}

