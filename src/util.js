import * as E from './exceptions.js';

var OrderDirection = {
  /** Constant for increasing direction. */
  INCREASING: 0,
  /** Constant for decreasing direction. */
  DECREASING: 1
};

export function binarySearch(a, key) {
  var low = 0;
  var high = a.length - 1;
  while (low <= high) {
    var mid = (low + high) >>> 1;
    var midVal = a[mid];
    if (midVal < key) {
      low = mid + 1;
    } else if (midVal > key) {
      high = mid - 1;
    } else if (midVal == key) {
      return mid;
    } else { // values might be NaN
      throw new Error("Invalid number encountered in binary search.");
    }
  }
  return -(low + 1); // key not found
}

export function checkOrder(val, dir, strict, abort) {
  if(!dir) dir = OrderDirection.INCREASING;
  var previous = val[0];
  var max = val.length;

  var doubleBreak = false;
  var index;

  for (index = 1; index < max; index++) {
    switch (dir) {
    case OrderDirection.INCREASING:
      if (strict) {
        if (val[index] <= previous) {
          doubleBreak = true;
          break;
        }
      } else {
        if (val[index] < previous) {
          doubleBreak = true;
          break;
        }
      }
      break;
    case OrderDirection.DECREASING:
      if (strict) {
        if (val[index] >= previous) {
          doubleBreak = true;
          break;
        }
      } else {
        if (val[index] > previous) {
          doubleBreak = true;
          break;
        }
      }
      break;
    default:
      // Should never happen.
      throw new E.MathInternalError();
    }
    if(doubleBreak) {
      break;
    }
    previous = val[index];
  }

  if (index == max) {
    // Loop completed.
    return true;
  }

  // Loop early exit means wrong ordering.
  if (abort) {
    throw new E.NonMonotonicSequenceException("array was not ordered");
  } else {
    return false;
  }
}

