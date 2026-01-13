
$files = git status --porcelain | ForEach-Object { $_.Substring(3).Trim('"') }
if (!$files) { Write-Host "No files to commit."; exit }

$batchSize = 3
$totalFiles = $files.Count
$chunks = [Math]::Ceiling($totalFiles / $batchSize)

Write-Host "Found $totalFiles files. Processing in $chunks chunks of size $batchSize."

for ($i = 0; $i -lt $chunks; $i++) {
    $currentBatch = $files | Select-Object -Skip ($i * $batchSize) -First $batchSize
    $batchNum = $i + 1
    Write-Host "Processing chunk $batchNum of $chunks..."

    foreach ($file in $currentBatch) {
        # Check if file exists (it should)
        if (Test-Path $file) {
            git add "$file"
        }
    }

    git commit -m "Add content chunk $batchNum of $chunks"
    
    Write-Host "Pushing chunk $batchNum..."
    git push
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Push failed for chunk $batchNum. Stopping."
        exit 1
    }
    
    Start-Sleep -Seconds 2
}
Write-Host "Done!"
