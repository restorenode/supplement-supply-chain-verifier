import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export default function Button({ variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`btn ${variant} ${props.className ?? ""}`.trim()}
    />
  );
}
