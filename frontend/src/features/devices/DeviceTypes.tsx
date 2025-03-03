import MainButton from "../../ui/MainButton";
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

export default function DeviceTypes() {
  const isEmpty = true;
  if (isEmpty)
    return (
      <EmptyMessageWrapper>
        <EmptyMessage>No types of devices have been found.</EmptyMessage>
        <MainButton onClick={() => {}}>Define new type</MainButton>
      </EmptyMessageWrapper>
    );
  return <div>Device Types</div>;
}
