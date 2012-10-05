var assert = require('assert'),
    implode = require('./index').implode,
    explode = require('./index').explode;

function toStr(value) { return Object.prototype.toString.call(value); }

exports['implode'] = {

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
          imploded = implode({ a: value }),
          evaled;
      console.log(value, imploded);
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
    Foo.prototype.deserialize = function(opts) {
      this.opts = opts;
    }

    var value = new Foo('FooObj', { bar: 'baz'});

    console.log(typeof value);
    console.log(Object.prototype.toString.call(value));
    console.log(value.prototype);
    console.log(value.constructor);


    var imploded = implode({ a: value }),
        evaled;
    console.log(value, imploded);
    evaled = eval(imploded).a;
    assert.deepEqual(evaled, value, 'can serialize custom class');
    assert.equal(typeof evaled, typeof value, 'has same type');
    assert.ok(value instanceof Foo);
    assert.ok(evaled instanceof Foo);
    assert.equal(toStr(evaled), toStr(value), 'has same string when passed to native toString');

  },

  'circular dependencies': function() {
    var value = { a: { a: 'a'}, b: { b: 'b'} };
    value.a.sibling = value.b;
    value.b.sibling = value.a;
    value.a.parent = value;
    value.b.parent = value;

    console.log(value);

    var imploded = implode(value);
    console.log(imploded);


  }

};


// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}
