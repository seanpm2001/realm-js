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
#include "realm/dictionary.hpp"
#include "dictionary/collection/collection.hpp"

namespace realm {
namespace js {


struct IOCollectionAccessor {
    IOCollection* dictionary;

    template <typename ContextType>
    auto get(ContextType context, std::string key_name) {
        return dictionary->get(context, key_name);
    }

    template <typename ContextType, typename ValueType>
    auto set(ContextType context, std::string key_name, ValueType value) {
        dictionary->set(context, key_name, value);
    }
};
}  // namespace js
}  // namespace realm
