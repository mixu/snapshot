var util = require('util');

function snapshot(scope) {
  var seenObjs = [ ],
      objects = [ ],
      links = [];

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
        return '[' + value.map(function(i) { return implode(i); }) +']';
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
            objects[index] = 'new ' +parts.shift()+'('+parts.map(function(item, key) {
              var val = implode(item, index);
              console.log('val', val);
              if(val instanceof Reference) {
                val.from = index;
                val.isObject = true;
                links.push(val);
                return 'null';
              } else {
                return val;
              }
            }).join(',')+')';
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

  return ';(function() { var Obj = [' + objects.join(',')+'];\n' +
          links.map(function(link) {
            if(!link.isObject) {
              return 'Obj['+link.from+'].'+link.key+' = Obj['+link.to+'];';
            } else {
              return 'Obj['+link.from+'].deserialize(Obj['+link.to+']);'
            }
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
