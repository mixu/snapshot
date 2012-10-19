var assert = require('assert'),
    snapshot = require('./index');

function toStr(value) { return Object.prototype.toString.call(value); }

exports['snapshot'] = {

  'native types': function() {
    var expected = {
      'a string': 'a string',
      'a number': 123,
      'a boolean': true,
      'another boolean': false,
      'an array': [ 1, '2', false],
      'a regular expression': /foo/gi,
      'another regular expression': new RegExp('foo|bar'),
      'a date': new Date(),
      'null': null,
      'undefined': undefined,
      'a function': function foo(a, b) { return a + b; },
      'a hash': { 1: 123, a: 'b', c: false }
    };

    Object.keys(expected).forEach(function(name) {
      var value = expected[name],
          imploded = snapshot({ a: value }),
          evaled;
      // console.log(value, imploded);
      evaled = eval(imploded).a;
      if (typeof value !== 'function') {
        // deepequal doesn't work with function
        assert.deepEqual(evaled, value, 'can serialize '+ name);
      } else {
        assert.equal(evaled.toString(), value.toString(), 'can serialize '+ name);
      }
      assert.equal(typeof evaled, typeof value, name + ' has same type');
      assert.equal(toStr(evaled), toStr(value), name + ' has same string when passed to native toString');
    });
  },

  'a custom class with serialize function': function() {
    var Foo = function(name, opts) {
      this.name = name,
      this.opts = opts;
    };
    Foo.prototype.serialize = function() {
      return ['Foo', this.name, this.opts];
    };
    Foo.prototype.deserialize = function(name, opts) {
      this.name = name;
      this.opts = opts;
    };

    var value = new Foo('FooObj', { bar: 'baz'});

    var imploded = snapshot({ a: value }),
        evaled;
//    console.log(value, imploded);
    evaled = eval(imploded);
//    console.log(evaled);

    evaled = evaled.a;
    assert.deepEqual(evaled, value, 'can serialize custom class');
    assert.equal(typeof evaled, typeof value, 'has same type');
    assert.ok(value instanceof Foo);
    assert.ok(evaled instanceof Foo);
    assert.equal(toStr(evaled), toStr(value), 'has same string when passed to native toString');

  },

  'circular dependencies': function() {
    var value = { a: { a: new Date() }, b: { b: /fo[o]+/} };
    value.a.sibling = value.b;
    value.b.sibling = value.a;
    value.a.parent = value;
    value.b.parent = value;

//    console.log(value);

    var imploded = snapshot(value);
//    console.log(imploded);

    var evaled = eval(imploded);

    assert.ok(evaled.a.sibling === evaled.b);
    assert.ok(evaled.b.sibling === evaled.a);
    assert.ok(evaled.a.parent === evaled);
    assert.ok(evaled.b.parent === evaled);
    assert.ok(evaled.a.a instanceof Date);
    assert.equal(evaled.a.a.getTime(), value.a.a.getTime());
    assert.ok(evaled.b.b instanceof RegExp);
    assert.equal(evaled.b.b.toString(), value.b.b.toString());
  },

  'array of objects with circular references': function() {
    var Foo = function(name) {
      this.name = name;
      this.friend = null;
    };
    Foo.prototype.serialize = function() {
      return ['Foo', this.name, this.friend];
    };
    Foo.prototype.deserialize = function(name, friend) {
      this.name = name;
      this.friend = friend;
    };
    var value =  { a: [ new Foo('a'), new Foo('b'), new Foo('c')] };

    value.a[0].friend = value.a[1];
    value.a[1].friend = value.a[2];
    value.a[2].friend = value.a[0];

    var imploded = snapshot(value),
        evaled;
//    console.log(value, imploded);
    evaled = eval(imploded);
//    console.log(evaled);

    assert.equal(typeof evaled, typeof value, 'has same type');
    assert.equal(toStr(evaled), toStr(value), 'has same string when passed to native toString');
    assert.equal(typeof evaled.a, typeof value.a);
    assert.equal(evaled.a.length, value.a.length);
    assert.equal(evaled.a[0].name, 'a');
    assert.ok(evaled.a[0] instanceof Foo);
    assert.equal(evaled.a[1].name, 'b');
    assert.ok(evaled.a[1] instanceof Foo);
    assert.equal(evaled.a[2].name, 'c');
    assert.ok(evaled.a[2] instanceof Foo);

    assert.strictEqual(evaled.a[0].friend, evaled.a[1]);
    assert.strictEqual(evaled.a[1].friend, evaled.a[2]);
    assert.strictEqual(evaled.a[2].friend, evaled.a[0]);
  }

};


// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--bail', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}
