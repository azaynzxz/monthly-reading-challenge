# push_og_batches.ps1
# Pushes public/og/story-*.png files to GitHub in small batches to avoid HTTP 408 timeouts

$allFiles = Get-ChildItem "public/og/story-*.png" | Select-Object -ExpandProperty Name | Sort-Object
$batchSize = 20
$total = $allFiles.Count
$batches = [Math]::Ceiling($total / $batchSize)

Write-Host "Pushing $total story PNG files in $batches batches..."

for ($i = 0; $i -lt $batches; $i++) {
    $batch = $allFiles | Select-Object -Skip ($i * $batchSize) -First $batchSize
    $batchNum = $i + 1
    Write-Host "`nBatch $batchNum / $batches ($($batch.Count) files)..."

    foreach ($file in $batch) {
        git add "public/og/$file"
    }

    git commit -m "og: add story PNG batch $batchNum of $batches"
    git push origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Push failed at batch $batchNum. Retry manually."
        exit 1
    }
    Start-Sleep -Seconds 3
}

Write-Host "`nAll story OG PNGs pushed successfully!"
