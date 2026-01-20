# 自動Gitコミット・プッシュスクリプト
# ファイル変更を監視して自動的にコミット・プッシュします

$repoPath = $PSScriptRoot
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $repoPath
$watcher.Filter = "*.*"
$watcher.IncludeSubdirectories = $false
$watcher.EnableRaisingEvents = $true

# 監視対象外ファイル
$excludeFiles = @(".git", "auto-commit.ps1", ".gitignore")

# 変更をキューに追加（重複を避けるため）
$changeQueue = New-Object System.Collections.Queue
$isProcessing = $false

# ファイル変更イベントハンドラ
$action = {
    $path = $Event.SourceEventArgs.FullPath
    $fileName = Split-Path $path -Leaf
    
    # 監視対象外ファイルをスキップ
    $shouldExclude = $false
    foreach ($exclude in $excludeFiles) {
        if ($path -like "*$exclude*") {
            $shouldExclude = $true
            break
        }
    }
    
    if (-not $shouldExclude) {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] 変更検出: $fileName" -ForegroundColor Yellow
        $changeQueue.Enqueue($path)
    }
}

# イベントを登録
Register-ObjectEvent -InputObject $watcher -EventName "Changed" -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Created" -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Deleted" -Action $action | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName "Renamed" -Action $action | Out-Null

# コミット・プッシュ関数
function Commit-AndPush {
    param([string[]]$files)
    
    if ($isProcessing) {
        return
    }
    
    $isProcessing = $true
    
    try {
        Set-Location $repoPath
        
        # 変更されたファイルをステージング
        git add .
        
        # 変更があるか確認
        $status = git status --porcelain
        if ($status) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            $commitMessage = "自動保存: $timestamp"
            
            Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] コミット中..." -ForegroundColor Green
            git commit -m $commitMessage
            
            Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] プッシュ中..." -ForegroundColor Green
            git push
            
            Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] 保存完了" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] エラー: $_" -ForegroundColor Red
    }
    finally {
        $isProcessing = $false
    }
}

# 定期的に変更を処理（5秒ごと）
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "自動Git保存を開始しました" -ForegroundColor Cyan
Write-Host "リポジトリ: $repoPath" -ForegroundColor Cyan
Write-Host "終了するには Ctrl+C を押してください" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

while ($true) {
    Start-Sleep -Seconds 5
    
    if ($changeQueue.Count -gt 0 -and -not $isProcessing) {
        $files = @()
        while ($changeQueue.Count -gt 0) {
            $files += $changeQueue.Dequeue()
        }
        Commit-AndPush -files $files
    }
}
