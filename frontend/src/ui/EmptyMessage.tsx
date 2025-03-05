import styled from "styled-components";

const StyledEmptyMessage = styled.div`
  color: hsl(var(--color-white));
  text-align: center;
  font-size: 1.6rem;
`;

type EmptyMessageProps = {
  children: string;
};

export default function EmptyMessage({ children }: EmptyMessageProps) {
  return <StyledEmptyMessage>{children}</StyledEmptyMessage>;
}
