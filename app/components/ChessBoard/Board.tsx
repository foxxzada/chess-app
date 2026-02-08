import Pieces from "../ChessPieces/Pieces";
import Files from "./BoardBits/Files";
import Ranks from "./BoardBits/Ranks";

export default function ChessBoard() {
  const isLightSquare = (rank: number, file: string) => {
    const fileIndex = file.charCodeAt(0) - 'a'.charCodeAt(0);
    return (rank + fileIndex) % 2 === 0;
  };

  const ranks = Array(8).fill(1).map((_, i) => 8 - i);
  const files = Array(8).fill('a').map((_, i) =>
    String.fromCharCode(97 + i)
  );

  return (
    <div
      className="
        grid
        grid-cols-[calc(.25*var(--square-size))_calc(8*var(--square-size))]
        grid-rows-[calc(8*var(--square-size))_calc(.25*var(--square-size))]
      "
    >
      <Ranks />

      <div className="relative grid grid-cols-[repeat(8,var(--square-size))] grid-rows-[repeat(8,var(--square-size))]">
        {ranks.map(rank =>
          files.map(file => (
            <div
              key={file + '-' + rank}
              className={
                isLightSquare(rank, file)
                  ? 'board--light--square'
                  : 'board--dark--square'
              }
            />
          ))
        )}
      <Pieces />
      </div>
      <div />

      <Files />
      
    </div>
  );
}