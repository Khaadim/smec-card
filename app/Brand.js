// Logo rond SMEC accompagné du nom, pour les fonds bleus
export default function Brand({ size = 44, sub = true }) {
  return (
    <span className="brand-lock">
      <img src="/logo.png" alt="SMEC – School of Medicine English Club" width={size} height={size} />
      <span>
        <b>SMEC CLUB</b>
        {sub && <small>School of Medicine English Club</small>}
      </span>
    </span>
  );
}
