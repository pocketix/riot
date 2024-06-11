package dbUtil

import (
	"github.com/MichalBures-OG/bp-bures-RIoT-commons/src/sharedUtils"
	"gorm.io/gorm"
	"log"
	"reflect"
)

type WhereClause = sharedUtils.Pair[string, []any]
type PreloadPath = string

func Where(s string, a ...any) WhereClause {
	return sharedUtils.NewPairOf(s, a)
}

func Preload(s ...string) []PreloadPath {
	return s
}

func prepareLoadQuery(g *gorm.DB, args ...any) *gorm.DB {
	query := g
	sharedUtils.ForEach(args, func(arg any) {
		switch typedArg := arg.(type) {
		case WhereClause:
			query = query.Where(typedArg.GetFirst(), typedArg.GetSecond()...)
			break
		case []PreloadPath:
			sharedUtils.ForEach(typedArg, func(preloadPathString PreloadPath) {
				query = query.Preload(preloadPathString)
			})
			break
		default:
			log.Printf("prepareLoadQuery: unexpected arg type: %s\n", reflect.TypeOf(typedArg).String())
		}
	})
	return query
}

func LoadEntitiesFromDB[T any](g *gorm.DB, args ...any) sharedUtils.Result[[]T] {
	entities := make([]T, 0)
	if err := prepareLoadQuery(g, args...).Find(&entities).Error; err != nil {
		return sharedUtils.NewFailureResult[[]T](err)
	}
	return sharedUtils.NewSuccessResult(entities)
}

func LoadEntityFromDB[T any](g *gorm.DB, args ...any) sharedUtils.Result[T] {
	var entity T
	if err := prepareLoadQuery(g, args...).First(&entity).Error; err != nil {
		return sharedUtils.NewFailureResult[T](err)
	}
	return sharedUtils.NewSuccessResult(entity)
}

func PersistEntityIntoDB[T any](g *gorm.DB, entityReference *T) error {
	return g.Save(entityReference).Error
}

func DoesSuchEntityExist[T any](g *gorm.DB, whereClauses ...WhereClause) sharedUtils.Result[bool] {
	entityCount := int64(0)
	query := g.Model(new(T))
	sharedUtils.ForEach(whereClauses, func(whereClause WhereClause) {
		query = query.Where(whereClause.GetFirst(), whereClause.GetSecond()...)
	})
	if err := query.Count(&entityCount).Error; err != nil {
		return sharedUtils.NewFailureResult[bool](err)
	}
	return sharedUtils.NewSuccessResult[bool](entityCount > 0)
}

func DeleteCertainEntityBasedOnId[T any](g *gorm.DB, id uint32) error {
	return g.Delete(new(T), id).Error
}

func DeleteEntitiesBasedOnSliceOfIds[T any](g *gorm.DB, ids []uint32) error {
	return g.Delete(new(T), ids).Error
}

func DeleteEntitiesBasedOnWhereClauses[T any](g *gorm.DB, whereClauses ...WhereClause) error {
	query := g
	sharedUtils.ForEach(whereClauses, func(whereClause WhereClause) {
		query = query.Where(whereClause.GetFirst(), whereClause.GetSecond()...)
	})
	return query.Delete(new(T)).Error
}
