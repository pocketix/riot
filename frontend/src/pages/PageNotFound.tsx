import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import MainButton from "../ui/MainButton";

const StyledPageNotFound = styled.main`
  height: 100vh;
  background-image: linear-gradient(
    to bottom,
    var(--primary),
    var(--secondary)
  );
  color: var(--color-white);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
`;

const Message = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 2rem;
`;

function PageNotFound() {
  const navigate = useNavigate();

  return (
    <StyledPageNotFound>
      <Message>The page you are looking for could not be found 😢</Message>
      <MainButton onClick={() => navigate(-1)}>← Go back</MainButton>
    </StyledPageNotFound>
  );
}

export default PageNotFound;
