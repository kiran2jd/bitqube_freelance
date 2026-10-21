# PowerShell Automated Database Backup Script for Windows / Local Dev
param (
    [string]$ContainerName = "bitqube_postgres",
    [string]$Database = "bitqube_dev",
    [string]$User = "postgres",
    [string]$BackupDir = "backups"
)

$ErrorActionPreference = "Stop"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$BackupFile = Join-Path $BackupDir "bitqube_${Database}_${Timestamp}.dump"

Write-Host "Starting backup of database '$Database' from container '$ContainerName'..." -ForegroundColor Cyan
docker exec -i $ContainerName pg_dump -U $User -d $Database -Fc > $BackupFile

if (Test-Path $BackupFile) {
    $Size = (Get-Item $BackupFile).Length
    Write-Host "Backup completed successfully: $BackupFile ($Size bytes)" -ForegroundColor Green
} else {
    Write-Host "Backup failed!" -ForegroundColor Red
    exit 1
}
