/*
    Copyright 2008-2025
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
        Andreas Walter,
        Alfred Wassermann,
        Peter Wilfahrt

    This file is part of JSXGraph.

    JSXGraph is free software dual licensed under the GNU LGPL or MIT License.

    You can redistribute it and/or modify it under the terms of the

      * GNU Lesser General Public License as published by
        the Free Software Foundation, either version 3 of the License, or
        (at your option) any later version
      OR
      * MIT License: https://github.com/jsxgraph/jsxgraph/blob/master/LICENSE.MIT

    JSXGraph is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License and
    the MIT License along with JSXGraph. If not, see <https://www.gnu.org/licenses/>
    and <https://opensource.org/licenses/MIT/>.
 */

/*global JXG: true, define: true*/
/*jslint nomen: true, plusplus: true*/

import JXG from "../jxg.js";

var major = 1,
    minor = 11,
    patch = 2,
    add = 'dev', // 'dev' 'beta'
    version = major + '.' + minor + '.' + patch + (add ? '-' + add : ''),
    constants;

constants =
    /** @lends JXG */ {
    /**
     * Constant: the currently used JSXGraph version.
     *
     * @name JXG.version
     * @type String
     */
    version: version,

    /**
     * Constant: the small gray version indicator in the top left corner of every JSXGraph board (if
     * showCopyright is not set to false on board creation).
     *
     * @name JXG.licenseText
     * @type String
     */
    licenseText: "JSXGraph v" + version + " Copyright (C) see https://jsxgraph.org",

    /**
     * JSXGraph logo: base64 of img/png/screen/jsxgraph-logo_black-square-outline.png
     *
     * @name JXG.licenseLogo
     * @type String
     */
    licenseLogo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJ8AAACfCAYAAADnGwvgAAAACXBIWXMAAAsSAAALEgHS3X78AAAI7ElEQVR4nO2d3XXbOBOG39mz9/ZWYHcQdRCmguirwEoHTgVRKlinAksVxKngoyuIVMFKHUQVYC84ShStfog/AgTe5xxdxCYlHOUxQAAzAzHGgJAU/JG6AaReKB9JBuUjyaB8JBl/pm5ALETkFsBE/zkBcJuwObWzMMZsjn9YjHwicg9gCqBBJ9tdwuaQ32kBbI5/OGr5VLiZvijbyBilfCrdHMBD0oYQL0YlH6Uri9HIJyJzAI8AbhI3hQQie/m0t3sB8CZtS0hosl7nE5EGwAoUr0iylU9EZgD+Dw6zxZKlfCrec+p2kLhkJx/Fq4es5KN4dZHbbHcF4F3qRpCrzBBgrTUr+Ywxq9RtINfRVQhvshp2SV1QPpIMykeSQflIMigfSQblI8mgfCQZlI8kg/KRZAy6w6GBoRP8SmWcXLqeDMrCGLMY8gOjyqe5sw1+pTQywyxf2qE/MIp8IjJBl28xBYNByRmCyqcbznMAb0O+LymTIPLps9wClI5Y4D3b1ZTGf0DxiCXOPZ9OJl5A6YgjTvLphKIFJxPEA+thV0SmoHgkAFbyaYLPV1A8EoDe8ulQy8wyEoxez3wHz3gx2OJE4UAShKwng1fl01ntAmGG2h26GXILoD1VKpWEQ0SyPmSlT8/3BP9CPa9IsHFN8uaifDqz9UkO3gJ4NMa8eLwHKZSzEw4dbp883vsLgAnFI+e41PM9wj0E6gOHWHKNk/Jpr/fo8H47AFNjTOvTKFIH54Zd19rHjxSP9OWSfLZ85FBLbPiPfDrDte31Xo0xPpMTUiGner6Zw/u43EMq55R87y3f4zN3KogLv812HYv+VTPc6vfToEv5vMf5nZ8duiqr+9eLMeZH/BaOi+Ollsby/mXpX6oKN4NdJt4Nuk39/cb+s4is0f2hUkTleNhtLO8vdvdCRKYiskJ3FsgD/AMr3qALSduIyFzXUqvmWD6rCgIlbp2JyEREWnRBszFOProB8AmdhC5LWsVwLJ/NX/dryIbkgGbifccwcXA3AP4WkZWmnlbHT/k0YNSGNmxT0iEit9rbfUrw8W8ArHR9tSoOe74qn0H0j26FtFG/NwC+ao5MNfhULGhDNSIVGaaAPosIatmmrLY+n842W+Qj3p7nWnrAKuXLWLw9z6FO+cmZKuVDmLyU2LyUvhaY1dlrQxAgL+WQV3STlcMdiwbd1ptvIcwbdFmDxc6Cq5IvQF4K0DMTTyczM325Du/vRWRa4mI+UN+w65OXsgbwzhjT9JmNGmNWxphHdL3gF8fPBAoO3KhGPo+8FKALoJi4pAgYY36ohO/QRbvYclfq7Lca+eBeH/qDMWbm++EqbgM3Aee+n58jNcnn0ut9Cbngq4dZN7AX8M5h+zN7qpBP/+Nsl1ZedbgMigo4c7i1uAiYKuSDfZwiEDEvRWev3yxvayI0JSm1yGe7VrYcIC/Ftie7Ky30qhb5bCNW5jEacYjKXXXvV7x8Dr3FesBsPNvF4/sYjUhF8fLB/j9syN2E1vL6JkIbklGDfLab86sorTiB9rAu635FUIN8tutjQ6c1DiZ7btQgH8kUykeSUYN8m9QNuEJx22Z9GTyeT0Se0P8LXwXY4tpYXt9goOQojbTJNZQ/OimCSScYNk1xY3n9FMNFkdjuvLQxGpGK4oddhwXjNwNuY9nKt4nRiFQUL59iW9pjFqMRh6jgtrUQi1qWqUW+1vL6xwF6P9vw+K2GYxVDLfLZbpndIGLuhGbQ2fZ6bYSmJKUK+bTH2Fre9j5GCTMNbF043OpyT9ZUIZ/i0pP9HTJ5x+MEz22J55vUJN8Cbpv4z1q3zwvt8TZwq5Tg/fk5Uo18WgfZ9Tnuk4i0Lkk8Wvtvjq7opMuC8rbUqlXVyKc8wT2E6S2A7yKy6FPIUUTuVboN/IpOzj3uzZqqymUYY37oM9xXj7d5APAgIvvjDtqj39+j28UJUYjotdReD6hMPqDLHBORb7Bf6jjm+LiD0OxQ+MlOtQ27e2boaq/kzKz0k52qlE8nHzPkG8L+sdTKVIdUKR/gVboiNstaTvCsVj4gSwE/hyhKNBaqlg/4KeAEaZ8Bd+iqYc0TtmFwqpcP+Bnz18CviKMrawC9Ck6WBuVTjoo42gYhuLBDN8xOSguV6gvlO8IY0xpj7gF8QDwJlwAmtQ2zx1C+MxhjFirh/2Bf0OcUawAfAfxljCl+Da8P1e1w2KLrbfszMRr8Oml8gsuBAmv8ftL4JmpD82Zz6oeUrye6MP2Co6hoDbe/P7iuHbBZo+DcHx7l80S/2E3iZuTM2TVUPvOR2JydyVM+EhvKR5JB+Ugy2nO/oHwkJhfrW1M+EpPFpV9SPhKTiwGxlI/E4vXarg7lI7GYX7uA8pEYvPbZZqR8JAbzPhdRPhKab32DKygfCYlVojvlIyGZaehZLygfCcXSNtE993i+tyJiUjfiAp9rz8NQ1i75xuz5iC9rOB7FSvmID/ucY6eTOikfccVLPIDyETcW8BQPyH/CQTIkVBooez6SDMpXKCLSpG7DNSgf2eP1/OYC5SuXxvL6wStlUb5ysT2wZvCeL8Vsd4FyTlBsUzfgAo3NxSlqBA4uX40VOIdGT0iyOWorSUlgDrtlYntUaxujEdegfIWhJdtsT0VqgzekB5SvPBaW1+9SHThD+QpCn/Vse71kJx1RvkLQ4XbhcKvLPUGgfAWg9aJfYH+Y9DZlGV/KN3JUvBZu5/vOgzbGEso3YjzF26Zec6V8I0VEJuj2Y11PNJ+Fa40blG9kiMitiMwBfAdw5/g2vasKxISRzCNBh9gpuuc0V+kAy6oCMaF8GXNw6tFUX7az2VNYVRWIiY98szFEy46QW3ThULdwf547x5dUuxmn8JHvIVgryBAs9UjXbOCEow6cylnEhvKVzxKO5SxiwwlH2Sxz7PH2sOcrl485iwew5yuRNbrllMFzMmxhz1cWn40xkzGIB7DnK4UlgHmoGipDQfnGyw5dIOjT2KTbQ/nGxQ5d0OhLTjsVrlC+fNkC2KALm9oAaMfyLNcXMSbnetukZDjbJcmgfCQZ/wLfQpUxjoiN/AAAAABJRU5ErkJggg==',

    /**
     *  Constant: user coordinates relative to the coordinates system defined by the bounding box.
     *  @name JXG.COORDS_BY_USER
     *  @type Number
     */
    COORDS_BY_USER: 0x0001,

    /**
     *  Constant: screen coordinates in pixel relative to the upper left corner of the div element.
     *  @name JXG.COORDS_BY_SCREEN
     *  @type Number
     */
    COORDS_BY_SCREEN: 0x0002,

    // object types
    OBJECT_TYPE_ARC: 1,
    OBJECT_TYPE_ARROW: 2,
    OBJECT_TYPE_AXIS: 3,
    OBJECT_TYPE_AXISPOINT: 4,
    OBJECT_TYPE_TICKS: 5,
    OBJECT_TYPE_CIRCLE: 6,
    OBJECT_TYPE_CONIC: 7,
    OBJECT_TYPE_CURVE: 8,
    OBJECT_TYPE_GLIDER: 9,
    OBJECT_TYPE_IMAGE: 10,
    OBJECT_TYPE_LINE: 11,
    OBJECT_TYPE_POINT: 12,
    OBJECT_TYPE_SLIDER: 13,// unused
    OBJECT_TYPE_CAS: 14,
    OBJECT_TYPE_GXTCAS: 15,
    OBJECT_TYPE_POLYGON: 16,
    OBJECT_TYPE_SECTOR: 17,
    OBJECT_TYPE_TEXT: 18,
    OBJECT_TYPE_ANGLE: 19,
    OBJECT_TYPE_INTERSECTION: 20,
    OBJECT_TYPE_TURTLE: 21,
    OBJECT_TYPE_VECTOR: 22,
    OBJECT_TYPE_OPROJECT: 23,
    OBJECT_TYPE_GRID: 24,
    OBJECT_TYPE_TANGENT: 25,
    OBJECT_TYPE_HTMLSLIDER: 26,
    OBJECT_TYPE_CHECKBOX: 27,
    OBJECT_TYPE_INPUT: 28,
    OBJECT_TYPE_BUTTON: 29,
    OBJECT_TYPE_TRANSFORMATION: 30,
    OBJECT_TYPE_FOREIGNOBJECT: 31,

    OBJECT_TYPE_VIEW3D: 32,
    OBJECT_TYPE_POINT3D: 33,
    OBJECT_TYPE_LINE3D: 34,
    OBJECT_TYPE_PLANE3D: 35,
    OBJECT_TYPE_CURVE3D: 36,
    OBJECT_TYPE_SURFACE3D: 37,

    OBJECT_TYPE_MEASUREMENT: 38,

    OBJECT_TYPE_INTERSECTION_LINE3D: 39,
    OBJECT_TYPE_SPHERE3D: 40,
    OBJECT_TYPE_CIRCLE3D: 41,
    OBJECT_TYPE_INTERSECTION_CIRCLE3D: 42,
    OBJECT_TYPE_TEXT3D: 43,
    OBJECT_TYPE_FACE3D: 44,
    OBJECT_TYPE_POLYHEDRON3D: 45,
    OBJECT_TYPE_POLYGON3D: 46,

    // IMPORTANT:
    // ----------
    // For being able to differentiate between the (sketchometry specific) SPECIAL_OBJECT_TYPEs and
    // (core specific) OBJECT_TYPEs, the non-sketchometry types MUST NOT be changed
    // to values > 100.

    // object classes
    OBJECT_CLASS_POINT: 1,
    OBJECT_CLASS_LINE: 2,
    OBJECT_CLASS_CIRCLE: 3,
    OBJECT_CLASS_CURVE: 4,
    OBJECT_CLASS_AREA: 5,
    OBJECT_CLASS_OTHER: 6,
    OBJECT_CLASS_TEXT: 7,
    OBJECT_CLASS_3D: 8
};

JXG.extendConstants(JXG, constants);

export default constants;
// const COORDS_BY_SCREEN = constants.COORDS_BY_SCREEN;
// export {constants as default,
//         COORDS_BY_SCREEN};
