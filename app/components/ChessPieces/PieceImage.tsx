const PIECE_IMAGES = {
  wr: '../assets/pieces/wr.png',
  wn: '../assets/pieces/wn.png',
  wb: '../assets/pieces/wb.png',
  wq: '../assets/pieces/wq.png',
  wk: '../assets/pieces/wk.png',
  wp: '../assets/pieces/wp.png',
  br: '../assets/pieces/br.png',
  bn: '../assets/pieces/bn.png',
  bb: '../assets/pieces/bb.png',
  bq: '../assets/pieces/bq.png',
  bk: '../assets/pieces/bk.png',
  bp: '../assets/pieces/bp.png',
};

interface PieceImageProps {
    piece: string;
}

export default function PieceImage({ piece }: PieceImageProps) {

  return (
    <img
      src={PIECE_IMAGES[piece as keyof typeof PIECE_IMAGES]}
      alt={piece}
      className="w-[90%] h-[90%] object-contain"
    />
  );    
}
