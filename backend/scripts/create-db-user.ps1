<#
  One-time local setup (Windows):
    1. Generates a strong random password
    2. Creates the PostgreSQL login role "student_app" with that password
       (the app should not connect as the "postgres" superuser)
    3. Creates the "student_management" database owned by student_app
    4. Writes DB_USER / DB_PASSWORD into backend/.env
    5. Creates the tables (npm run db:setup)

  You are asked for the *postgres* superuser password once. It is used only
  for this run and is never saved.

  Run from the backend folder:
    powershell -ExecutionPolicy Bypass -File scripts\create-db-user.ps1
#>

$ErrorActionPreference = 'Stop'

$AppUser = 'student_app'
$DbName  = 'student_management'
$DbHost  = 'localhost'
$DbPort  = '5432'

$BackendDir = Split-Path -Parent $PSScriptRoot
$EnvFile    = Join-Path $BackendDir '.env'

# --- Locate psql ------------------------------------------------------------
$psql = (Get-Command psql -ErrorAction SilentlyContinue).Source
if (-not $psql) {
    $psql = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\psql.exe' -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $psql) { throw 'psql.exe not found. Is PostgreSQL installed?' }
Write-Host "Using $psql"

if (-not (Test-Path $EnvFile)) {
    Copy-Item (Join-Path $BackendDir '.env.example') $EnvFile
    Write-Host 'Created .env from .env.example'
}

# --- Generate the app password (letters + digits only: safe in SQL and .env) ---
$chars = [char[]]'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$AppPassword = -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })

# --- Ask for the postgres superuser password (used only in this process) -----
$secure = Read-Host 'Enter the password of the "postgres" superuser' -AsSecureString
$env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))

function Invoke-Psql([string]$Sql) {
    $out = & $psql -h $DbHost -p $DbPort -U postgres -d postgres -v ON_ERROR_STOP=1 -tAc $Sql
    if ($LASTEXITCODE -ne 0) { throw "psql failed running: $Sql" }
    return $out
}

try {
    # 1. Create the role, or reset its password if it already exists
    Invoke-Psql @"
DO `$`$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = '$AppUser') THEN
    ALTER ROLE $AppUser WITH LOGIN PASSWORD '$AppPassword';
  ELSE
    CREATE ROLE $AppUser WITH LOGIN PASSWORD '$AppPassword';
  END IF;
END
`$`$;
"@ | Out-Null
    Write-Host "Role '$AppUser' is ready"

    # 2. Create the database (or hand an existing one over to the app role)
    $exists = Invoke-Psql "SELECT 1 FROM pg_database WHERE datname = '$DbName'"
    if ($exists -eq '1') {
        Invoke-Psql "ALTER DATABASE $DbName OWNER TO $AppUser" | Out-Null
        Write-Host "Database '$DbName' already existed; owner set to '$AppUser'"
    } else {
        Invoke-Psql "CREATE DATABASE $DbName OWNER $AppUser" | Out-Null
        Write-Host "Created database '$DbName' owned by '$AppUser'"
    }
}
finally {
    # Wipe the superuser password from this process
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    $secure.Dispose()
}

# --- 3. Save credentials to .env (UTF-8 without BOM) -------------------------
$updates = [ordered]@{
    DB_HOST = $DbHost; DB_PORT = $DbPort; DB_NAME = $DbName
    DB_USER = $AppUser; DB_PASSWORD = $AppPassword
}
$content = [IO.File]::ReadAllText($EnvFile)
foreach ($key in $updates.Keys) {
    $line = "$key=$($updates[$key])"
    if ($content -match "(?m)^$key=.*$") {
        $content = [regex]::Replace($content, "(?m)^$key=.*$", $line)
    } else {
        $content = $content.TrimEnd() + "`r`n$line`r`n"
    }
}
[IO.File]::WriteAllText($EnvFile, $content, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Saved DB_USER and DB_PASSWORD to $EnvFile"

# --- 4. Create the tables as the app user -----------------------------------
Push-Location $BackendDir
try {
    npm run db:setup
    if ($LASTEXITCODE -ne 0) { throw 'npm run db:setup failed' }
} finally {
    Pop-Location
}

Write-Host ''
Write-Host 'Done. Start the backend with: npm run dev' -ForegroundColor Green
