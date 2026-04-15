$SourcePath = "d:\Naser-Programs\MYF-Site-main3"
$DestPath = "d:\Naser-Programs\MYF-Site-Clean-Source"

Write-Host "Creating clean repository folder at $DestPath..." -ForegroundColor Cyan

if (Test-Path $DestPath) {
    Remove-Item $DestPath -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $DestPath | Out-Null

$IncludeFolders = @(
    "components",
    "data",
    "android",
    "api",
    "hooks",
    "lib",
    "public",
    "scripts",
    "server",
    "services",
    "src",
    "stores",
    "translations",
    "types",
    "utils",
    ".github"
)

$IncludeFiles = @(
    "App.tsx",
    "index.html",
    "index.tsx",
    "server.cjs",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "vite.config.ts",
    "capacitor.config.ts",
    "tailwind.config.js",
    "postcss.config.js",
    "constants.ts",
    ".env.clean",
    "vite-env.d.ts",
    "types.ts",
    ".gitignore",
    ".dockerignore",
    "docker-compose.yml",
    "Dockerfile",
    "deploy.sh",
    "nginx.conf",
    "nginx_app.conf"
)

foreach ($folder in $IncludeFolders) {
    $srcFolder = Join-Path $SourcePath $folder
    if (Test-Path $srcFolder) {
        Copy-Item -Path $srcFolder -Destination (Join-Path $DestPath $folder) -Recurse -Force
        Write-Host "Copied folder: $folder" -ForegroundColor Green
    }
}

foreach ($file in $IncludeFiles) {
    $srcFile = Join-Path $SourcePath $file
    if (Test-Path $srcFile) {
        Copy-Item -Path $srcFile -Destination (Join-Path $DestPath $file) -Force
        Write-Host "Copied file: $file" -ForegroundColor Green
    }
}

# Clean unwanted files inside the copied data directory (like the massive SQL databases)
$DataFolder = Join-Path $DestPath "data"
if (Test-Path $DataFolder) {
    # Only keep the schema snapshot or JSON files, remove massive .sqlite databases
    Get-ChildItem -Path $DataFolder -Include *.sqlite* -Recurse | Remove-Item -Force
    Write-Host "Removed heavy .sqlite databases from clean copy." -ForegroundColor Yellow
}

Write-Host "Done! Your clean repository is ready at: $DestPath" -ForegroundColor Cyan
