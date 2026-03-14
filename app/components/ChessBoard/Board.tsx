"use client";

import { useState } from "react";
import Files from "./BoardBits/Files";
import Ranks from "./BoardBits/Ranks";
import Square from "./Square";

export default function ChessBoard() {

const initialPosition = [
['br','bn','bb','bq','bk','bb','bn','br'],
['bp','bp','bp','bp','bp','bp','bp','bp'],
['','','','','','','',''],
['','','','','','','',''],
['','','','','','','',''],
['','','','','','','',''],
['wp','wp','wp','wp','wp','wp','wp','wp'],
['wr','wn','wb','wq','wk','wb','wn','wr']
];

const [board, setBoard] = useState(initialPosition);

const [dragging, setDragging] = useState<{
fromRank: number;
fromFile: number;
} | null>(null);

function handleDrop(toRank: number, toFile: number) {
if (!dragging) return;

const newBoard = board.map(row => [...row]);

newBoard[toRank][toFile] =
  newBoard[dragging.fromRank][dragging.fromFile];

newBoard[dragging.fromRank][dragging.fromFile] = '';

setBoard(newBoard);
setDragging(null);

}

return ( <div
   className="
     grid
     grid-cols-[calc(.25*var(--square-size))_calc(8*var(--square-size))]
     grid-rows-[calc(8*var(--square-size))_calc(.25*var(--square-size))]
   "
 > <Ranks />

  <div className="relative grid grid-cols-[repeat(8,var(--square-size))] grid-rows-[repeat(8,var(--square-size))]">
    {board.map((rank, r) =>
      rank.map((piece, f) => (
        <Square
          key={`${r}-${f}`}
          piece={piece}
          rank={r}
          file={f}
          onDrop={handleDrop}
          onDragStart={(rank, file) => setDragging({ fromRank: rank, fromFile: file })}
        />
      ))
    )}
  </div>

  <div />

  <Files />
</div>

);
}