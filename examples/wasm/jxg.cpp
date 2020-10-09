#include "jxg.h"

#include <array>
#include <string>

#include <emscripten/val.h>
#include <emscripten/bind.h>

using namespace JXG;
using namespace emscripten;

val _JXG = val::global("JXG");
val _JSXGraph = _JXG["JSXGraph"];

Board::Board(val board) : myBoard(board)
{}

Board Board::initBoard(std::string box, const BoardOptions& options)
{
    auto boardAttributes = val::object();
    auto&& bounds = options.boundingBox;
    boardAttributes.set("boundingBox", val::array(bounds.cbegin(), bounds.cend()));
    boardAttributes.set("grid", options.grid);
    boardAttributes.set("axis", options.axis);

    auto board = _JSXGraph.call<val>("initBoard", val(box), boardAttributes);
    Board result = Board(board);
    return result;
}

emscripten::val JXG::Board::createPoint(std::array<int, 2> coords)
{
    return myBoard.call<val>("createElement", val("point"), val::array(coords.cbegin(), coords.cend()));
}
