# Script PowerShell untuk Menjalankan Migration
# run_migration.ps1

Write-Host "=== Migration Script untuk Sistem Absensi Wajah ===" -ForegroundColor Green

# Cek apakah MySQL tersedia
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue

if (-not $mysqlPath) {
    Write-Host "ERROR: MySQL tidak ditemukan di PATH sistem" -ForegroundColor Red
    Write-Host "Silakan install MySQL atau tambahkan path MySQL ke environment variables" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Contoh path MySQL yang umum:" -ForegroundColor Yellow
    Write-Host "- C:\Program Files\MySQL\MySQL Server 8.0\bin" -ForegroundColor Cyan
    Write-Host "- C:\xampp\mysql\bin" -ForegroundColor Cyan
    Write-Host "- C:\wamp64\bin\mysql\mysql8.0.x\bin" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Atau jalankan migration secara manual melalui phpMyAdmin atau MySQL Workbench" -ForegroundColor Yellow
    exit 1
}

Write-Host "MySQL ditemukan di: $($mysqlPath.Source)" -ForegroundColor Green

# Prompt untuk credentials
$username = Read-Host "Masukkan username MySQL (default: root)"
if ([string]::IsNullOrEmpty($username)) { $username = "root" }

$password = Read-Host "Masukkan password MySQL" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

# Path ke file migration
$migrationFile = Join-Path $PSScriptRoot "migration.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: File migration.sql tidak ditemukan di: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Menjalankan migration..." -ForegroundColor Yellow

try {
    # Cara 1: Menggunakan Get-Content dan pipe
    Get-Content $migrationFile | mysql -u $username -p$passwordPlain
    Write-Host "Migration berhasil dijalankan!" -ForegroundColor Green
}
catch {
    Write-Host "ERROR saat menjalankan migration: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternatif lain yang bisa dicoba:" -ForegroundColor Yellow
    Write-Host "1. Gunakan Command Prompt (cmd) dengan perintah:" -ForegroundColor Cyan
    Write-Host "   mysql -u $username -p absensi_wajah < migration.sql" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Login ke MySQL dan gunakan SOURCE command:" -ForegroundColor Cyan
    Write-Host "   mysql -u $username -p" -ForegroundColor White
    Write-Host "   mysql> CREATE DATABASE IF NOT EXISTS absensi_wajah;" -ForegroundColor White
    Write-Host "   mysql> USE absensi_wajah;" -ForegroundColor White
    Write-Host "   mysql> SOURCE $migrationFile;" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Gunakan phpMyAdmin atau MySQL Workbench" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Tekan Enter untuk keluar..."
Read-Host
