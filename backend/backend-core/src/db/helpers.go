package db

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/schema"
	cUtil "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func (r *relationalDatabaseClientImpl) getSDTypeEntityByIdMap() cUtil.Result[map[uint32]schema.SDTypeEntity] {
	var sdTypeEntities []schema.SDTypeEntity
	err := r.db.Preload("Parameters").Find(&sdTypeEntities).Error
	if err != nil {
		return cUtil.NewFailureResult[map[uint32]schema.SDTypeEntity](err)
	}
	sdTypeEntityByIdMap := make(map[uint32]schema.SDTypeEntity)
	for _, sdTypeEntity := range sdTypeEntities {
		sdTypeEntityByIdMap[sdTypeEntity.ID] = sdTypeEntity
	}
	return cUtil.NewSuccessResult[map[uint32]schema.SDTypeEntity](sdTypeEntityByIdMap)
}
