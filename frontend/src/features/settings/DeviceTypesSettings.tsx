import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export default function DeviceTypesSettings() {
  return (
    <Container>
      <p>Manage your device types here.</p>
    </Container>
  );
}
