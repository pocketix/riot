import { useState } from "react";
import styled from "styled-components";
import { FaEdit, FaList, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { SdTypesQuery } from "@/generated/graphql";
import { Button } from "@/components/ui/button";
import { IoIosCloudOutline } from "react-icons/io";

const Card = styled.div`
  background: var(--color-grey-0);
  color: -var(--color-white);
  border-radius: 8px;
  padding: 16px;
  width: 100%;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0px 2px 6px var(--color-grey-200);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
`;

const Icon = styled.div`
  width: 40px;
  height: 40px;
  background: var(--color-grey-200);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
`;

const ParameterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  border-top: 1px solid var(--color-grey-300);
  padding-top: 5px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
`;

type DeviceTypeCardProps = {
  deviceType: SdTypesQuery["sdTypes"][0];
};
const DetailsButton = styled.button`
  background: var(--color-grey-400);
  color: var(--color-white);
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;

  &:hover {
    background: var(--color-grey-300);
  }
`;

export default function DeviceTypeCard({ deviceType }: DeviceTypeCardProps) {
  const [showAll, setShowAll] = useState(false);
  const { denotation, parameters } = deviceType;
  const visibleParams = parameters.slice(0, 2);
  const hiddenParams = parameters.slice(2);

  return (
    <Card>
      <Header>
        <Title>Weather station</Title>
        <Icon>
          <IoIosCloudOutline />
        </Icon>
      </Header>
      <p>Denotation: {denotation}</p>
      <p>Parameters:</p>
      <ParameterList>
        {visibleParams.map((param) => (
          <p key={param.id}>
            {param.denotation}: {param.type}
          </p>
        ))}
        {showAll &&
          hiddenParams.map((param) => (
            <p key={param.id}>
              {param.denotation}: {param.type}
            </p>
          ))}
      </ParameterList>
      {hiddenParams.length > 0 && (
        <DetailsButton onClick={() => setShowAll(!showAll)}>
          {showAll ? <FaChevronUp /> : <FaChevronDown />} Details
        </DetailsButton>
      )}
      <ButtonGroup>
        <Button>
          <FaEdit /> Edit
        </Button>
        <Button>
          <FaList /> View Instances
        </Button>
      </ButtonGroup>
    </Card>
  );
}
