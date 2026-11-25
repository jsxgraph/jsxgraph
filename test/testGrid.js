/*
    Copyright 2008-2026
        Matthias Ehmann,
        Michael Gerhaeuser,
        Carsten Miller,
        Bianca Valentin,
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

describe("Test grid", function () {
  var board;

  document.getElementsByTagName('body')[0].innerHTML = '<div id="jxgbox" style="width: 100px; height: 100px;"></div>';
  board = JXG.JSXGraph.initBoard('jxgbox', {
    renderer: 'svg',
    axis: false,
    grid: true,
    boundingbox: [-5, 5, 5, -5],
    resize: { enabled: false },
    showCopyright: false,
    showNavigation: false
  });

  it("Grid: check number of points", function () {
    var g = board.create('grid', [], {
      major: {
        face: 'plus',
        size: 7,
        strokeColor: 'green',
        strokeOpacity: 1,
      },
      minor: {
        size: 4
      },
      minorElements: 3,
    });
    
    expect(g.points.length).toEqual(486);

  });

  it("Grid: automatic major step when 50 px is a power of ten in user units", function () {
    var brd, g, xs, i, div;

    div = document.createElement('div');
    div.id = 'jxgbox_grid_pow10';
    div.style.width = '500px';
    div.style.height = '500px';
    document.body.appendChild(div);

    // 0.05 px per unit, so 50 px are 1000 units
    brd = JXG.JSXGraph.initBoard('jxgbox_grid_pow10', {
      renderer: 'svg',
      axis: false,
      grid: true,
      boundingbox: [-5000, 5000, 5000, -5000],
      resize: { enabled: false },
      showCopyright: false,
      showNavigation: false
    });
    g = brd.grids[0];

    // x coordinates of the vertical lines
    xs = [];
    for (i = 0; i < g.dataX.length; i += 3) {
      if (g.dataX[i] === g.dataX[i + 1]) {
        xs.push(g.dataX[i]);
      }
    }
    expect(xs.length).toBeGreaterThan(1);
    for (i = 1; i < xs.length; i++) {
      expect((xs[i] - xs[i - 1]) * brd.unitX).toBeGreaterThanOrEqual(50);
    }
    JXG.JSXGraph.freeBoard(brd);
    document.body.removeChild(div);
  });


});

