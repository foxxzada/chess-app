export default function Ranks() {
    const ranks = [8,7,6,5,4,3,2,1]
    return (
        <div className="flex flex-col justify-around">
            {ranks.map(rank => <div className="text-[var(--light-square-color)]">{rank}</div>)}
        </div>
    )
}