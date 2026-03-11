#pragma once

#include <array>
#include <string>

#include <emscripten/val.h>
#include <emscripten/bind.h>

namespace JXG
{
    struct BoardOptions;

    class Board
    {
        public:

        static Board initBoard(std::string box, const BoardOptions& options);

        emscripten::val createPoint(std::array<int, 2> coords);

        private:

        emscripten::val myBoard;

        Board(emscripten::val board);
    };

    struct BoardOptions
    {
        std::array<int, 4> boundingBox;
        bool grid;
        bool axis;
    };
}