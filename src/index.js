/*
  Ported from the Apache Commons Math library (java)
  specifically from this file: https://github.com/apache/commons-math/blob/master/src/main/java/org/apache/commons/math4/analysis/interpolation/AkimaSplineInterpolator.java
  at commit: e082e0c48ed611ce3aca949cb47d0e96c35788ef
*/

import * as E from './exceptions.js';
import {binarySearch, checkOrder} from './util.js';

/**
 * Computes a cubic spline interpolation for the data set using the Akima
 * algorithm, as originally formulated by Hiroshi Akima in his 1970 paper
 * "A New Method of Interpolation and Smooth Curve Fitting Based on Local Procedures."
 * J. ACM 17, 4 (October 1970), 589-602. DOI=10.1145/321607.321609
 * http://doi.acm.org/10.1145/321607.321609
 * <p>
 * This implementation is based on the Akima implementation in the CubicSpline
 * class in the Math.NET Numerics library. The method referenced is
 * CubicSpline.InterpolateAkimaSorted
 * </p>
 * <p>
 * The {@link #interpolate(double[], double[]) interpolate} method returns a
 * {@link PolynomialSplineFunction} consisting of n cubic polynomials, defined
 * over the subintervals determined by the x values, {@code x[0] < x[i] ... < x[n]}.
 * The Akima algorithm requires that {@code n >= 5}.
 * </p>
 */
export default class SplineInterpolatorAkima {
  constructor() {
    /** The minimum number of points that are needed to compute the function. */
    this.MINIMUM_NUMBER_POINTS = 5;
  }

  createInterpolator(xVals, yVals) {
    const segmentCoeffs = this.interpolate(xVals, yVals);
    const xValsCopy = xVals.slice(0);// clone to break dependency on passed values
    var self = this;
    return function(x) {
      return self.evaluatePolynomialSegment(xValsCopy, segmentCoeffs, x);
    }
  }

  
  // Evaluates the polynomial of the segment corresponding to the specified x value
  evaluatePolynomialSegment(xVals, segmentCoeffs, x) {
    var i = binarySearch(xVals, x);

    if (i < 0) {
      i = -i - 2;
    }
    i = Math.max(0, Math.min(i, segmentCoeffs.length - 1));
    return this.evaluatePolynomial(segmentCoeffs[i], x - xVals[i]);
  }
  
  // Evaluates the value of a polynomial.
  // c contains the polynomial coefficients in ascending order.
  evaluatePolynomial(c, x) {
    var n = c.length;
    if (n == 0) {
      return 0;
    }
    var v = c[n - 1];
    for (var i = n - 2; i >= 0; i--) {
      v = x * v + c[i];
    }
    return v;
  }

  
  /**
   * Computes an interpolating function for the data set.
   *
   * @param xvals the arguments for the interpolation points
   * @param yvals the values for the interpolation points
   * @return a function which interpolates the data set
   * @throws DimensionMismatchException if {@code xvals} and {@code yvals} have
   *         different sizes.
   * @throws NonMonotonicSequenceException if {@code xvals} is not sorted in
   *         strict increasing order.
   * @throws NumberIsTooSmallException if the size of {@code xvals} is smaller
   *         than 5.
   */
  interpolate(xvals, yvals) {
    if (xvals == null ||
        yvals == null) {
      throw new E.NullArgumentException();
    }

    if (xvals.length != yvals.length) {
      throw new E.DimensionMismatchException("xvals and yvals arrays have different sizes: xvals.length is " + xvals.length + " while yvals.length is " + yvals.length);
    }

    if (xvals.length < this.MINIMUM_NUMBER_POINTS) {
      throw new E.NumberIsTooSmallException("Got " + xvals.length + " points but I need at least " + this.MINIMUM_NUMBER_POINTS);
    }

    checkOrder(xvals);

    var numberOfDiffAndWeightElements = xvals.length - 1;

    var differences = new Array(numberOfDiffAndWeightElements);
    var weights = new Array(numberOfDiffAndWeightElements);

    for (var i = 0; i < differences.length; i++) {
      differences[i] = (yvals[i + 1] - yvals[i]) / (xvals[i + 1] - xvals[i]);
    }

    for (var i = 1; i < weights.length; i++) {
      weights[i] = Math.abs(differences[i] - differences[i - 1]);
    }

    // Prepare Hermite interpolation scheme.
    var firstDerivatives = new Array(xvals.length);

    for (var i = 2; i < firstDerivatives.length - 2; i++) {
      var wP = weights[i + 1];
      var wM = weights[i - 1];
      if ((Math.abs(wP) < Number.EPSILON) &&
          (Math.abs(wM) < Number.EPSILON)) {
        var xv = xvals[i];
        var xvP = xvals[i + 1];
        var xvM = xvals[i - 1];
        firstDerivatives[i] = (((xvP - xv) * differences[i - 1]) + ((xv - xvM) * differences[i])) / (xvP - xvM);
      } else {
        firstDerivatives[i] = ((wP * differences[i - 1]) + (wM * differences[i])) / (wP + wM);
      }
    }

    firstDerivatives[0] = this.differentiateThreePoint(xvals, yvals, 0, 0, 1, 2);
    firstDerivatives[1] = this.differentiateThreePoint(xvals, yvals, 1, 0, 1, 2);
    firstDerivatives[xvals.length - 2] = this.differentiateThreePoint(xvals, yvals, xvals.length - 2, xvals.length - 3, xvals.length - 2, xvals.length - 1);
    firstDerivatives[xvals.length - 1] = this.differentiateThreePoint(xvals, yvals, xvals.length - 1, xvals.length - 3, xvals.length - 2, xvals.length - 1);

    return this.interpolateHermiteSorted(xvals, yvals, firstDerivatives);
  }

