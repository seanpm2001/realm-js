# Realm Babel Plugin

## Introduction

The Realm Babel Plugin enables you to define your Realm models using standard Typescript syntax – no need to define a separate schema.

<table>
<tr>
<th>Before</th>
<th>After</th>
</tr>
<tr>
<td width="50%" valign="top">

```ts
export class Task extends Realm.Object {
  _id!: Realm.BSON.ObjectId;
  description!: string;
  isComplete!: boolean;

  static schema = {
    name: "Task",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      description: "string",
      isComplete: {
        type: "bool",
        default: false,
        indexed: true,
      },
    },
  };
}
```

</td>
<td width="50%" valign="top">

```ts
export class Task extends Realm.Object {
  _id!: Realm.BSON.ObjectId;
  description!: string;
  @index
  isComplete = false;

  static primaryKey = "_id";
}
```

</code>
</td>
</tr>
</table>

## Features

- Schema properties can be defined as class properties by using standard TypeScript types or specific `Realm.Types` types, supporting every Realm type
- Support for default values using property initialiser syntax
- Support for specifying additional schema properties (e.g. primary key) using class statics
- Support for indexing and remapping fields using decorators

## Installation

1. Install the `@realm/babel-plugin` npm package:

   `npm install --save-dev @realm/babel-plugin`

2. If you don't already have it installed, install the `@babel/plugin-proposal-decorators` (only required if you need to use the `@index` or `@mapTo` decorators):

   `npm install --save-dev @babel/plugin-proposal-decorators`

   and enable decorators in your `tsconfig.json` by adding: `"experimentalDecorators": true` to the `compilerOptions`.

3. Update your project's `babel.config.js` to load these two plugins:

   ```js
   // Existing babel.config.js content is commented out
   // module.exports = {
     // presets: ['module:metro-react-native-babel-preset'],

     // --------------------------
     // Add the following plugins:
     plugins: [
       '@realm/babel-plugin',
       ['@babel/plugin-proposal-decorators', { legacy: true }],
     ],
     // --------------------------
   // };

   ```

4. If using React Native, you may need to clear your packager cache for it to pick up the new plugins:

   `npm start -- --reset-cache`

## Usage

### Defining model properties

To define your Realm models when using this plugin, simply create classes which extend `Realm.Object`, and define the model's properties using either supported TypeScript types or `Realm.Types` types (see [supported types](#supported-types)). It is recommended that you use the non-null assertion operator (`!`) after the property name, to tell TypeScript that the property will definitely have a value.

```ts
import Realm from "realm";

export class Task extends Realm.Object {
  _id!: Realm.BSON.ObjectId;
  description!: string;
  isComplete!: boolean;
  count!: Realm.Types.Int;
}
```

You can also import `Object` and `Types` directly from `realm`:

```ts
import { Object, Types, BSON } from "realm";

export class Task extends Object {
  _id!: BSON.ObjectId;
  description!: string;
  isComplete!: boolean;
  count!: Types.Int;
}
```

#### Supported types

This plugin supports standard TypeScript types wherever possible, to make defining your model as natural as possible. Some Realm types do not have a direct TypeScript equivalent, or can have more nuance than TypeScript supports (e.g. `double`, `int` and `float` are all represented by `number` in TypeScript), so in these cases you should use the types provided by `Realm.Types` – you can also exclusively use types from `Realm.Types` if preferred. Some Realm types are already exported from the `Realm` namespace and are re-exported by `Realm.Types`, so you can use either variant.

