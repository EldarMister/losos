import type { CSSProperties } from "react";

type NumberTickerProps = {
  value: number;
  format: (value: number) => string;
  className?: string;
};

const digitCharacters = Array.from({ length: 10 }, (_, digit) => String(digit));

export function NumberTicker({ value, format, className }: NumberTickerProps) {
  const formattedValue = format(value);
  let digitsToRight = Array.from(formattedValue).filter((character) => /\d/u.test(character)).length;

  return (
    <span className={["number-ticker", className].filter(Boolean).join(" ")} aria-label={formattedValue}>
      {Array.from(formattedValue).map((character, index) => {
        if (!/\d/u.test(character)) {
          return <span className="number-ticker-static" key={`static-${index}`} aria-hidden="true">{character}</span>;
        }

        digitsToRight -= 1;
        const digit = Number(character);
        const style = { "--number-ticker-digit": String(digit) } as CSSProperties;

        return (
          <span className="number-ticker-digit" key={`digit-${digitsToRight}`} aria-hidden="true">
            <span className="number-ticker-strip" style={style}>
              {digitCharacters.map((item) => <span key={item}>{item}</span>)}
            </span>
          </span>
        );
      })}
    </span>
  );
}