  /**
   * Three point differentiation helper, modeled off of the same method in the
   * Math.NET CubicSpline class. This is used by both the Apache Math and the
   * Math.NET Akima Cubic Spline algorithms
   *
   * @param xvals x values to calculate the numerical derivative with
   * @param yvals y values to calculate the numerical derivative with
   * @param indexOfDifferentiation index of the elemnt we are calculating the derivative around
   * @param indexOfFirstSample index of the first element to sample for the three point method
   * @param indexOfSecondsample index of the second element to sample for the three point method
   * @param indexOfThirdSample index of the third element to sample for the three point method
   * @return the derivative
   */
  differentiateThreePoint(xvals, yvals,
                          indexOfDifferentiation,
                          indexOfFirstSample,
                          indexOfSecondsample,
                          indexOfThirdSample) {
    var x0 = yvals[indexOfFirstSample];
    var x1 = yvals[indexOfSecondsample];
    var x2 = yvals[indexOfThirdSample];

    var t = xvals[indexOfDifferentiation] - xvals[indexOfFirstSample];
    var t1 = xvals[indexOfSecondsample] - xvals[indexOfFirstSample];
    var t2 = xvals[indexOfThirdSample] - xvals[indexOfFirstSample];

    var a = (x2 - x0 - (t2 / t1 * (x1 - x0))) / (t2 * t2 - t1 * t2);
    var b = (x1 - x0 - a * t1 * t1) / t1;

    return (2 * a * t) + b;
  }

  /**
   * Creates a Hermite cubic spline interpolation from the set of (x,y) value
   * pairs and their derivatives. This is modeled off of the
   * InterpolateHermiteSorted method in the Math.NET CubicSpline class.
   *
   * @param xvals x values for interpolation
   * @param yvals y values for interpolation
   * @param firstDerivatives first derivative values of the function
   * @return polynomial that fits the function
   */
  interpolateHermiteSorted(xvals, yvals, firstDerivatives) {
    if (xvals.length != yvals.length) {
      throw new E.DimensionMismatchException("xvals and yvals arrays have different sizes: xvals.length is " + xvals.length + " while yvals.length is " + yvals.length);
    }

    if (xvals.length != firstDerivatives.length) {
      throw new E.DimensionMismatchException("xvals and yvals arrays are not the same size as firstDerivatives: xvals.length is " + xvals.length + " while firstDerivatives is " + firstDerivatives);
    }

    var minimumLength = 2;
    if (xvals.length < minimumLength) {
      throw new E.NumberIsTooSmallException("xvals is " + xvals.length + " which is less than minimum of " + minimumLength);
    }

    var size = xvals.length - 1;
    var coefficients = [];
    var allCoefficients = new Array(size)
    
    for (var i = 0; i < size; i++) {
      var w = xvals[i + 1] - xvals[i];
      var w2 = w * w;

      var yv = yvals[i];
      var yvP = yvals[i + 1];

      var fd = firstDerivatives[i];
      var fdP = firstDerivatives[i + 1];

      coefficients[0] = yv;
      coefficients[1] = firstDerivatives[i];
      coefficients[2] = (3 * (yvP - yv) / w - 2 * fd - fdP) / w;
      coefficients[3] = (2 * (yv - yvP) / w + fd + fdP) / w2;
      allCoefficients[i] = coefficients.slice(0);
    }
    return allCoefficients;
    
  }
}

