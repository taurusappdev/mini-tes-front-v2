<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mini TES</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    {{-- CSS simple por ahora --}}
    <style>
        body {
            margin: 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #f4f4f4;
        }
        .layout {
            display: flex;
            min-height: 100vh;
        }
        .sidebar {
            width: 220px;
            background: #2C3E50;
            color: #ecf0f1;
            padding: 16px;
        }
        .sidebar h2 {
            margin-top: 0;
            font-size: 18px;
            text-align: center;
        }
        .sidebar a {
            display: block;
            color: #ecf0f1;
            text-decoration: none;
            padding: 8px 0;
            font-size: 14px;
        }
        .sidebar a:hover {
            text-decoration: underline;
        }
        .main {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        .topbar {
            background: #ffffff;
            border-bottom: 1px solid #ddd;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .topbar .logo {
            font-weight: bold;
            color: #2C3E50;
        }
        .topbar .user {
            font-size: 14px;
            color: #555;
        }
        .content {
            padding: 16px;
        }
    </style>
    @yield('head')
</head>
<body>
<div class="layout">
    <aside class="sidebar">
        <h2>MINI TES</h2>
        <a href="{{ route('admin.panel') }}">Panel de operación</a>
    </aside>
    <div class="main">
        <header class="topbar">
            <div class="logo">TES · Home</div>
            <div class="user">Usuario: Admin</div>
        </header>
        <main class="content">
            @yield('content')
        </main>
    </div>
</div>

@yield('scripts')
</body>
</html>
