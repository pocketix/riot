import { gql } from "@apollo/client";

export const GET_TIME_SERIES_DATA = gql`
  query StatisticsQuerySensorsWithFields($sensors: SensorsWithFields!, $request: StatisticsInput) {
    statisticsQuerySensorsWithFields(sensors: $sensors, request: $request) {
      data
      time
      deviceId
    }
  }
`