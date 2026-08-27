using System;
using System.Drawing;
using System.IO;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace PortalIskakFatoniApp
{
    static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }

    public class MainForm : Form
    {
        private const string BASE_URL = "https://iskakfatoni.github.io/portal-iskakfatoni/";
        private const string URL_PORTAL = BASE_URL + "portal.html";
        private const string URL_ABSENSI = BASE_URL + "absensi.html";
        private const string URL_GURU = BASE_URL + "pages/guru/index.html";
        private const string URL_REKAP = BASE_URL + "pages/guru/rekap.html";
        private const string URL_DATABASE = BASE_URL + "pages/database/db-manager.html";
        private const string URL_ADMIN = BASE_URL + "admin.html";

        private WebView2 webView;
        private Panel bottomToolbar;
        private FlowLayoutPanel leftNavFlow;
        private FlowLayoutPanel rightControlFlow;
        private ProgressBar progressBar;
        private Label statusLabel;

        private Button btnNavPortal;
        private Button btnNavAbsensi;
        private Button btnNavGuru;
        private Button btnNavRekap;
        private Button btnNavDatabase;
        private Button btnNavAdmin;

        private Button btnBack;
        private Button btnForward;
        private Button btnReload;
        private Button btnFullscreen;

        private bool isFullscreen = false;
        private FormWindowState prevWindowState;
        private FormBorderStyle prevBorderStyle;

        public MainForm()
        {
            InitializeFormSettings();
            InitializeComponents();
            InitializeWebViewAsync();
        }

        private void InitializeFormSettings()
        {
            this.Text = "Portal Iskak Fatoni - Desktop Application";
            this.Size = new Size(1280, 820);
            this.MinimumSize = new Size(800, 600);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(9, 13, 22); // #090d16
            this.ForeColor = Color.FromArgb(241, 245, 249);
            this.KeyPreview = true;

            // Load Application Icon if available
            string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "app_icon.ico");
            if (File.Exists(iconPath))
            {
                try { this.Icon = new Icon(iconPath); } catch { }
            }

            this.KeyDown += new KeyEventHandler(MainForm_KeyDown);
        }

        private void InitializeComponents()
        {
            // 1. Progress Bar (Top of toolbar indicator)
            progressBar = new ProgressBar();
            progressBar.Dock = DockStyle.Bottom;
            progressBar.Height = 2;
            progressBar.Style = ProgressBarStyle.Marquee;
            progressBar.MarqueeAnimationSpeed = 30;
            progressBar.Visible = false;

            // 2. Bottom Toolbar Panel
            bottomToolbar = new Panel();
            bottomToolbar.Dock = DockStyle.Bottom;
            bottomToolbar.Height = 56;
            bottomToolbar.BackColor = Color.FromArgb(15, 23, 42); // #0f172a
            bottomToolbar.Padding = new Padding(12, 6, 12, 6);

            // Paint elegant top border on bottom toolbar
            bottomToolbar.Paint += (s, e) =>
            {
                using (Pen borderPen = new Pen(Color.FromArgb(30, 41, 59), 1.5f))
                {
                    e.Graphics.DrawLine(borderPen, 0, 0, bottomToolbar.Width, 0);
                }
            };

            // Left Navigation Buttons Container
            leftNavFlow = new FlowLayoutPanel();
            leftNavFlow.Dock = DockStyle.Left;
            leftNavFlow.AutoSize = true;
            leftNavFlow.AutoSizeMode = AutoSizeMode.GrowAndShrink;
            leftNavFlow.BackColor = Color.Transparent;
            leftNavFlow.WrapContents = false;

            btnNavPortal = CreateNavButton("🏠 Portal", URL_PORTAL);
            btnNavAbsensi = CreateNavButton("📱 Presensi Siswa", URL_ABSENSI);
            btnNavGuru = CreateNavButton("👨‍🏫 Sesi Guru", URL_GURU);
            btnNavRekap = CreateNavButton("📊 Rekap", URL_REKAP);
            btnNavDatabase = CreateNavButton("🗄️ Database", URL_DATABASE);
            btnNavAdmin = CreateNavButton("🛡️ Admin Hub", URL_ADMIN);

            leftNavFlow.Controls.Add(btnNavPortal);
            leftNavFlow.Controls.Add(btnNavAbsensi);
            leftNavFlow.Controls.Add(btnNavGuru);
            leftNavFlow.Controls.Add(btnNavRekap);
            leftNavFlow.Controls.Add(btnNavDatabase);
            leftNavFlow.Controls.Add(btnNavAdmin);

            // Right Control Buttons Container
            rightControlFlow = new FlowLayoutPanel();
            rightControlFlow.Dock = DockStyle.Right;
            rightControlFlow.AutoSize = true;
            rightControlFlow.AutoSizeMode = AutoSizeMode.GrowAndShrink;
            rightControlFlow.BackColor = Color.Transparent;
            rightControlFlow.WrapContents = false;

            btnBack = CreateControlButton("◀", "Kembali (Alt+Left)", (s, e) => { if (webView != null && webView.CanGoBack) webView.GoBack(); });
            btnForward = CreateControlButton("▶", "Maju (Alt+Right)", (s, e) => { if (webView != null && webView.CanGoForward) webView.GoForward(); });
            btnReload = CreateControlButton("🔄", "Muat Ulang (F5)", (s, e) => { if (webView != null) webView.Reload(); });
            btnFullscreen = CreateControlButton("⛶", "Layar Penuh (F11)", (s, e) => ToggleFullscreen());

            statusLabel = new Label();
            statusLabel.Text = "⚡ Siap";
            statusLabel.ForeColor = Color.FromArgb(148, 163, 184);
            statusLabel.Font = new Font("Segoe UI", 8.5f, FontStyle.Regular);
            statusLabel.AutoSize = true;
            statusLabel.Margin = new Padding(8, 12, 8, 0);

            rightControlFlow.Controls.Add(statusLabel);
            rightControlFlow.Controls.Add(btnBack);
            rightControlFlow.Controls.Add(btnForward);
            rightControlFlow.Controls.Add(btnReload);
            rightControlFlow.Controls.Add(btnFullscreen);

            bottomToolbar.Controls.Add(leftNavFlow);
            bottomToolbar.Controls.Add(rightControlFlow);

            // 3. WebView2 Control (Main Area)
            webView = new WebView2();
            webView.Dock = DockStyle.Fill;
            webView.DefaultBackgroundColor = Color.FromArgb(9, 13, 22);

            // Add to Form
            this.Controls.Add(webView);
            this.Controls.Add(progressBar);
            this.Controls.Add(bottomToolbar);
        }

        private Button CreateNavButton(string text, string targetUrl)
        {
            Button btn = new Button();
            btn.Text = text;
            btn.Tag = targetUrl;
            btn.Height = 38;
            btn.AutoSize = true;
            btn.FlatStyle = FlatStyle.Flat;
            btn.BackColor = Color.FromArgb(30, 41, 59); // #1e293b
            btn.ForeColor = Color.FromArgb(226, 232, 240); // #e2e8f0
            btn.Font = new Font("Segoe UI", 9f, FontStyle.Bold);
            btn.Cursor = Cursors.Hand;
            btn.Margin = new Padding(3, 2, 3, 2);
            btn.Padding = new Padding(8, 0, 8, 0);
            btn.FlatAppearance.BorderSize = 1;
            btn.FlatAppearance.BorderColor = Color.FromArgb(51, 65, 85);
            btn.FlatAppearance.MouseOverBackColor = Color.FromArgb(6, 182, 212); // #06b6d4 (Cyan)
            btn.FlatAppearance.MouseDownBackColor = Color.FromArgb(8, 145, 178);

            btn.MouseEnter += (s, e) => {
                string src = (webView != null && webView.Source != null) ? webView.Source.ToString() : "";
                string tag = btn.Tag != null ? btn.Tag.ToString() : "";
                if (tag != src) {
                    btn.ForeColor = Color.FromArgb(15, 23, 42);
                }
            };
            btn.MouseLeave += (s, e) => {
                UpdateNavButtonHighlight();
            };

            btn.Click += (s, e) =>
            {
                if (webView != null && webView.CoreWebView2 != null)
                {
                    webView.CoreWebView2.Navigate(targetUrl);
                }
            };
            return btn;
        }

        private Button CreateControlButton(string text, string tooltip, EventHandler onClick)
        {
            Button btn = new Button();
            btn.Text = text;
            btn.Width = 38;
            btn.Height = 38;
            btn.FlatStyle = FlatStyle.Flat;
            btn.BackColor = Color.FromArgb(30, 41, 59);
            btn.ForeColor = Color.FromArgb(148, 163, 184);
            btn.Font = new Font("Segoe UI", 10f, FontStyle.Bold);
            btn.Cursor = Cursors.Hand;
            btn.Margin = new Padding(2, 2, 2, 2);
            btn.FlatAppearance.BorderSize = 1;
            btn.FlatAppearance.BorderColor = Color.FromArgb(51, 65, 85);
            btn.FlatAppearance.MouseOverBackColor = Color.FromArgb(51, 65, 85);
            btn.FlatAppearance.MouseDownBackColor = Color.FromArgb(71, 85, 105);

            ToolTip tt = new ToolTip();
            tt.SetToolTip(btn, tooltip);

            btn.Click += onClick;
            return btn;
        }

        private async void InitializeWebViewAsync()
        {
            try
            {
                statusLabel.Text = "⏳ Inisialisasi engine...";
                string userDataFolder = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "PortalIskakFatoni",
                    "WebView2UserData"
                );

                Directory.CreateDirectory(userDataFolder);

                CoreWebView2Environment env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
                await webView.EnsureCoreWebView2Async(env);

                // Configure CoreWebView2 settings
                webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
                webView.CoreWebView2.Settings.AreDevToolsEnabled = true;
                webView.CoreWebView2.Settings.IsZoomControlEnabled = true;

                // Auto grant camera permission for student / teacher QR scanning
                webView.CoreWebView2.PermissionRequested += (s, e) =>
                {
                    if (e.PermissionKind == CoreWebView2PermissionKind.Camera ||
                        e.PermissionKind == CoreWebView2PermissionKind.Microphone ||
                        e.PermissionKind == CoreWebView2PermissionKind.Geolocation)
                    {
                        e.State = CoreWebView2PermissionState.Allow;
                    }
                };

                // Track navigation lifecycle
                webView.CoreWebView2.NavigationStarting += (s, e) =>
                {
                    progressBar.Visible = true;
                    statusLabel.Text = "⏳ Memuat...";
                };

                webView.CoreWebView2.NavigationCompleted += (s, e) =>
                {
                    progressBar.Visible = false;
                    statusLabel.Text = e.IsSuccess ? "⚡ Siap" : "❌ Gagal memuat";
                    btnBack.Enabled = webView.CanGoBack;
                    btnForward.Enabled = webView.CanGoForward;
                    UpdateNavButtonHighlight();
                };

                webView.CoreWebView2.SourceChanged += (s, e) =>
                {
                    UpdateNavButtonHighlight();
                };

                // Navigate to Portal Start Page
                webView.CoreWebView2.Navigate(URL_PORTAL);
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Gagal menginisialisasi Microsoft WebView2 Runtime:\n\n" + ex.Message +
                    "\n\nPastikan Microsoft Edge WebView2 Runtime terpasang di komputer Anda.",
                    "Error WebView2",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }

        private void UpdateNavButtonHighlight()
        {
            if (webView == null || webView.Source == null) return;
            string currentUrl = webView.Source.ToString().ToLower();

            Button[] buttons = new Button[] { btnNavPortal, btnNavAbsensi, btnNavGuru, btnNavRekap, btnNavDatabase, btnNavAdmin };

            foreach (Button btn in buttons)
            {
                if (btn.Tag == null) continue;
                string target = btn.Tag.ToString().ToLower();
                bool isActive = currentUrl.StartsWith(target) || (target.Contains("portal.html") && currentUrl.EndsWith("/portal-iskakfatoni/"));

                if (isActive)
                {
                    btn.BackColor = Color.FromArgb(6, 182, 212); // Cyan Active #06b6d4
                    btn.ForeColor = Color.FromArgb(15, 23, 42); // Dark Text
                    btn.FlatAppearance.BorderColor = Color.FromArgb(34, 211, 238);
                }
                else
                {
                    btn.BackColor = Color.FromArgb(30, 41, 59); // Dark Slate #1e293b
                    btn.ForeColor = Color.FromArgb(226, 232, 240);
                    btn.FlatAppearance.BorderColor = Color.FromArgb(51, 65, 85);
                }
            }
        }

        private void ToggleFullscreen()
        {
            if (!isFullscreen)
            {
                prevWindowState = this.WindowState;
                prevBorderStyle = this.FormBorderStyle;

                this.FormBorderStyle = FormBorderStyle.None;
                this.WindowState = FormWindowState.Maximized;
                isFullscreen = true;
                btnFullscreen.Text = "🗗";
                btnFullscreen.BackColor = Color.FromArgb(6, 182, 212);
                btnFullscreen.ForeColor = Color.FromArgb(15, 23, 42);
            }
            else
            {
                this.FormBorderStyle = prevBorderStyle;
                this.WindowState = prevWindowState;
                isFullscreen = false;
                btnFullscreen.Text = "⛶";
                btnFullscreen.BackColor = Color.FromArgb(30, 41, 59);
                btnFullscreen.ForeColor = Color.FromArgb(148, 163, 184);
            }
        }

        private void MainForm_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.KeyCode == Keys.F11)
            {
                ToggleFullscreen();
                e.Handled = true;
            }
            else if (e.KeyCode == Keys.F5)
            {
                if (webView != null) webView.Reload();
                e.Handled = true;
            }
            else if (e.Alt && e.KeyCode == Keys.Left)
            {
                if (webView != null && webView.CanGoBack) webView.GoBack();
                e.Handled = true;
            }
            else if (e.Alt && e.KeyCode == Keys.Right)
            {
                if (webView != null && webView.CanGoForward) webView.GoForward();
                e.Handled = true;
            }
        }
    }
}