The supported types are shown in the table below. See [the Realm documentation](https://www.mongodb.com/docs/realm/sdk/react-native/data-types/field-types/) and [SDK documentation](https://www.mongodb.com/docs/realm-sdks/js/latest/Realm.html#~PropertyType) for more details on each type.

| Realm.Types type                             | Realm schema type | TypeScript type | Realm type              | Notes                                                                                  |
| -------------------------------------------- | ----------------- | --------------- | ----------------------- | -------------------------------------------------------------------------------------- |
| `Types.Bool`                                 | `bool`            | `boolean`       |                         |                                                                                        |
| `Types.String`                               | `string`          | `string`        |                         |                                                                                        |
| `Types.Int`                                  | `int`             | `number`        |                         |                                                                                        |
| `Types.Float`                                | `float`           | `number`        |                         |                                                                                        |
| `Types.Double`                               | `double`          | `number`        |                         |                                                                                        |
| `Types.Decimal128`                           | `decimal128`      |                 | `Realm.BSON.Decimal128` |                                                                                        |
| `Types.ObjectId`                             | `objectId`        |                 | `Realm.BSON.UUID`       |                                                                                        |
| `Types.UUID`                                 | `uuid`            |                 |                         |                                                                                        |
| `Types.Date`                                 | `date`            | `Date`          |                         |                                                                                        |
| `Types.Data`                                 | `data`            | `ArrayBuffer`   |                         |                                                                                        |
| `Types.List<T>`                              | `type[]`          |                 | `Realm.List<T>`         | `T` is the type of objects in the list                                                 |
| `Types.Set<T>`                               | `type<>`          |                 | `Realm.Set<T>`          | `T` is the type of objects in the set                                                  |
| `Types.Dictionary<T>`                        | `type{}`          |                 | `Realm.Dictionary<T>`   | `T` is the type of objects in the dictionary                                           |
| `Types.Mixed`                                | `mixed`           | `unknown`       | `Realm.Mixed`           |                                                                                        |
| <code>Types.LinkingObjects<T,&nbsp;N></code> | `linkingObjects`  |                 |                         | `T` is the type of objects, `N` is the property name of the relationship (as a string) |

### Specifying schema properties as `static`s

Additional schema properties can be specified by adding `static` properties to your class, as shown in the table below. See [the Realm documentation](https://www.mongodb.com/docs/realm/sdk/node/examples/define-a-realm-object-model/) for more details.

| Static property | Type      | Notes                                                                      |
| --------------- | --------- | -------------------------------------------------------------------------- |
| `name`          | `string`  | Specifies the name of the Realm schema. Defaults to your class name.       |
| `primaryKey`    | `string`  | Specifies the name of a property to be used as the primary key.            |
| `embedded`      | `boolean` | Specifies this is an embedded schema.                                      |
| `asymmetric`    | `boolean` | Specifies this schema should sync unidirectionally if using flexible sync. |

For example:

```ts
import Realm from "realm";

export class Task extends Realm.Object {
  _id!: Realm.BSON.ObjectId;
  description!: string;
  isComplete = false;

  static primaryKey = "_id";
}
```

### Using decorators to index and remap properties

The `@realm/babel-plugin` package exports decorators to allow you to specify certain properties should be indexed (using the `@index` decorators) or should remap to a Realm schema property with a different name (using the `@mapTo` decorator). To learn more about this functionality, see [the documentation](https://www.mongodb.com/docs/realm/sdk/react-native/examples/define-a-realm-object-model/#index-a-property).

Note that use of decorators requires using the `@babel/plugin-proposal-decorators` plugin and for `experimentalDecorators` to be enabled in your `tsconfig.json`. There is currently no way to specifying properties to be indexed or remapped without using decorators.

This table shows the available decorators:

| Decorator | Parameters                    | Notes                                                                                                |
| --------- | ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `index`   | none                          | Specifies that the decorated property should be indexed by Realm.                                    |
| `mapTo`   | `(realmPropertyName: string)` | Specifies that the decorated property should be stored as `realmPropertyName` in the Realm database. |

The example below shows both decorators in use:

```ts
import Realm from "realm";
import { mapTo, index } from "@realm/babel-plugin";

export class Task extends Realm.Object {
  _id!: Realm.BSON.ObjectId;
  // Add an index to the `description` property
  @index
  description!: string;
  // Specify that the `isComplete` property should be stored as `complete` in the Realm database
  @mapTo("complete")
  isComplete = false;
}
```

### Full example

The following code shows an example of all types, schema properties and decorators in use:

## Restrictions

### All class properties will be added to the Realm schema

There is currently no way to specify a property on your class which should not be persisted to the Realm .

### Classes extending Realm.Object cannot be constructed with `new`

This plugin does not change the behaviour of `Realm.Object`, which cannot be constructed using `new`. Instead, you may wish to add a `static` `generate` method to your class which returns an object representing the new instance, as shown in our [example app](https://github.com/realm/realm-js/blob/master/example/app/models/Task.ts).