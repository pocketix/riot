import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export default function PersonalInfoSettings() {
  return (
    <Container>
      <p>Edit your personal information here.</p>
    </Container>
  );
}
