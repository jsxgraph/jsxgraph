#include <emscripten/val.h>
#include <emscripten/bind.h>

#include <iostream>
#include <cmath>
#include <map>

#include "jxg.h"

using namespace emscripten;
using namespace JXG;

int main()
{
    BoardOptions options =
    {
        { -2, 6, 6, -2 },
        false,
        true,
    };

    auto board = JXG::Board::initBoard("box", options);
    auto point = board.createPoint({{ 4, 1 }});
}

double fun(double t) {
  return 4 * sin(1 / t);
}

EMSCRIPTEN_BINDINGS(module) {
    function("fun", &fun);
    function("main", &main);
}
