# Multi Game Platform V2.3
# Batch 28301-28700
# ASCII safe diagnostic PowerShell smoke test.
# This version prints raw API responses when serial generation cannot be parsed.

$BackendBase = "http://localhost:3000/api"
$FrontendBase = "http://localhost:5173"
$TenantSlug = "a-shop"

$AdminEmail = "admin@example.com"
$AdminPassword = "123456"

function Write-Section($Text) {
  Write-Host ""
  Write-Host "==================================================" -ForegroundColor DarkGray
  Write-Host $Text -ForegroundColor Cyan
  Write-Host "==================================================" -ForegroundColor DarkGray
}

function Invoke-JsonApi($Method, $Url, $Body = $null, $Token = "") {
  $headers = @{
    "Content-Type" = "application/json"
  }

  if ($Token -ne "") {
    $headers["Authorization"] = "Bearer $Token"
  }

  try {
    if ($null -eq $Body) {
      return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers
    }

    $jsonBody = $Body | ConvertTo-Json -Depth 30
    Write-Host "REQUEST $Method $Url" -ForegroundColor DarkGray
    Write-Host $jsonBody -ForegroundColor DarkGray

    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers -Body $jsonBody
  } catch {
    Write-Host "API FAILED:" -ForegroundColor Red
    Write-Host $Url -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red

    if ($_.ErrorDetails.Message) {
      Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }

    return $null
  }
}

function Get-Data($Response) {
  if ($null -eq $Response) { return $null }

  if ($Response.PSObject.Properties.Name -contains "data") {
    return $Response.data
  }

  return $Response
}

function To-Array($Value) {
  if ($null -eq $Value) { return @() }

  if ($Value -is [System.Array]) {
    return $Value
  }

  if ($Value -is [System.Collections.IEnumerable] -and !($Value -is [string])) {
    return @($Value)
  }

  return @($Value)
}

function Get-Prop($Object, $Name) {
  if ($null -eq $Object) { return $null }

  if ($Object.PSObject.Properties.Name -contains $Name) {
    return $Object.$Name
  }

  return $null
}

function Extract-Campaigns($Response) {
  $data = Get-Data $Response

  if ($null -eq $data) { return @() }

  $items = Get-Prop $data "items"
  if ($items) { return To-Array $items }

  $campaigns = Get-Prop $data "campaigns"
  if ($campaigns) { return To-Array $campaigns }

  $rows = Get-Prop $data "rows"
  if ($rows) { return To-Array $rows }

  return To-Array $data
}

function Find-CampaignByGameType($Campaigns, $GameType) {
  foreach ($item in $Campaigns) {
    if (("$($item.gameType)").ToUpper() -eq $GameType) {
      return $item
    }
  }

  return $null
}

function Print-Json($Label, $Object) {
  Write-Host ""
  Write-Host $Label -ForegroundColor Magenta
  if ($null -eq $Object) {
    Write-Host "(null)" -ForegroundColor DarkGray
    return
  }

  $Object | ConvertTo-Json -Depth 30
}

function Deep-Find-Code($Object) {
  if ($null -eq $Object) { return $null }

  if ($Object -is [string]) {
    if ($Object.Length -ge 4) { return $Object }
    return $null
  }

  if ($Object -is [System.Array]) {
    foreach ($x in $Object) {
      $found = Deep-Find-Code $x
      if ($found) { return $found }
    }
    return $null
  }

  $preferredNames = @("code", "serialCode", "serial", "value", "couponCode")
  foreach ($name in $preferredNames) {
    $value = Get-Prop $Object $name
    if ($value) {
      if ($value -is [string]) { return $value }
      $found = Deep-Find-Code $value
      if ($found) { return $found }
    }
  }

  $arrayNames = @("codes", "items", "serialCodes", "rows", "list", "created", "createdCodes", "results")
  foreach ($name in $arrayNames) {
    $value = Get-Prop $Object $name
    if ($value) {
      $found = Deep-Find-Code $value
      if ($found) { return $found }
    }
  }

  return $null
}

Write-Section "STEP 1 - Backend health check"

Invoke-JsonApi "GET" "$BackendBase/health" | Out-Null
Invoke-JsonApi "GET" "$BackendBase/campaigns" | Out-Null
Write-Host "Backend check finished." -ForegroundColor Green

Write-Section "STEP 2 - Login"

$token = ""
$loginResult = Invoke-JsonApi "POST" "$BackendBase/auth/login" @{
  email = $AdminEmail
  password = $AdminPassword
}

$loginData = Get-Data $loginResult
if ($loginData -and $loginData.token) {
  $token = $loginData.token
  Write-Host "Login OK." -ForegroundColor Green
} else {
  Write-Host "Login failed or no token. Admin APIs may fail." -ForegroundColor Yellow
  Print-Json "Login raw response" $loginResult
}

Write-Section "STEP 3 - Load tenant campaigns"

$campaignResult = Invoke-JsonApi "GET" "$BackendBase/campaigns?tenantSlug=$TenantSlug" $null $token
$campaigns = Extract-Campaigns $campaignResult

Write-Host "Campaign count: $($campaigns.Count)" -ForegroundColor Green
Print-Json "Campaign list raw response" $campaignResult

foreach ($c in $campaigns) {
  Write-Host "Campaign: id=$($c.id) type=$($c.gameType) title=$($c.title) status=$($c.status) slug=$($c.slug)" -ForegroundColor Cyan
}

