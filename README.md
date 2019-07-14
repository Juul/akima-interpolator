
This is a javascript library for [Akima spline](https://en.wikipedia.org/wiki/Akima_spline) interpolation.

Given a set of points in 2D space this library will interpolate a spline (curved line) which often seems more natural than the result from the more common natural cubic spline interpolation.

This is a port of Java code from the [Apache Commons Math](https://github.com/apache/commons-math) library, with a bit of code borrowed from the [commons-math-interpolation](https://github.com/chdh/commons-math-interpolation) TypeScript port.

# Usage

```
  import Akima from 'akima-interpolator';
  var akima = new Akima();

  var xvals = [
    10,
    20,
    30,
    40,
    50,
    60,
    70,
    80
  ];

  var yvals = [
    40,
    10,
    17,
    39,
    99,
    120,
    30,
    10    
  ];
  
  var f = akima.createInterpolator(xvals, yvals);

  for(var i=xvals[0]; i < xvals[xvals.length-1]; i++) {
    console.log('x:', i, 'y:', f(i));
  }  
```

# Visual example

Christian d'Heureuse has a nice visual demo of his TypeScript port comparing different interpolations [here](http://www.source-code.biz/snippets/typescript/akima/).

Try to put two points very close to each-other on the x-axis but with differing y-axis values, then put a third point far away on the x-axis but close to the second point on the y-axis. Switch between Natural and Akima to see the difference.

# License and copyright

This project is licensed under the AGPLv3 license. A copy of the AGPLv3 license is included in the file `LICENSE.txt`.

This product includes software developed at The Apache Software Foundation (www.apache.org) which is licensed under the Apache 2 License. A copye of the Apache 2 License is included in the file `LICENSE_APACHE.txt`.

This project includes code ported from the MIT-licensed [commons-math-interpolation](https://github.com/chdh/commons-math-interpolation) library. A copy of the MIT License is included in the file `LICENSE_MIT.md`.

* Copyright 2019 Marc Juul <marc@juul.io>
* Copyright 2017-2019 Christian d'Heureuse <chdh@inventec.ch>
* Copyright 2001-2019 The Apache Software Foundation


