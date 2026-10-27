const PIECE_IMAGES = {
	wr: "/assets/pieces/wr.png",
	wn: "/assets/pieces/wn.png",
	wb: "/assets/pieces/wb.png",
	wq: "/assets/pieces/wq.png",
	wk: "/assets/pieces/wk.png",
	wp: "/assets/pieces/wp.png",
	br: "/assets/pieces/br.png",
	bn: "/assets/pieces/bn.png",
	bb: "/assets/pieces/bb.png",
	bq: "/assets/pieces/bq.png",
	bk: "/assets/pieces/bk.png",
	bp: "/assets/pieces/bp.png",
};

interface PieceImageProps {
	piece: string;
}

export default function PieceImage({ piece }: PieceImageProps) {
	return (
		<Image
			src={PIECE_IMAGES[piece as keyof typeof PIECE_IMAGES]}
			alt={piece}
			width={100}
			height={100}
			className="w-[100%] h-[100%] object-contain"
		/>
	);
}

import Image from "next/image";
