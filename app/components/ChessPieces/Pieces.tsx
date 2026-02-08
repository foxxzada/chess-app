import PieceImage from './PieceImage';

export default function Pieces() {
  const startingPosition = Array.from({ length: 8 }, () =>
    Array(8).fill('')
  );

  startingPosition[0][0] = 'br';
  startingPosition[0][1] = 'bn';
  startingPosition[0][2] = 'bb';
  startingPosition[0][3] = 'bq';
  startingPosition[0][4] = 'bk';
  startingPosition[0][5] = 'bb';
  startingPosition[0][6] = 'bn';
  startingPosition[0][7] = 'br';
  startingPosition[1][0] = 'bp';
  startingPosition[1][1] = 'bp';
  startingPosition[1][2] = 'bp';
  startingPosition[1][3] = 'bp';
  startingPosition[1][4] = 'bp';
  startingPosition[1][5] = 'bp';
  startingPosition[1][6] = 'bp';
  startingPosition[1][7] = 'bp';
  startingPosition[7][0] = 'wr';
  startingPosition[7][1] = 'wn';
  startingPosition[7][2] = 'wb';
  startingPosition[7][3] = 'wq';
  startingPosition[7][4] = 'wk';
  startingPosition[7][5] = 'wb';
  startingPosition[7][6] = 'wn';
  startingPosition[7][7] = 'wr';
  startingPosition[6][0] = 'wp';
  startingPosition[6][1] = 'wp';
  startingPosition[6][2] = 'wp';
  startingPosition[6][3] = 'wp';
  startingPosition[6][4] = 'wp';
  startingPosition[6][5] = 'wp';
  startingPosition[6][6] = 'wp';
  startingPosition[6][7] = 'wp';

  return (
    <div
      className="
        absolute
        inset-0
        grid
        grid-cols-[repeat(8,var(--square-size))]
        grid-rows-[repeat(8,var(--square-size))]
        pointer-events-none
      "
    >
      {startingPosition.map((rank, r) =>
        rank.map((piece, f) =>
          piece ? (
            <div
              key={`${r}-${f}`}
              className="flex items-center justify-center text-3xl"
            >
              <PieceImage piece={piece} />
            </div>
          ) : (
            <div key={`${r}-${f}`} />
          )
        )
      )}
    </div>
  );
}