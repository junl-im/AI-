using System.Diagnostics;
using System.Security.Cryptography;
using NAudio.Wave;

const int Port = 18717;
var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(24));
var allowedOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase) {
    "https://junl-im.github.io", "http://127.0.0.1:5173", "http://localhost:5173",
};
var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls($"http://127.0.0.1:{Port}");
var app = builder.Build();
var gate = new SemaphoreSlim(1, 1);
LoopbackSession? current = null;

app.Use(async (context, next) => {
    var origin = context.Request.Headers.Origin.ToString();
    if (origin.Length > 0 && !allowedOrigins.Contains(origin)) {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return;
    }
    if (origin.Length > 0) {
        context.Response.Headers.AccessControlAllowOrigin = origin;
        context.Response.Headers.Vary = "Origin";
        context.Response.Headers.AccessControlAllowHeaders = "X-SoriON-Token, Content-Type";
        context.Response.Headers.AccessControlAllowMethods = "GET, POST, OPTIONS";
        context.Response.Headers["Access-Control-Allow-Private-Network"] = "true";
    }
    if (context.Request.Method == "OPTIONS") {
        context.Response.StatusCode = StatusCodes.Status204NoContent;
        return;
    }
    if (context.Request.Headers["X-SoriON-Token"] != token) {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return;
    }
    await next(context);
});

app.MapGet("/status", () => Results.Ok(new { ready = true, captureActive = current is not null }));
app.MapPost("/capture/start", async () => {
    await gate.WaitAsync();
    try {
        if (current is not null) return Results.Conflict(new { error = "이미 녹음 중입니다." });
        current = new LoopbackSession();
        return Results.Ok(new { recording = true });
    } catch (Exception error) {
        return Results.Problem($"시스템 소리 녹음을 시작하지 못했습니다: {error.Message}", statusCode: 500);
    } finally { gate.Release(); }
});
app.MapPost("/capture/stop", async () => {
    await gate.WaitAsync();
    try {
        if (current is null) return Results.Conflict(new { error = "진행 중인 녹음이 없습니다." });
        var session = current;
        current = null;
        var wav = await session.StopAsync();
        return wav is null
            ? Results.UnprocessableEntity(new { error = "Windows 출력 소리가 무음입니다. 출력 장치와 기본 성우 재생을 확인해 주세요." })
            : Results.File(wav, "audio/wav", "sorion-system-capture.wav");
    } catch (Exception error) {
        return Results.Problem($"시스템 소리 녹음을 마치지 못했습니다: {error.Message}", statusCode: 500);
    } finally { gate.Release(); }
});
app.MapPost("/capture/cancel", async () => {
    await gate.WaitAsync();
    try {
        if (current is not null) {
            var session = current;
            current = null;
            await session.StopAsync();
        }
        return Results.Ok(new { recording = false });
    } finally { gate.Release(); }
});

await app.StartAsync();
var url = $"https://junl-im.github.io/AI-/?sorion-capture-token={token}";
Console.WriteLine("SoriON Windows 오디오 보조 앱이 실행 중입니다. 이 창을 닫으면 연결이 끊깁니다.");
Console.WriteLine("기본 성우 녹음 중에는 다른 앱의 소리도 함께 녹음될 수 있습니다.");
Console.WriteLine(url);
if (!args.Contains("--no-browser")) {
    try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); }
    catch { Console.WriteLine("브라우저를 열지 못했습니다. 위 주소를 복사해 여세요."); }
}
await app.WaitForShutdownAsync();

sealed class LoopbackSession {
    private readonly WasapiLoopbackCapture capture = new();
    private readonly MemoryStream stream = new();
    private readonly WaveFileWriter writer;
    private readonly TaskCompletionSource stopped = new(TaskCreationOptions.RunContinuationsAsynchronously);
    private float peak;
    private bool completed;
    private bool limitReached;

    public LoopbackSession() {
        writer = new WaveFileWriter(stream, capture.WaveFormat);
        capture.DataAvailable += (_, args) => {
            if (completed) return;
            if (stream.Length + args.BytesRecorded > 128_000_000) {
                limitReached = true;
                capture.StopRecording();
                return;
            }
            writer.Write(args.Buffer, 0, args.BytesRecorded);
            if (capture.WaveFormat.Encoding == WaveFormatEncoding.IeeeFloat) {
                for (var index = 0; index + 4 <= args.BytesRecorded; index += 4)
                    peak = Math.Max(peak, Math.Abs(BitConverter.ToSingle(args.Buffer, index)));
            } else if (capture.WaveFormat.BitsPerSample == 16) {
                for (var index = 0; index + 2 <= args.BytesRecorded; index += 2)
                    peak = Math.Max(peak, Math.Abs(BitConverter.ToInt16(args.Buffer, index) / 32768f));
            }
        };
        capture.RecordingStopped += (_, _) => stopped.TrySetResult();
        capture.StartRecording();
    }

    public async Task<byte[]?> StopAsync() {
        if (completed) return null;
        capture.StopRecording();
        await stopped.Task.WaitAsync(TimeSpan.FromSeconds(10));
        completed = true;
        writer.Dispose();
        capture.Dispose();
        if (limitReached) throw new InvalidOperationException("녹음 크기가 128MB를 넘었습니다. 대사를 나누어 저장해 주세요.");
        return peak >= 0.002f ? stream.ToArray() : null;
    }
}
