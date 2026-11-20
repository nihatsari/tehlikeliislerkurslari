Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class WindowBuzzer {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [DllImport("user32.dll")]
    public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
    public struct RECT { public int Left, Top, Right, Bottom; }
    public static void Buzz() {
        IntPtr hwnd = GetForegroundWindow();
        if (hwnd == IntPtr.Zero) return;
        RECT r;
        if (!GetWindowRect(hwnd, out r)) return;
        int w = r.Right - r.Left;
        int h = r.Bottom - r.Top;
        int ox = r.Left;
        int oy = r.Top;
        for (int i = 0; i < 14; i++) {
            int dx = (i % 2 == 0) ? 16 : -16;
            int dy = (i % 3 == 0) ? 10 : -10;
            MoveWindow(hwnd, ox + dx, oy + dy, w, h, true);
            System.Threading.Thread.Sleep(30);
        }
        MoveWindow(hwnd, ox, oy, w, h, true);
    }
}
"@
[WindowBuzzer]::Buzz()
[console]::beep(880, 200)
[console]::beep(1175, 350)
(New-Object Media.SoundPlayer "C:\Windows\Media\tada.wav").PlaySync()
