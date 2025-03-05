import Heading from "../ui/Heading";
import styled from "styled-components";
import DeviceManagement from "../features/devices/DeviceManagement";

const StyledPage = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding: 2rem;
  color: hsl(var(--color-white));
  overflow: hidden;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
`;

export default function Devices() {
  return (
    <StyledPage>
      <Heading>Devices</Heading>
      <ContentWrapper>
        <DeviceManagement />
      </ContentWrapper>
    </StyledPage>
  );
}
