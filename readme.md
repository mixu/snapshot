# Snapshot

## Fairly robust Javascript variable/state/scope serialization

JSON allows you to store strings, numbers and booleans.

Snapshot allows you to also store Regexps, Dates, (potentially circular) references to other objects, non-native functions and custom classes that define a serialize()/deserialize() function.

The output is a self-contained, evaluable function rather than JSON. This makes it ideal for snapshotting the state of an application and sending that state elsewhere, e.g. to the client from a server.

For example:

    var snapshot = require('snapshot');

    // set up an object that contains a Date and Regexp
    var value = { a: { a: new Date() }, b: { b: /fo[o]+/} };
    // create a bunch of circular references between the objects
    value.a.sibling = value.b;
    value.b.sibling = value.a;
    value.a.parent = value;
    value.b.parent = value;

    var imploded = snapshot(value);

    // evaluate the resulting JS code
    var evaled = eval(imploded);
    // verify that the structure is the same, and
    // that the objects are instances of the right types
    assert.ok(evaled.a.sibling === evaled.b);
    assert.ok(evaled.b.sibling === evaled.a);
    assert.ok(evaled.a.parent === evaled);
    assert.ok(evaled.b.parent === evaled);
    assert.ok(evaled.a.a instanceof Date);
    assert.equal(evaled.a.a.getTime(), value.a.a.getTime());
    assert.ok(evaled.b.b instanceof RegExp);
    assert.equal(evaled.b.b.toString(), value.b.b.toString());

## Supported:

- Booleans
- Numbers
- Strings
- Dates
- Regular expressions
- Functions (except native functions which cannot be converted easily)
- null
- undefined
- object hashes consisting of any supported value
- arrays consisting of any supported value
- Instances of objects that define a serialize() and a deserialize() function

## Unsupported

- native functions (e.g. you cannot serialize a reference to Array.prototype.map)
- instances of objects that do not define a serialize() function (these will be serialized like object hashes, but they are not restored as instances of the right class)

## Installation

    npm install --save snapshot

(`--save` saves to the package.json file in the current directory, if it exists)

## API

- `.snapshot(hash)`: given a object hash, creates a string which is a standalone Javascript function that can be evaluated to produce the same objects with the right classes (as long as the definitions for custom objects are also available).

Note again, that the argument must be a single hash - but it can contain any data.

## Multiple references

For objects which are referred to more than once, if [reference1] === [reference2] during the serialization, then the object will be only instantiated once in the serialized output. The other references will reuse the same instance.

## Circular structures

Circular structures can be serialized and deserialized. This is made possible even for custom objects, as long as they follow the rules.

Essentially, the problem is that you cannot define and refer to an object in one statement. You need an instance of the object before you can refer to it. So we create instances, then set their connections in some order.

## Serializing custom objects

Snapshot doesn't try to be clever by guessing what to do with non-native objects. Instead, each custom object must follow these rules:

1. It must be possible to instantiate the object via new Classname() without any parameters.
   During deserialization, each object is first created without any data inside it.

2. It must have a .serialize function.

   During serialization, this function is called to get the data to be serialized.

   The serialize functions should return an array. The first argument of the array should be the name of the class (e.g. "Foo" if the constructor is called "Foo").

   The rest of the arguments should be data, which will be passed to the .deserialize() function in the same order.

3. It must have a .deserialize function

   The deserialize function should accept the parameteres

The constructors and prototypes are not serialized. Instead, they should be made available in a different way, e.g. by packaging them. Just make sure that `new Foo()` works before deserializing.

Here is an example of a custom object that works:

    var Foo = function(name) {
      this.name = name;
    };
    Foo.prototype.serialize = function() {
      return ['Foo', this.name];
    };
    Foo.prototype.deserialize = function(name) {
      this.name = name;
    };

During deserialization, the calls will be `instance = new Foo()` followed by `instance.deserialize("value_from_serialize")`.

