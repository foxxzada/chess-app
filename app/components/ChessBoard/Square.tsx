import PieceImage from "../ChessPieces/PieceImage";

interface SquareProps {
  piece: string;
  rank: number;
  file: number;
  onDrop: (rank: number, file: number) => void;
  onDragStart: (rank: number, file: number) => void;
}

export default function Square({
  piece,
  rank,
  file,
  onDrop,
  onDragStart
}: SquareProps) {

  const isLight = (rank + file) % 2 === 0;

  return (
    <div
      onDrop={() => onDrop(rank, file)}
      onDragOver={(e) => e.preventDefault()}
      className={`flex items-center justify-center
        ${isLight
          ? "bg-[var(--light-square-color)]"
          : "bg-[var(--dark-square-color)]"
        }`}
    >
      {piece && (
        <div
          draggable
          onDragStart={() => onDragStart(rank, file)}
        >
          <PieceImage piece={piece} />
        </div>
      )}
    </div>
  );
}