type Props = {
  theme: "dark" | "light";
};
export default function Loading({ theme }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        color: theme === "dark" ? "#fff" : "#333",
      }}
    >
      جاري التحميل...
    </div>
  );
}
