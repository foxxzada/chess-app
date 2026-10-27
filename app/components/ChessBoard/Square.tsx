import PieceImage from "../ChessPieces/PieceImage";

interface SquareProps {
  piece: string;
  rank: number;
  file: number;
  isSelected: boolean;
  isLegalTarget: boolean;
  onDrop: (rank: number, file: number) => void;
  onDragStart: (rank: number, file: number) => void;
  onClick: (rank: number, file: number) => void;
}

export default function Square({
  piece,
  rank,
  file,
  isSelected,
  isLegalTarget,
  onDrop,
  onDragStart,
  onClick
}: SquareProps) {

  const isLight = (rank + file) % 2 === 0;

  return (
    <div
      onClick={() => onClick(rank, file)}
      onDrop={() => onDrop(rank, file)}
      onDragOver={(e) => e.preventDefault()}
      className={`flex items-center justify-center
        ${isLight
          ? "bg-[var(--light-square-color)]"
          : "bg-[var(--dark-square-color)]"
        }
        ${isSelected ? "ring-4 ring-inset ring-yellow-400" : ""}
        ${isLegalTarget ? "outline outline-4 outline-inset outline-emerald-400" : ""}`}
    >
      {piece && (
        <div
          draggable
          onDragStart={() => onDragStart(rank, file)}
          className="cursor-pointer"
        >
          <PieceImage piece={piece} />
        </div>
      )}
    </div>
  );
}
