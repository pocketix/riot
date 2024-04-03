package service

import (
	"errors"
	"fmt"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/constants"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/rabbitmq"
	cTypes "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/types"
	"log"
)

var rabbitMQClient rabbitmq.Client

func SetupRabbitMQClient() {
	client := rabbitmq.NewClient()
	rabbitMQClient = client
}

func CheckForSDInstanceRegistrationRequests() {
	err := rabbitmq.ConsumeJSONMessages(rabbitMQClient, constants.SDInstanceRegistrationRequestsQueueName, func(messagePayload cTypes.RequestForSDInstanceRegistration) error {
		sd := messagePayload.SD
		uid := sd.UID
		sdInstanceExistenceCheckResult := (*db.GetRelationalDatabaseClientInstance()).DoesSDInstanceExist(uid)
		if sdInstanceExistenceCheckResult.IsFailure() {
			return errors.New(fmt.Sprintf("couldn't check the existence of SD instance with UID: '%s'", uid))
		}
		if sdInstanceExistenceCheckResult.GetPayload() {
			log.Println(fmt.Sprintf("SD instance with UID: '%s' already exists", uid))
			return nil
		}
		sdTypeDenotation := sd.Type
		sdTypeLoadResult := (*db.GetRelationalDatabaseClientInstance()).LoadSDTypeBasedOnDenotation(sdTypeDenotation)
		if sdTypeLoadResult.IsFailure() {
			return errors.New(fmt.Sprintf("couldn't load database record of the '%s' SD type", sdTypeDenotation))
		}
		sdInstanceDTO := types.SDInstanceDTO{
			UID:             uid,
			ConfirmedByUser: false,
			UserIdentifier:  uid,
			SDType:          sdTypeLoadResult.GetPayload(),
		}
		persistResult := (*db.GetRelationalDatabaseClientInstance()).PersistSDInstance(sdInstanceDTO)
		if persistResult.IsFailure() {
			return errors.New("couldn't persist the SD instance")
		}
		return nil
	})
	if err != nil {
		log.Printf("Consumption of messages from the '%s' queue has failed", constants.SDInstanceRegistrationRequestsQueueName)
	}
}
