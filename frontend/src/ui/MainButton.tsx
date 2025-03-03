import styled from "styled-components";

const GradientButton = styled.button`
  position: relative;
  padding: 0.8rem 3rem;
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--color-white);
  border: none;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);
  text-align: center;
  cursor: pointer;
  outline: none;
  transition: all 0.3s ease;
  overflow: hidden;
  margin: 1rem auto;
  display: inline-block;

  &:hover {
    backdrop-filter: blur(12px);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.97);
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 25px;
    padding: 2px;
    background: linear-gradient(
      90deg,
      var(--color-neon-1),
      var(--color-neon-2)
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }
`;

export default function Button({
  children,
  onClick,
}: {
  children: string;
  onClick: () => void;
}) {
  return <GradientButton onClick={onClick}>{children}</GradientButton>;
}
