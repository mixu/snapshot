var util = require('util');

function snapshot(scope) {
  var seenObjs = [ ],
      objects = [ ],
      links = [],
      deserializeParams = [];

  function Reference(to) {
    this.from = null;
    this.to = to;
  }

  function implode(value, parent) {
    var type = typeof value;

    if(type === 'string') {
      return JSON.stringify(value);
    } else if (type === 'number' || type === 'boolean') {
      return value;
    } else if (type === 'undefined') {
      return 'undefined';
    } else {
      // object or function
      var stype = Object.prototype.toString.call(value);
      // apparently Chrome <= 12 is nonconformant and returns typeof /regexp/ as 'function'
      if(value === null) {
        return 'null';
      }
      if(stype === '[object Array]') {
        return '[' + value.map(function(i) {
          var val = implode(i);
          console.log('array!!!', i, val);
          if(val instanceof Reference) {
            return 'Obj['+val.to+']';
          } else {
            return val;
          }
        }) +']';
      } else if (stype === '[object RegExp]') {
        return value.toString();
      } else if (stype === '[object Date]') {
        return 'new Date('+value.valueOf()+')';
      } else {
        // non-native object or function
        if(type === 'function') {
          return value.toString();
        } else {
          // object (can contain circular depencency)
          var index = seenObjs.indexOf(value);
          if(index > -1) {
            console.log('Circular dependency from ' + parent + ' to ' + index);
            return new Reference(index); //'Obj['+index+']';
          } else {
            index = seenObjs.length;
            seenObjs.push(value);
            console.log('Seen', index, (value.a ? value.a : ( value.b ? value.b : '')));
          }

          if(value.serialize && typeof value.serialize === 'function') {
            var parts = value.serialize();
            console.log('parts:', parts);
            objects[index] = 'new ' +parts.shift()+'()';
            // store all params
            deserializeParams[index] = parts.map(function(item, key) {
                          var val = implode(item, index);
                          console.log('val', val);
                          if(val instanceof Reference) {
                            val.from = index;
                            val.isObject = true;
                          }
                          return val;
                        });
          } else {
            objects[index] = '{ ' + Object.keys(value).map(function(key) {
              var val = implode(value[key], index);
              if(val instanceof Reference) {
                val.from = index;
                val.key = key;
                links.push(val);
                return val;
              } else {
                return JSON.stringify(key) +': '+val;
              }
            }).filter(function(v) { return !(v instanceof Reference); }).join(',') + ' }';
          }

          return new Reference(index);

        }
      }
    }
  }

  var values = implode(scope, 0);

  console.log(links);

  return '(function() { var Obj = [' + objects.join(',')+'];\n' +
          links.map(function(link) {
            return 'Obj['+link.from+'].'+link.key+' = Obj['+link.to+'];';
          }).join('\n')+
          deserializeParams.map(function(init, index) {
            return 'Obj['+index+'].deserialize('+init.map(function(val){
                if(val instanceof Reference && val.isObject) {
                  return 'Obj['+val.to+']';
                } else {
                  return val;
                }
              }).join(',')+');'
          }).join('\n')+
          '\n return Obj[0];}());';
}

function explode(value) {
  return JSON.parse(value);
}

module.exports = {
  implode: snapshot,
  explode: explode
};
