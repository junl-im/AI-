param(
  [Parameter(Mandatory = $true)][string]$TextPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [int]$Rate = 0,
  [string]$VoiceName = "",
  [string]$VoicePreset = "sori-warm",
  [ValidateSet("female", "male", "neutral")][string]$ExpectedGender = "neutral"
)

Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = @($synth.GetInstalledVoices() | Where-Object { $_.Enabled })
$koreanVoices = @($voices | Where-Object { $_.VoiceInfo.Culture.Name -like "ko-*" })

$voiceIndex = switch ($VoicePreset) {
  "sori-warm" { 0 }
  "on-clear" { 0 }
  "dam-calm" { 0 }
  "jun-deep" { 1 }
  "min-energetic" { 2 }
  default { throw "VOICE_PRESET_UNAVAILABLE: 지원하지 않는 음성 프리셋입니다: $VoicePreset" }
}

if ($ExpectedGender -eq "male") {
  $compatibleVoices = @($koreanVoices | Where-Object { $_.VoiceInfo.Gender.ToString() -eq "Male" })
} elseif ($ExpectedGender -eq "female") {
  $compatibleVoices = @($koreanVoices | Where-Object { $_.VoiceInfo.Gender.ToString() -eq "Female" })
} else {
  $compatibleVoices = @($koreanVoices | Where-Object {
    $_.VoiceInfo.Gender.ToString() -in @("Neutral", "NotSet")
  })
}

$preferredPattern = switch ($VoicePreset) {
  "sori-warm" { "sunhi|yuna|heami|seoyeon" }
  "on-clear" { "injoon|hyunsu" }
  "dam-calm" { "sora|jimin|natural|neutral" }
  "jun-deep" { "minsu|bongjin|yong|deep|baritone" }
  "min-energetic" { "young|energetic" }
}

if ($VoiceName) {
  $selected = $compatibleVoices | Where-Object { $_.VoiceInfo.Name -eq $VoiceName } | Select-Object -First 1
  if (-not $selected) {
    throw "VOICE_PRESET_UNAVAILABLE: 설정한 Windows 음성 '$VoiceName'이 한국어 또는 프리셋 성별($ExpectedGender)과 맞지 않습니다. 다른 성별 음성으로 자동 대체하지 않습니다."
  }
} else {
  $preferred = $compatibleVoices | Where-Object { $_.VoiceInfo.Name -match $preferredPattern } | Select-Object -First 1
  if ($preferred) {
    $selected = $preferred
  } elseif ($compatibleVoices.Count -gt 0) {
    $selected = $compatibleVoices[$voiceIndex % $compatibleVoices.Count]
  }
}

if (-not $selected) {
  $genderLabel = switch ($ExpectedGender) {
    "male" { "남성" }
    "female" { "여성" }
    default { "중성" }
  }
  throw "VOICE_PRESET_UNAVAILABLE: 설치된 $genderLabel Windows 한국어 음성이 없습니다. 다른 성별 음성으로 자동 대체하지 않습니다. Windows 언어 설정에서 한국어 음성 패키지를 설치해 주세요."
}

$synth.SelectVoice($selected.VoiceInfo.Name)
$synth.Rate = [Math]::Max(-10, [Math]::Min(10, $Rate))
$synth.SetOutputToWaveFile($OutputPath)
$text = [System.IO.File]::ReadAllText($TextPath, [System.Text.Encoding]::UTF8)
$synth.Speak($text)
$synth.Dispose()
