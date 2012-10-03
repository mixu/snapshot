function implode(value, lookupfn) {
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
      return '[' + value.map(implode) +']';
    } else if (stype === '[object RegExp]') {
      return value.toString();
    } else if (stype === '[object Date]') {
      return 'new Date('+value.valueOf()+')';
    } else {
      // non-native object or function
      if(type === 'function') {
        return value.toString();
      } else {
        // object
        if(value.serialize && typeof value.serialize === 'function') {
          var parts = value.serialize();
          return 'new ' +parts.shift()+'('+parts.map(implode).join(',')+')';
        }

        return '{ ' + Object.keys(value).map(function(key) {
          return JSON.stringify(key) +': '+implode(value[key]);
        }).join(',') + ' }';

      }
    }
  }
}

function implode(scope) {
  var seenObjs = [];


}

function explode(value) {
  return JSON.parse(value);
}

module.exports = {
  implode: implode,
  explode: explode
};
