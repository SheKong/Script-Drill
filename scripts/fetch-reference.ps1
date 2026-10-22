param([string]$Uri, [string]$OutputFile)
$ErrorActionPreference = 'Stop'
Invoke-WebRequest -Uri $Uri -OutFile $OutputFile -TimeoutSec 30
