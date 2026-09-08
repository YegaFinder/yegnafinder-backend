# YegnaFinder ops: listing approval via API (interim, no admin UI)
# Usage:
#   $env:API_BASE = "http://localhost:8000/api/v1"
#   $env:ADMIN_TOKEN = "<JWT for an Admin or Moderator user>"
#   .\scripts\ops\listing-approval.ps1 -Action queue
#   .\scripts\ops\listing-approval.ps1 -Action get -ListingId "<uuid>"
#   .\scripts\ops\listing-approval.ps1 -Action approve -ListingId "<uuid>"
#   .\scripts\ops\listing-approval.ps1 -Action reject -ListingId "<uuid>" -Reason "Missing logo"

param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("queue", "get", "approve", "reject", "public")]
  [string]$Action,

  [string]$ListingId,
  [string]$Reason = "Rejected by ops"
)

$ErrorActionPreference = "Stop"

$apiBase = if ($env:API_BASE) { $env:API_BASE.TrimEnd("/") } else { "http://localhost:8000/api/v1" }
$token = $env:ADMIN_TOKEN

if (-not $token -and $Action -ne "public") {
  throw "Set ADMIN_TOKEN to a JWT issued for an Admin or Moderator user."
}

$headers = @{
  Authorization = "Bearer $token"
  "Content-Type" = "application/json"
}

switch ($Action) {
  "queue" {
    Invoke-RestMethod -Method Get -Uri "$apiBase/admin/listings?status=pending" -Headers $headers
  }
  "get" {
    if (-not $ListingId) { throw "ListingId is required" }
    Invoke-RestMethod -Method Get -Uri "$apiBase/admin/listings/$ListingId" -Headers $headers
  }
  "approve" {
    if (-not $ListingId) { throw "ListingId is required" }
    Invoke-RestMethod -Method Post -Uri "$apiBase/admin/listings/$ListingId/approve" -Headers $headers
  }
  "reject" {
    if (-not $ListingId) { throw "ListingId is required" }
    $body = @{ reason = $Reason } | ConvertTo-Json
    Invoke-RestMethod -Method Post -Uri "$apiBase/admin/listings/$ListingId/reject" -Headers $headers -Body $body
  }
  "public" {
    Invoke-RestMethod -Method Get -Uri "$apiBase/listings"
  }
}