$gridCampaign = Find-CampaignByGameType $campaigns "GRID"
$wheelCampaign = Find-CampaignByGameType $campaigns "WHEEL"
$eggCampaign = Find-CampaignByGameType $campaigns "GOLDEN_EGG"

$targets = @(
  @{ label = "Premium Grid"; type = "GRID"; campaign = $gridCampaign; path = "premium-grid" },
  @{ label = "Wheel"; type = "WHEEL"; campaign = $wheelCampaign; path = "wheel" },
  @{ label = "Golden Egg"; type = "GOLDEN_EGG"; campaign = $eggCampaign; path = "golden-egg" }
)

foreach ($target in $targets) {
  if ($null -eq $target.campaign) {
    Write-Host "$($target.label): campaign not found for tenant $TenantSlug." -ForegroundColor Red
  } else {
    Write-Host "$($target.label): found campaign id=$($target.campaign.id)." -ForegroundColor Green
    Write-Host "$FrontendBase/play/$TenantSlug/$($target.path)" -ForegroundColor Cyan
  }
}

Write-Section "STEP 4 - Load GameConfig settings"

foreach ($target in $targets) {
  if ($null -eq $target.campaign) { continue }

  $id = $target.campaign.id
  $configResult = Invoke-JsonApi "GET" "$BackendBase/campaigns/$id/game-config" $null $token

  if ($null -ne $configResult) {
    Write-Host "$($target.label): GameConfig OK" -ForegroundColor Green
  } else {
    Write-Host "$($target.label): GameConfig failed" -ForegroundColor Red
  }
}

Write-Section "STEP 5 - Generate serial codes"

$serialMap = @{}

foreach ($target in $targets) {
  if ($null -eq $target.campaign) { continue }

  $id = $target.campaign.id
  $prefix = $target.type

  $body = @{
    quantity = 1
    count = 1
    batchQuantity = 1
    prefix = $prefix
    batchCode = "REMOTE"
    rewardChance = 1
    codeLength = 8
    expiresAt = $null
    note = "$($target.label) remote smoke test serial"
  }

  $generateUrl = "$BackendBase/serial-codes/campaigns/$id/generate"
  $generateResult = Invoke-JsonApi "POST" $generateUrl $body $token
  $generateData = Get-Data $generateResult
  $code = Deep-Find-Code $generateData

  if ($code) {
    $serialMap[$target.type] = $code
    Write-Host "$($target.label): serial code = $code" -ForegroundColor Green
  } else {
    Write-Host "$($target.label): could not parse generated serial code." -ForegroundColor Yellow
    Print-Json "$($target.label) generate raw response" $generateResult
  }
}

Write-Section "STEP 6 - verify-serial test"

foreach ($target in $targets) {
  if ($null -eq $target.campaign) { continue }

  $id = $target.campaign.id
  $code = $serialMap[$target.type]

  if (!$code) {
    Write-Host "$($target.label): no serial code. Skipping verify." -ForegroundColor Yellow
    continue
  }

  $body = @{
    code = $code
    serialCode = $code
    gameType = $target.type
    tenantSlug = $TenantSlug
    source = "powershell-remote-smoke-test"
  }

  $verifyResult = Invoke-JsonApi "POST" "$BackendBase/draw-engine/campaigns/$id/verify-serial" $body

  if ($null -ne $verifyResult) {
    Write-Host "$($target.label): verify OK" -ForegroundColor Green
    Print-Json "$($target.label) verify response" $verifyResult
  } else {
    Write-Host "$($target.label): verify failed" -ForegroundColor Red
  }
}

Write-Section "STEP 7 - play API test"

foreach ($target in $targets) {
  if ($null -eq $target.campaign) { continue }

  $id = $target.campaign.id
  $code = $serialMap[$target.type]

  if (!$code) {
    Write-Host "$($target.label): no serial code. Skipping play." -ForegroundColor Yellow
    continue
  }

  $body = @{
    gameType = $target.type
    code = $code
    serialCode = $code
    tenantSlug = $TenantSlug
    source = "powershell-remote-smoke-test"
    trafficSource = "direct"
    frontUrl = "$FrontendBase/play/$TenantSlug/$($target.path)"
    resultPayload = @{
      template = $target.path
      tenantSlug = $TenantSlug
      smokeTest = $true
    }
  }

  $playResult = Invoke-JsonApi "POST" "$BackendBase/draw-engine/campaigns/$id/play" $body

  if ($null -ne $playResult) {
    Write-Host "$($target.label): play OK." -ForegroundColor Green
    Print-Json "$($target.label) play response" $playResult
  } else {
    Write-Host "$($target.label): play failed" -ForegroundColor Red
  }
}

Write-Section "STEP 8 - Result summary"

foreach ($target in $targets) {
  if ($null -eq $target.campaign) {
    Write-Host "$($target.label): NOT TESTED - campaign not found." -ForegroundColor Yellow
    continue
  }

  $code = $serialMap[$target.type]
  if ($code) {
    Write-Host "$($target.label): tested with serial $code" -ForegroundColor Green
  } else {
    Write-Host "$($target.label): campaign found but no serial generated." -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "If Wheel or Golden Egg says campaign not found, create those activities for the same tenant first." -ForegroundColor Yellow
Write-Host "If serial generation response is printed but no code is parsed, send that raw response back for API patching." -ForegroundColor Yellow
