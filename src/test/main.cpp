#define CATCH_CONFIG_MAIN
#include <vector>

#include "catch_amalgamated.hpp"
#include "common/object/jsc_object.hpp"
#include "logger.hpp"
#include "test_bed.hpp"

using Catch::Matchers::Contains;
using namespace std;

struct T1 {
    static void method(JSContextRef& context, JSValueRef value,
                       ObjectObserver* observer) {
        SECTION("Method should receive a boolean") {
            REQUIRE(true == JSValueIsBoolean(context, value));
        }
    }
};

TEST_CASE("Testing Logger#get_level") {
    REQUIRE(realm::common::logger::Logger::get_level("all") ==
            realm::common::logger::LoggerLevel::all);
    REQUIRE(realm::common::logger::Logger::get_level("debug") ==
            realm::common::logger::LoggerLevel::debug);
    REQUIRE_THROWS_WITH(realm::common::logger::Logger::get_level("coffeebabe"),
                        "Bad log level");
}

JSValueRef Test(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject,
                size_t argumentCount, const JSValueRef arguments[],
                JSValueRef* exception) {
    SECTION("An object should be created, should have a method hello.") {
        auto accessor_name = JSC_VM::s("X");
        auto method_name = JSC_VM::s("hello");

        auto obj = (JSObjectRef)arguments[0];

        bool is_obj = JSValueIsObject(ctx, arguments[0]);
        bool has_method = JSObjectHasProperty(ctx, obj, method_name);
        bool has_accessor = JSObjectHasProperty(ctx, obj, accessor_name);

        REQUIRE(is_obj == true);
        REQUIRE(has_accessor == true);
        REQUIRE(has_method == true);
    }

    return JSValueMakeUndefined(ctx);
}

/*
    test_accessor(obj, key, number)
    example:

    test_accessor(dictionary, 'X', 666)  // Will look for the field X and 666.
 */
JSValueRef GetterSetter(JSContextRef ctx, JSObjectRef function,
                        JSObjectRef thisObject, size_t argumentCount,
                        const JSValueRef arguments[], JSValueRef* exception) {
    SECTION("Testing object accessors for X value..") {
        auto accessor_name = JSC_VM::s("X");
        REQUIRE(true == JSValueIsObject(ctx, arguments[0]));

        auto obj = (JSObjectRef)arguments[0];
        REQUIRE(true ==
                JSObjectHasProperty(ctx, obj, (JSStringRef)arguments[1]));

        JSValueRef v = JSObjectGetProperty(ctx, obj, accessor_name, NULL);
        REQUIRE(true == JSValueIsNumber(ctx, v));
        double _v = JSValueToNumber(ctx, v, NULL);
        double _match = JSValueToNumber(ctx, arguments[2], NULL);
        REQUIRE(_match == _v);
    }

    return JSValueMakeUndefined(ctx);
}

TEST_CASE("Testing Object creation on JavascriptCore.") {
    JSC_VM jsc_vm;

    jsc_vm.make_gbl_fn("test", &Test);
    jsc_vm.make_gbl_fn("test_accessor", &GetterSetter);

    /*
     *  JavascriptObject Instantiation and configuration into JSC.
     */

    string NAME = "dictionary";
    JSStringRef str_dict = jsc_vm.str("dictionary");
    realm::common::JavascriptObject _dict{jsc_vm.globalContext, NAME};

    _dict.template add_accessor<AccessorsTest<int>>("X", 666);
    _dict.template add_method<int, T1::method>("hello", new int{5});
    _dict.template add_method<int, T1::method>("alo", new int{5});

    // set property of global object
    jsc_vm.set_obj_prop(str_dict, _dict.get_object());

    /*
     *
     *  Running a script on the VM.
     *
     *  First we check the object with properties and methods are constructed
     *
     *   test(dictionary)
     *
     *  To test that we added hello method we send a boolean and we check it
     *  above using T1 struct.
     *
     *  dictionary.hello(true)
     *
     */
    jsc_vm.load_into_vm("./jsc_object.js");
}
