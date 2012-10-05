# Implode


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
- Instances of objects that define a serialize() function

## Unsupported

- native functions
- instances of objects that do not define a serialize function

## Serialize function

There is no constructor guessing.

The serialize functions should return an array. The first argument of the array should be the name of the class (e.g. "Foo" if the constructor is called "Foo").

The rest of the arguments should be arguments passed to the constructor when the object is instantiated.

The definitions of the constructors are not serialized. Instead, they should be made available in a different way.

## Circular structures

Supports circular structures.

For objects which are referred to more than once, if [reference1] === [reference2] during the serialization, then the object will be only instantiated once in the serialized output. The other references will reuse the same instance.

For primitive objects, circular references can be resolved by transforming them into two steps:

1. Define the object without any references to other objects.
2. For each property that is a reference to another object, set it using the defined objects.

Essentially, the problem is that you cannot define and refer to an object in one statement. You need an instance of the object before you can refer to it.

For serializable objects, the approach is the same:

1. Call new Foo() with null for each param that is an object
2. Call instance.deserialize() with an array for each param that is an object

More sophisticated serialization would actually look at the dependency graphs and see if it is possible to have a non-circular structure, and instantiate those in one go.

I think there is simpler way: basically, have the new Foo() constructor work without parameters.

Then take everything in the serialize() return value and pass it to deserialize directly. This way there is no uncertainty about how many times and with what params the deserialize call is done.
