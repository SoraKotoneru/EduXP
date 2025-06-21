#!/bin/bash
DATESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
mkdir -p backups
cp server/db.sqlite backups/db_backup_$DATESTAMP.sqlite 