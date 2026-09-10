## Attributes

- Add `@attribute` to each attribute comment, especially in `options.js` and `options3d.js`

## Signatures

- Use type `PointLike` from file `jxg.js`
- `@memberof`, `@instance` and `@jsxgraphsignature` are mandatory
- The description __must__ follow directly after `@jsxgraphsignature`
 
__Example__

```
/**
 * @memberof Line
 * @instance
 * @jsxgraphsignature
 * Create a line from homogeneous coordinates.
 *
 * A line can also be created providing three numbers.
 * The line is defined as
 * the set of solutions of the equation $a\cdot z+b \cdot x+c\cdot y = 0$, i.e. a point $(z,x, y)$ is on the line $(a,b,c)$
 * if and only if $a\cdot z+b \cdot x+c\cdot y = 0$.
 * In JSXGraph, for all finite points, z is normalized to the value 1.
 *
 * It is possible to provide three functions returning numbers, too.
 * @param {number | function():number} a
 * @param {number | function():number} b
 * @param {number | function():number} c
 *
 * @example <caption>Three coordinates</caption>
 * ...
 *
 */
```

