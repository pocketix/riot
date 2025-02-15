package internal

type TimeSeriesStoreEnvironment struct {
	InfluxToken  string
	InfluxUrl    string
	InfluxOrg    string
	InfluxBucket string
	AmqpURLValue string
}
