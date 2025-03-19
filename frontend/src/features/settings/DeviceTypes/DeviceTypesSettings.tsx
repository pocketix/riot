import { useQuery } from "@apollo/client";
import styled from "styled-components";
import { GET_SD_TYPES } from "@/graphql/Queries";
import { SdTypesQuery, SdTypesQueryVariables } from "@/generated/graphql";
import Spinner from "@/ui/Spinner";
import DeviceTypeCard from "./DeviceTypeCard";
import Heading from "@/ui/Heading";
import { Button } from "@/components/ui/button";
import { breakpoints } from "@/styles/Breakpoints";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Grid = styled.div`
  display: grid;
  gap: 1.5rem;
  /* align-items: start; */
  justify-content: center;
  grid-template-columns: 1fr;

  @media (min-width: ${breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export default function DeviceTypesSettings() {
  const { data, loading } = useQuery<
    SdTypesQuery,
    SdTypesQueryVariables
  >(GET_SD_TYPES);

  // console.log("SD Types Data:", JSON.stringify(data, null, 2));

  if (loading) return <Spinner />;
  if (!data?.sdTypes?.length) return <p>No device types found.</p>;

  return (
    <Container>
      <Header>
        <Heading variant="h2">
          Manage your device types here{" "}
          <span
            style={{
              fontWeight: "200",
              fontStyle: "italic",
              textWrap: "nowrap",
            }}>
            ({data?.sdTypes?.length} types)
          </span>
          .{" "}
        </Heading>
        <Button>+ Add new</Button>
      </Header>
      <Grid>
        {data.sdTypes.map((deviceType) => (
          <DeviceTypeCard key={deviceType.id} deviceType={deviceType} />
        ))}
      </Grid>
    </Container>
  );
}
