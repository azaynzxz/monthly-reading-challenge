# push_og_batches_v2.ps1
# Resumes pushing remaining story PNGs (batches 4-7) with smaller batch size of 10

$allFiles = Get-ChildItem "public/og/story-*.png" | Select-Object -ExpandProperty Name | Sort-Object

# Find what's already on remote by checking git status
$unpushedFiles = git ls-files --others --exclude-standard "public/og/story-*.png" 2>$null
if (!$unpushedFiles) {
    # All files are tracked - check which need to be pushed
    $unpushedFiles = git diff --name-only origin/main HEAD -- "public/og/story-*.png" 2>$null
}

# Simpler: just add all remaining untracked/unstaged story PNGs
$remaining = git status --short "public/og/story-*.png" | ForEach-Object { $_.Substring(3).Trim() }

if (!$remaining) {
    Write-Host "All story PNGs already committed. Just pushing..."
    git push origin main
    exit 0
}

Write-Host "Found $($remaining.Count) uncommitted story PNGs to push..."

$batchSize = 10
$batches = [Math]::Ceiling($remaining.Count / $batchSize)

for ($i = 0; $i -lt $batches; $i++) {
    $batch = $remaining | Select-Object -Skip ($i * $batchSize) -First $batchSize
    $batchNum = $i + 1
    Write-Host "`nBatch $batchNum / $batches ($($batch.Count) files)..."

    foreach ($file in $batch) {
        git add $file
    }

    git commit -m "og: story PNG batch $batchNum (resume)"
    
    $retries = 3
    for ($r = 0; $r -lt $retries; $r++) {
        git push origin main
        if ($LASTEXITCODE -eq 0) { break }
        Write-Host "Push failed, retrying in 5s..."
        Start-Sleep -Seconds 5
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Push failed after retries at batch $batchNum."
        exit 1
    }
    Start-Sleep -Seconds 2
}

Write-Host "`nAll story OG PNGs pushed!"
