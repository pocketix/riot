import styled from "styled-components";
import EmptyMessage from "../../ui/EmptyMessage";

const EmptyMessageWrapper = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  justify-content: center;
  align-items: center;
  overflow-y: auto;
`;

export default function DeviceManagement() {
  const isEmpty = true;
  if (isEmpty)
    return (
      <EmptyMessageWrapper>
        <EmptyMessage>No devices have been found.</EmptyMessage>
      </EmptyMessageWrapper>
    );
  return <div>Device Mangement</div>;
}
