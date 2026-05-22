$env:PATH = "$env:USERPROFILE\.cargo\bin;" + $env:PATH
Set-Location 'C:\pulp\src-tauri'
cargo check 2>&1
