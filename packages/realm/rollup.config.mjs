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

import typescript from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";
import dts from "rollup-plugin-dts";

import pkg from "./package.json" assert { type: "json" };

export default [
  {
    input: "src/node/index.ts",
    output: {
      file: pkg.main,
      format: "cjs",
      sourcemap: true,
    },
    plugins: [
      replace({
        preventAssignment: true,
        delimiters: ["", ""],
        values: {
          '"./realm.node"': '"../generated/ts/realm.node"',
        },
      }),
      typescript({
        tsconfig: "tsconfig.node.json",
      }),
    ],
    external: ["node:module", "node:fs", "undici", "bson", "debug", "react-native"],
  },
  {
    input: "src/react-native/index.ts",
    output: {
      file: pkg["react-native"],
      format: "es",
      sourcemap: true,
    },
    plugins: [
      replace({
        preventAssignment: true,
        delimiters: ["", ""],
        values: {
          '"../generated/ts/native.mjs"': '"../generated/ts/native-rn.mjs"',
        },
      }),
      typescript({
        tsconfig: "tsconfig.react-native.json",
      }),
    ],
    external: ["bson", "debug", "react-native"],
  },
  {
    input: "src/index.ts",
    output: {
      file: pkg.types,
      format: "es",
    },
    plugins: [
      dts({
        respectExternal: true,
        compilerOptions: {
          stripInternal: true,
          noResolve: false,
        },
      }),
    ],
    external: ["bson"],
  },
];
