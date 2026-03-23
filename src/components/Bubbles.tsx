const BUBBLES = [
  { size: 120, top: "5%", left: "3%", color: "#F9A8C9", delay: "0s" },
  { size: 80, top: "15%", right: "6%", color: "#A8D8F9", delay: "1.5s" },
  { size: 60, bottom: "10%", left: "8%", color: "#B8F0C8", delay: "3s" },
  { size: 100, bottom: "20%", right: "4%", color: "#FDE89A", delay: "2s" },
  { size: 50, top: "40%", left: "1%", color: "#F9A8C9", delay: "4s" },
] as const;

export default function Bubbles() {
  return (
    <>
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className="bubble"
          style={{
            width: b.size,
            height: b.size,
            top: "top" in b ? b.top : undefined,
            left: "left" in b ? b.left : undefined,
            right: "right" in b ? b.right : undefined,
            bottom: "bottom" in b ? b.bottom : undefined,
            background: b.color,
            animationDelay: b.delay,
          }}
        />
      ))}
    </>
  );
}
