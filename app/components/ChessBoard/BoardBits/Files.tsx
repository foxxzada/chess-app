export default function Files() {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    return (
        <div className="col-2 flex justify-around">
            {files.map(file => <div className="text-[var(--light-square-color)]">{file}</div>)}
        </div>
    )
}