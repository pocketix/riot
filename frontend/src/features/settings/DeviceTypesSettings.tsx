import { gql, useQuery } from "@apollo/client";
import styled from "styled-components";
import { GET_SD_TYPES } from "@/graphql/Queries";
import { SdTypesQuery, SdTypesQueryVariables } from "@/generated/graphql";
import Spinner from "@/ui/Spinner";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export default function DeviceTypesSettings() {
  const { data, loading, refetch } = useQuery<
    SdTypesQuery,
    SdTypesQueryVariables
  >(GET_SD_TYPES);
  console.log("SD Types Data:", JSON.stringify(data, null, 2));

  if (loading) return <Spinner />;
  return (
    <Container>
      <p>Manage your device types here.</p>
    </Container>
  );
}
