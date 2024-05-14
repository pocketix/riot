package dbClient

import (
	"database/sql"
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-backend-core/src/types"
	"github.com/MichalBures-OG/bp-bures-SfPDfSD-commons/src/util"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"testing"
)

func setupStubDatabaseConnection(t *testing.T) (*sql.DB, sqlmock.Sqlmock, *relationalDatabaseClientImpl) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error occurred while opening a stub database connection: %s", err.Error())
	}
	gormDB, err := gorm.Open(postgres.New(postgres.Config{Conn: db}), new(gorm.Config))
	if err != nil {
		t.Fatalf("an error occurred while opening a GORM database session: %s", err.Error())
	}
	session := new(gorm.Session)
	session.Logger = logger.Default.LogMode(logger.Silent)
	gormDB = gormDB.Session(session)
	return db, mock, &relationalDatabaseClientImpl{db: gormDB}
}

func TestPersistSDType(t *testing.T) {
	db, mock, client := setupStubDatabaseConnection(t)
	defer func(db *sql.DB) {
		_ = db.Close()
	}(db)
	mock.ExpectBegin()
	mock.ExpectQuery(`^INSERT INTO "sd_types"`).
		WithArgs("shelly1pro").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
	mock.ExpectQuery(`^INSERT INTO "sd_parameters"`).
		WithArgs(1, "relay_0_temperature", "number", 1, "relay_0_output", "boolean").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1).AddRow(2))
	mock.ExpectCommit()
	sdTypeDTO := types.SDTypeDTO{
		ID:         util.NewEmptyOptional[uint32](),
		Denotation: "shelly1pro",
		Parameters: []types.SDParameterDTO{{
			ID:         util.NewEmptyOptional[uint32](),
			Denotation: "relay_0_temperature",
			Type:       types.SDParameterTypeNumber,
		}, {
			ID:         util.NewEmptyOptional[uint32](),
			Denotation: "relay_0_output",
			Type:       types.SDParameterTypeTypeBoolean,
		}},
	}
	if sdTypePersistResult := client.PersistSDType(sdTypeDTO); sdTypePersistResult.IsFailure() {
		t.Fatalf("an error occurred while trying to persist the SD type: %s", sdTypePersistResult.GetError().Error())
	}
	if smUnfulfilledExpectationsError := mock.ExpectationsWereMet(); smUnfulfilledExpectationsError != nil {
		t.Fatalf("sqlmock: not all expectations were fulfilled: %s", smUnfulfilledExpectationsError.Error())
	}
}
