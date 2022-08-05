////////////////////////////////////////////////////////////////////////////
//
// Copyright 2022 Realm Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
////////////////////////////////////////////////////////////////////////////

import { camelCase } from "change-case";

import { TemplateContext } from "../context";
import { Arg, bindModel, BoundSpec, Type } from "../bound_model";

const PRIMITIVES_MAPPING: Record<string, string> = {
  void: "void",
  bool: "boolean",
  int: "number",
  double: "number",
  float: "number",
  int64_t: "bigint",
  int32_t: "number",
  uint64_t: "bigint",
  "std::string": "string",
  StringData: "string",
  BinaryData: "ArrayBuffer",
  OwnedBinaryData: "ArrayBuffer",
};

const TEMPLATE_MAPPING: Record<string, (...args: string[]) => string> = {
  "std::vector": (arg) => `${arg}[]`,
  "util::Optional": (arg) => `(${arg} | null)`,
  "std::shared_ptr": (arg) => arg,
};

const enum Kind {
  Arg, // JS -> CPP
  Ret, // Cpp -> JS
}

function generateType(spec: BoundSpec, type: Type, kind: Kind): string {
  switch(type.kind) {
    case "Pointer":
    case "Ref":
      // No impact on JS semantics.
      return generateType(spec, type.type, kind)

    case "Const": return `Readonly<${generateType(spec, type.type, kind)}>`

    case "Opaque":
    case "Enum":
    case "Class":
      return type.name;

    case "Struct":
      return kind == Kind.Arg ? type.name : `DeepRequired<${type.name}>`

    case "Primitive":
      return PRIMITIVES_MAPPING[type.name];

    case "Template": 
      return TEMPLATE_MAPPING[type.name](...type.args.map(arg => generateType(spec, arg, kind)));

    case "Func": 
      // When a js function is passed to cpp, its arguments behave like Ret and its return value behaves like Arg.
      const Arg = kind == Kind.Arg ? Kind.Ret : Kind.Arg;
      const Ret = kind == Kind.Arg ? Kind.Arg : Kind.Ret;

      const args =  type.args.map((arg) => arg.name + ": " + generateType(spec, arg.type, Arg))
      return `((${args.join(', ')}) => ${generateType(spec, type.ret, Ret)})`;
  }
}

function generateArguments(spec: BoundSpec, args: Arg[]) {
  return args.map((arg) => `${arg.name}: ${generateType(spec, arg.type, Kind.Arg)}`).join(", ");
}

export function generateTypeScript({ spec: rawSpec, file }: TemplateContext): void {
  // Check the support for primitives used
  for (const primitive of rawSpec.primitives) {
    if (!Object.keys(PRIMITIVES_MAPPING).includes(primitive)) {
      console.warn(`Spec declares an unsupported primitive: "${primitive}"`);
    }
  }

  // Check the support for template instances used
  for (const template of rawSpec.templates) {
    if (!Object.keys(TEMPLATE_MAPPING).includes(template)) {
      console.warn(`Spec declares an unsupported template instance: "${template}"`);
    }
  }

  let spec = bindModel(rawSpec)

  const enumsOut = file("enums.ts", "eslint", "typescript-checker");
  enumsOut("// This file is generated: Update the spec instead of editing this file directly");

  enumsOut("// Enums");
  for (const e of spec.enums) {
    // Using const enum to avoid having to emit JS backing these
    enumsOut(`export const enum ${e.name} {`);
    enumsOut(...e.enumerators.map(({name, value}) => `${name} = ${value},\n`));
    enumsOut("};");
  }

  const js = file("native.js", "eslint");
  js("// This file is generated: Update the spec instead of editing this file directly");
  js("import bindings from 'bindings';")

  const out = file("native.d.ts", "eslint", "typescript-checker");
  out("// This file is generated: Update the spec instead of editing this file directly");

  out("import {", spec.enums.map(e => e.name).join(", "), '} from "./enums";');
  out('export * from "./enums";');
  js('export * from "./enums";');

  out('// Utilities')
  out(`type DeepRequired<T> = 
          T extends CallableFunction ? T :
          T extends object ? {[K in keyof T]-? : DeepRequired<T[K]>} :
          T;`)

  out("// Opaque types");
  for (const {name} of spec.opaqueTypes) {
    out.lines("/** Using an empty enum to express a nominal type */", `export declare enum ${name} {}`);
  }

  out("// Records");
  for (const rec of spec.records) {
    out(`export type ${rec.name} = {`);
    for (const field of rec.fields) {
      // Using Kind.Arg here because when a Record is used as a Ret, it will be "fixed" to behave like one.
      out(camelCase(field.name), field.required ? "" : "?", ": ", generateType(spec, field.type, Kind.Arg), ";");
    }
    out(`}`);
  }

  out("// Classes");
  for (const cls of spec.classes) {
    js(`export const {${cls.name}} = bindings("realm.node");`)
    out(`export class ${cls.name} {`);
    out(`private constructor();`);
    for (const [name, type] of Object.entries(cls.properties)) {
      out(camelCase(name), ': ', generateType(spec, type, Kind.Ret));
    }
    for (const meth of cls.staticMethods) {
      out(
        "static",
        camelCase(meth.unique_name),
        "(",
        generateArguments(spec, meth.sig.args),
        "):",
        generateType(spec, meth.sig.ret, Kind.Ret),
        ";",
      );
    }
    for (const meth of cls.methods) {
      out(
        camelCase(meth.unique_name),
        "(",
        generateArguments(spec, meth.sig.args),
        "):",
        generateType(spec, meth.sig.ret, Kind.Ret),
        ";",
      );
    }
    if (cls.iterable) {
      out(`[Symbol.iterator](): Iterator<${generateType(spec, cls.iterable, Kind.Ret)}>;`);
    }
    out(`}`);
  }
}