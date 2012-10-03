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

TODO.

We will support circular structures.

For objects which are referred to more than once, if [reference1] === [reference2] during the serialization, then the object will be only instantiated once in the serialized output. The other references will reuse the same instance.
