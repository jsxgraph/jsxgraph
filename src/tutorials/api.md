## TODO

- Elements: `@type` is not shown
- check domains (i.e. params a, b) of curves
- arcs, sectors: check signatures having lines
- check what base/composition.js does
- check:
  - `@constructor`
  - `@augments ...`
  - `@type ...`
  - `@throws`
- ~~Not yet: `@see` for Element~~
- Name: `MirrorElement` vs `Reflection`
- `text.js`: HTMLSlider
- `image.js`: If necessary enable coords, size with functions. Example
- ~~`@see` in element jsdocs~~
- Turtle: params and examples
- `base64.js`: to be retired 
- `uuid.js`: to be retired?
- `vml.js`: to be retired?
- `parser/datasource.js`: no jsdoc, yet
- `parser/prefix.js`: examples
- `parser/ca.js`: jsdoc missing massively
- Smartlabel: CSS of font color
- Attributes of chart.js
- jsdoc JXG.createAxes3D
- jsdoc: Often, @see doubles @extends 
- Add example Circle3D
- IntersectionLine3D not dynamic, see example
- Ticks3D: example
- 3D elements: add construction with transformation

## Attributes

- Add `@attribute` to each attribute comment, in particular in `options.js` and `options3d.js`

## Signatures

Now:

- Each signature is in a separate jsdoc block
- Starting the block with `@jsxgraphsignature Element` is mandatory
- Use type {@link PointLike} from file `jxg.js`
- The description __must__ follow directly after `@jsxgraphsignature`

__Example__

```
/**
 * @jsxgraphsignature Line
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

Old:

- Use type {@link PointLike} from file `jxg.js`
- `@memberof`, `@instance` and `@jsxgraphsignature` are mandatory
- The description __must__ follow directly after `@jsxgraphsignature`
 
