////////////////////////////////////////////////////////////////////////////
//
// Copyright 2021 Realm Inc.
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

#pragma once

#include <functional>
#include <map>
#include <regex>

#include "dictionary/collection/collection.hpp"
#include "common/js_plain_object.hpp"
#include "methods/accessors.hpp"
#include "methods/static_functions.hpp"
#include "realm/object-store/dictionary.hpp"

namespace realm {
namespace js {

template <typename T>
class DictionaryAdapter {
   private:
    using ValueType = typename T::Value;
    using Context = typename T::Context;
    using Dictionary = CollectionAdapter<T, object_store::Dictionary>;
    using GetterSetters = AccessorsConfiguration<T, IOCollectionAccessor>;
    using Methods = ListenersMethodsForDictionary<T>;
    using JSDictionary =
        JSObject<T, GetterSetters, DictionaryNotifications, Methods, Dictionary>;

   public:
    ValueType wrap(Context context, object_store::Dictionary dictionary) {
        auto *js_dictionary = new JSDictionary{context, dictionary};
        auto value = js_dictionary->build();

        js_dictionary->setup_finalizer(value, [=]() {
            delete js_dictionary;
        });

        return value;
    }
};

}  // namespace js
}  // namespace realm

