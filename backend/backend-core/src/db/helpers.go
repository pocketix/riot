package db

import (
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/db/schema"
	cUtil "github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
)

func LoadEntitiesFromDB[T any](r *relationalDatabaseClientImpl, preloadPaths ...string) cUtil.Result[[]T] {
	query := r.db
	cUtil.ForEach(preloadPaths, func(preloadPath string) {
		query = query.Preload(preloadPath)
	})
	entities := make([]T, 0)
	if err := query.Find(&entities).Error; err != nil {
		return cUtil.NewFailureResult[[]T](nil)
	}
	return cUtil.NewSuccessResult(entities)
}

func PersistEntityIntoDB[T any](r *relationalDatabaseClientImpl, entityReference *T) error {
	return r.db.Save(entityReference).Error
}

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
