## TODO

- Elements: `@type` is not shown
- check:
  - `@constructor`
  - `@augments ...`
  - `@type ...`
  - `@throws`
- jsdoc: Often, @see doubles @extends 
- check domains (i.e. params a, b) of curves
- arcs, sectors: check signatures having lines
- check what base/composition.js does
- Name: `MirrorElement` vs `Reflection`
- `text.js`: HTMLSlider
- `image.js`: If necessary enable coords, size with functions. Example
- `base64.js`: to be retired 
- `uuid.js`: to be retired?
- `vml.js`: to be retired?
- `parser/datasource.js`: no jsdoc, yet
- `parser/prefix.js`: examples
- `parser/ca.js`: jsdoc missing massively
- Attributes of chart.js
- jsdoc JXG.createAxes3D
- Add example Circle3D
- Ticks3D: example
- 3D elements: add construction with transformation

## DONE

- ~~Not yet: `@see` for Element~~
- ~~`@see` in element jsdocs~~
- ~~Turtle: params and examples~~
- ~~Smartlabel: CSS of font color~~ (in main branch)
- ~~IntersectionLine3D not dynamic, see example~~ (in main branch)

__AI issues__

- A1 Retire `signatureblocks.tmpl`
- A2 fixed (see last block)
- A2b
- A3
- C9 
- C10: __no__
- C11
- C12
- C13
- D14
- D15
- D16



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
 
