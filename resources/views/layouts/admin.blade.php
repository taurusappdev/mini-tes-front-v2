<!DOCTYPE html>
<html lang="es">
<head>
  @stack('styles')
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  <title>@yield('title', 'Mini-TES')</title>

  {{-- CSS de plataforma --}}
  <link rel="stylesheet" href="{{ asset('css/admin.css') }}">
  
  {{-- CSS para el asistente AI --}}
  <link rel="stylesheet" href="{{ asset('css/asistente.css') }}">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js" defer></script>
</head>

<body class="app">

@php
  $route = request()->route() ? request()->route()->getName() : null;

  $nav = [
    ['name' => 'Home',       'route' => 'admin.panel',      'icon' => '🏠'],
    ['name' => 'Planeación', 'route' => 'admin.planeacion', 'icon' => '🧭'],
    ['name' => 'Checklists', 'route' => 'admin.checklists', 'icon' => '✅', 'soon' => true],
    ['name' => 'Tareas',     'route' => 'admin.tareas',     'icon' => '🗂️', 'soon' => true],
    ['name' => 'Acciones',   'route' => 'admin.acciones',   'icon' => '🛠️', 'soon' => true],
    ['name' => 'Dashboard',  'route' => 'admin.dashboard',  'icon' => '📊', 'soon' => true],
  ];
@endphp

<div class="layout">
  {{-- SIDEBAR --}}
  <aside class="sidebar">
    <div class="brand">
      <div class="brand__title">MINI-TES</div>
      <div class="brand__subtitle">Laboratorio 1:1 de TES</div>
    </div>

    <nav class="nav">
      @foreach ($nav as $item)
        @php
          $isActive = ($route === $item['route']);
          $isSoon = isset($item['soon']) && $item['soon'] === true;
        @endphp

        <a class="nav__link {{ $isActive ? 'is-active' : '' }}"
           href="{{ route($item['route']) }}">
          <span class="nav__icon">{{ $item['icon'] }}</span>
          <span class="nav__text">{{ $item['name'] }}</span>

          @if ($isSoon)
            <span class="badge">Próximamente</span>
          @endif
        </a>
      @endforeach
    </nav>

    <div class="sidebar__footer">
      <div class="muted">Ambiente: <strong>{{ app()->environment() }}</strong></div>
    </div>
  </aside>

  {{-- MAIN --}}
  <div class="main">
    <header class="topbar">
      <div class="topbar__left">
        <div class="page-title">@yield('page_title', 'Panel')</div>
        <div class="page-subtitle">@yield('page_subtitle', '')</div>
      </div>

      <div class="topbar__right">
        <span class="pill">GraphQL: {{ config('services.mini_tes.graphql_url') }}</span>
      </div>
    </header>

    <main class="content">
      @yield('content')
    </main>

    <footer class="footer">
      <span class="muted">Mini-TES • disciplina TES (feature → MR → develop → main)</span>
    </footer>
  </div>
</div>

{{-- Scripts por-app --}}
@stack('scripts')

{{-- Script del asistente AI --}}
<script src="{{ asset('js/asistente.js') }}" defer></script>
</body>
</html>